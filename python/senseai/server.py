"""Server process manager for SENSE Go backend."""

import atexit
import os
import signal
import subprocess
import time
from pathlib import Path
from typing import Optional

import psutil

from senseai.binary import BinaryManager
from senseai.client import SenseClient
from senseai.exceptions import ServerError


class SenseServer:
    """Manages the SENSE Go backend server process."""

    def __init__(
        self,
        port: int = 8080,
        interface: str = "en0",
        db_path: Optional[str] = None,
        policy_file: Optional[str] = None,
        use_sudo: bool = False,
    ):
        """
        Initialize the SENSE server manager.

        Args:
            port: Port to run the server on
            interface: Network interface to monitor
            db_path: Path to SQLite database file
            policy_file: Path to policies YAML file
            use_sudo: Whether to run with sudo (required for network scanning)
        """
        self.port = port
        self.interface = interface
        self.db_path = db_path or "/tmp/sense.db"
        self.policy_file = policy_file or "policies.yaml"
        self.use_sudo = use_sudo
        
        self.binary_manager = BinaryManager()
        self.process: Optional[subprocess.Popen] = None
        self._pid_file = Path.home() / ".senseai" / "server.pid"
        
        # Register cleanup on exit
        atexit.register(self.stop)

    def start(self, wait_for_ready: bool = True, timeout: int = 30) -> None:
        """
        Start the SENSE backend server.

        Args:
            wait_for_ready: Wait for server to be ready before returning
            timeout: Maximum time to wait for server to be ready (seconds)

        Raises:
            ServerError: If server fails to start
        """
        if self.is_running():
            print(f"SENSE server is already running on port {self.port}")
            return

        # Get binary path
        try:
            binary_path = self.binary_manager.get_binary_path()
        except Exception as e:
            raise ServerError(f"Failed to locate SENSE binary: {e}")

        # Build command
        cmd = []
        if self.use_sudo:
            cmd.append("sudo")
        
        cmd.extend([
            str(binary_path),
            "--port", str(self.port),
            "--interface", self.interface,
            "--db", self.db_path,
        ])
        
        if self.policy_file:
            cmd.extend(["--policies", self.policy_file])

        # Start process
        try:
            print(f"Starting SENSE server on port {self.port}...")
            if self.use_sudo:
                print("Note: Running with sudo for network scanning capabilities")
            
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            
            # Save PID
            self._save_pid(self.process.pid)
            
            # Wait for server to be ready
            if wait_for_ready:
                self._wait_for_ready(timeout)
            
            print(f"SENSE server started successfully (PID: {self.process.pid})")
            
        except Exception as e:
            raise ServerError(f"Failed to start SENSE server: {e}")

    def stop(self, timeout: int = 10) -> None:
        """
        Stop the SENSE backend server.

        Args:
            timeout: Maximum time to wait for graceful shutdown (seconds)
        """
        if not self.is_running():
            return

        try:
            if self.process:
                print("Stopping SENSE server...")
                
                # Try graceful shutdown first
                self.process.terminate()
                
                try:
                    self.process.wait(timeout=timeout)
                except subprocess.TimeoutExpired:
                    # Force kill if graceful shutdown fails
                    print("Forcing server shutdown...")
                    self.process.kill()
                    self.process.wait()
                
                self.process = None
                print("SENSE server stopped")
            
            # Clean up PID file
            self._remove_pid()
            
        except Exception as e:
            raise ServerError(f"Failed to stop SENSE server: {e}")

    def restart(self, timeout: int = 30) -> None:
        """
        Restart the SENSE backend server.

        Args:
            timeout: Maximum time to wait for server to be ready (seconds)
        """
        self.stop()
        time.sleep(1)  # Brief pause between stop and start
        self.start(wait_for_ready=True, timeout=timeout)

    def is_running(self) -> bool:
        """
        Check if the SENSE server is running.

        Returns:
            True if server is running, False otherwise
        """
        # Check if process object exists and is alive
        if self.process and self.process.poll() is None:
            return True
        
        # Check PID file
        pid = self._read_pid()
        if pid:
            try:
                process = psutil.Process(pid)
                return process.is_running() and "sense" in process.name().lower()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        # Check if port is in use
        client = SenseClient(base_url=f"http://localhost:{self.port}")
        return client.health_check()

    def get_status(self) -> dict:
        """
        Get the current status of the SENSE server.

        Returns:
            Dictionary with status information
        """
        is_running = self.is_running()
        status = {
            "running": is_running,
            "port": self.port,
            "interface": self.interface,
            "db_path": self.db_path,
        }
        
        if is_running:
            pid = self._read_pid() or (self.process.pid if self.process else None)
            if pid:
                try:
                    process = psutil.Process(pid)
                    status["pid"] = pid
                    status["cpu_percent"] = process.cpu_percent()
                    status["memory_mb"] = process.memory_info().rss / 1024 / 1024
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        
        return status

    def _wait_for_ready(self, timeout: int) -> None:
        """
        Wait for the server to be ready to accept connections.

        Args:
            timeout: Maximum time to wait (seconds)

        Raises:
            ServerError: If server doesn't become ready in time
        """
        client = SenseClient(base_url=f"http://localhost:{self.port}")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if client.health_check():
                return
            
            # Check if process died
            if self.process and self.process.poll() is not None:
                stderr = self.process.stderr.read() if self.process.stderr else ""
                raise ServerError(f"Server process died unexpectedly: {stderr}")
            
            time.sleep(0.5)
        
        raise ServerError(f"Server failed to become ready within {timeout} seconds")

    def _save_pid(self, pid: int) -> None:
        """Save process ID to file."""
        self._pid_file.parent.mkdir(parents=True, exist_ok=True)
        self._pid_file.write_text(str(pid))

    def _read_pid(self) -> Optional[int]:
        """Read process ID from file."""
        if self._pid_file.exists():
            try:
                return int(self._pid_file.read_text().strip())
            except (ValueError, IOError):
                pass
        return None

    def _remove_pid(self) -> None:
        """Remove PID file."""
        if self._pid_file.exists():
            self._pid_file.unlink()

    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop()
