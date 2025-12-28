"""Binary management for SENSE Go backend."""

import os
import platform
import stat
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Optional, Tuple

from senseai.exceptions import BinaryNotFoundError


class BinaryManager:
    """Manages the SENSE Go binary installation and location."""

    GITHUB_REPO = "Faux16/sense-ai"
    BINARY_NAME = "sense"

    def __init__(self, version: str = "latest"):
        """
        Initialize the binary manager.

        Args:
            version: Version of the binary to use (default: "latest")
        """
        self.version = version
        self._binary_path: Optional[Path] = None

    @staticmethod
    def get_platform_info() -> Tuple[str, str]:
        """
        Detect the current platform and architecture.

        Returns:
            Tuple of (os_name, architecture)
            e.g., ("darwin", "arm64"), ("linux", "amd64"), ("windows", "amd64")
        """
        system = platform.system().lower()
        machine = platform.machine().lower()

        # Normalize OS name
        os_name = {
            "darwin": "darwin",
            "linux": "linux",
            "windows": "windows",
        }.get(system, system)

        # Normalize architecture
        arch = {
            "x86_64": "amd64",
            "amd64": "amd64",
            "arm64": "arm64",
            "aarch64": "arm64",
        }.get(machine, machine)

        return os_name, arch

    def get_cache_dir(self) -> Path:
        """
        Get the cache directory for storing binaries.

        Returns:
            Path to cache directory
        """
        if sys.platform == "win32":
            cache_dir = Path(os.environ.get("LOCALAPPDATA", "~/.cache")) / "senseai"
        elif sys.platform == "darwin":
            cache_dir = Path.home() / "Library" / "Caches" / "senseai"
        else:
            cache_dir = Path(os.environ.get("XDG_CACHE_HOME", "~/.cache")) / "senseai"

        cache_dir = cache_dir.expanduser()
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir

    def get_binary_path(self) -> Path:
        """
        Get the path to the SENSE binary.

        Returns:
            Path to the binary

        Raises:
            BinaryNotFoundError: If binary cannot be found or downloaded
        """
        if self._binary_path and self._binary_path.exists():
            return self._binary_path

        # Strategy 1: Check if 'sense' is in PATH
        binary_in_path = self._find_in_path()
        if binary_in_path:
            self._binary_path = binary_in_path
            return self._binary_path

        # Strategy 2: Check if binary exists in project root (development mode)
        project_root = Path(__file__).parent.parent.parent.parent
        dev_binary = project_root / "sense"
        if dev_binary.exists():
            self._binary_path = dev_binary
            return self._binary_path

        # Strategy 3: Check cache directory
        cache_binary = self.get_cache_dir() / self.BINARY_NAME
        if cache_binary.exists():
            self._binary_path = cache_binary
            self._make_executable(self._binary_path)
            return self._binary_path

        # Strategy 4: Download from GitHub Releases
        try:
            downloaded_binary = self._download_binary()
            self._binary_path = downloaded_binary
            return self._binary_path
        except Exception as e:
            raise BinaryNotFoundError(
                f"Could not find or download SENSE binary. "
                f"Please build it manually or check your internet connection. Error: {e}"
            )

    def _find_in_path(self) -> Optional[Path]:
        """
        Search for the binary in system PATH.

        Returns:
            Path to binary if found, None otherwise
        """
        try:
            result = subprocess.run(
                ["which", self.BINARY_NAME],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode == 0 and result.stdout.strip():
                return Path(result.stdout.strip())
        except Exception:
            pass
        return None

    def _download_binary(self) -> Path:
        """
        Download the binary from GitHub Releases.

        Returns:
            Path to downloaded binary

        Raises:
            BinaryNotFoundError: If download fails
        """
        os_name, arch = self.get_platform_info()
        
        # Construct download URL
        # Format: https://github.com/Faux16/sense-ai/releases/download/v0.1.0/sense-darwin-arm64
        if self.version == "latest":
            # For now, we'll use a specific version since "latest" requires API calls
            version_tag = "v0.1.0"
        else:
            version_tag = f"v{self.version}" if not self.version.startswith("v") else self.version

        binary_name = f"sense-{os_name}-{arch}"
        if os_name == "windows":
            binary_name += ".exe"

        download_url = (
            f"https://github.com/{self.GITHUB_REPO}/releases/download/"
            f"{version_tag}/{binary_name}"
        )

        # Download to cache directory
        cache_dir = self.get_cache_dir()
        target_path = cache_dir / self.BINARY_NAME
        if os_name == "windows":
            target_path = cache_dir / f"{self.BINARY_NAME}.exe"

        print(f"Downloading SENSE binary from {download_url}...")
        try:
            urllib.request.urlretrieve(download_url, target_path)
        except Exception as e:
            raise BinaryNotFoundError(
                f"Failed to download binary from {download_url}. "
                f"You may need to build the binary manually. Error: {e}"
            )

        # Make executable
        self._make_executable(target_path)

        print(f"Binary downloaded to {target_path}")
        return target_path

    @staticmethod
    def _make_executable(path: Path) -> None:
        """
        Make a file executable.

        Args:
            path: Path to the file
        """
        if sys.platform != "win32":
            current_permissions = os.stat(path).st_mode
            os.chmod(path, current_permissions | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    def verify_binary(self) -> bool:
        """
        Verify that the binary is working.

        Returns:
            True if binary is working, False otherwise
        """
        try:
            binary_path = self.get_binary_path()
            result = subprocess.run(
                [str(binary_path), "--help"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            return result.returncode == 0
        except Exception:
            return False
