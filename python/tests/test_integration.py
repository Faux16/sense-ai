"""Integration tests for SENSE Python wrapper."""

import time
from pathlib import Path

import pytest

from senseai import SenseClient, SenseServer
from senseai.exceptions import ServerError


# Skip integration tests if Go binary is not available
def check_binary_available():
    """Check if the Go binary is available."""
    try:
        from senseai.binary import BinaryManager
        manager = BinaryManager()
        manager.get_binary_path()
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not check_binary_available(),
    reason="Go binary not available. Build it first with: go build -o sense cmd/sense/main.go"
)


class TestIntegration:
    """Integration tests with actual Go backend."""

    def test_server_lifecycle(self):
        """Test starting and stopping the server."""
        server = SenseServer(port=8081, db_path="/tmp/test_sense.db")
        
        try:
            # Start server
            server.start()
            assert server.is_running()
            
            # Check status
            status = server.get_status()
            assert status["running"] is True
            assert status["port"] == 8081
            
            # Stop server
            server.stop()
            assert not server.is_running()
            
        finally:
            # Cleanup
            if server.is_running():
                server.stop()

    def test_client_health_check(self):
        """Test client health check with running server."""
        server = SenseServer(port=8082, db_path="/tmp/test_sense.db")
        
        try:
            server.start()
            
            client = SenseClient(base_url="http://localhost:8082")
            assert client.health_check() is True
            
        finally:
            server.stop()

    def test_get_findings(self):
        """Test retrieving findings from server."""
        server = SenseServer(port=8083, db_path="/tmp/test_sense.db")
        
        try:
            server.start()
            
            client = SenseClient(base_url="http://localhost:8083")
            
            # Get findings (may be empty initially)
            findings = client.get_findings()
            assert isinstance(findings, list)
            
        finally:
            server.stop()

    def test_context_managers(self):
        """Test using context managers."""
        with SenseServer(port=8084, db_path="/tmp/test_sense.db") as server:
            assert server.is_running()
            
            with SenseClient(base_url="http://localhost:8084") as client:
                assert client.health_check()
                findings = client.get_findings()
                assert isinstance(findings, list)

    def test_server_restart(self):
        """Test server restart functionality."""
        server = SenseServer(port=8085, db_path="/tmp/test_sense.db")
        
        try:
            server.start()
            assert server.is_running()
            
            # Restart
            server.restart()
            assert server.is_running()
            
            # Verify it's still accessible
            client = SenseClient(base_url="http://localhost:8085")
            assert client.health_check()
            
        finally:
            server.stop()

    def test_multiple_clients(self):
        """Test multiple clients connecting to same server."""
        server = SenseServer(port=8086, db_path="/tmp/test_sense.db")
        
        try:
            server.start()
            
            client1 = SenseClient(base_url="http://localhost:8086")
            client2 = SenseClient(base_url="http://localhost:8086")
            
            assert client1.health_check()
            assert client2.health_check()
            
            findings1 = client1.get_findings()
            findings2 = client2.get_findings()
            
            # Both should get the same data
            assert findings1 == findings2
            
        finally:
            server.stop()
