"""Tests for API client."""

from unittest.mock import MagicMock, patch

import pytest
import requests

from senseai.client import SenseClient
from senseai.exceptions import APIError


class TestSenseClient:
    """Test suite for SenseClient."""

    def test_init(self):
        """Test client initialization."""
        client = SenseClient(base_url="http://localhost:9000", timeout=60)
        
        assert client.base_url == "http://localhost:9000"
        assert client.timeout == 60

    def test_health_check_success(self):
        """Test successful health check."""
        client = SenseClient()
        
        with patch.object(client.session, "get") as mock_get:
            mock_get.return_value = MagicMock(status_code=200)
            
            assert client.health_check() is True

    def test_health_check_failure(self):
        """Test failed health check."""
        client = SenseClient()
        
        with patch.object(client.session, "get", side_effect=requests.exceptions.ConnectionError):
            assert client.health_check() is False

    def test_get_findings_success(self):
        """Test successful findings retrieval."""
        client = SenseClient()
        
        mock_findings = [
            {"id": 1, "type": "network", "severity": 8.0},
            {"id": 2, "type": "endpoint", "severity": 5.0},
        ]
        
        with patch.object(client.session, "get") as mock_get:
            mock_get.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_findings
            )
            
            findings = client.get_findings()
            assert len(findings) == 2
            assert findings[0]["id"] == 1

    def test_get_findings_with_limit(self):
        """Test findings retrieval with limit."""
        client = SenseClient()
        
        mock_findings = [
            {"id": 1, "type": "network", "severity": 8.0},
            {"id": 2, "type": "endpoint", "severity": 5.0},
            {"id": 3, "type": "network", "severity": 6.0},
        ]
        
        with patch.object(client.session, "get") as mock_get:
            mock_get.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_findings
            )
            
            findings = client.get_findings(limit=2)
            assert len(findings) == 2

    def test_get_findings_api_error(self):
        """Test API error handling."""
        client = SenseClient()
        
        with patch.object(client.session, "get", side_effect=requests.exceptions.RequestException("Connection error")):
            with pytest.raises(APIError):
                client.get_findings()

    def test_get_finding_by_id(self):
        """Test getting specific finding by ID."""
        client = SenseClient()
        
        mock_findings = [
            {"id": 1, "type": "network", "severity": 8.0},
            {"id": 2, "type": "endpoint", "severity": 5.0},
        ]
        
        with patch.object(client, "get_findings", return_value=mock_findings):
            finding = client.get_finding_by_id(2)
            assert finding["id"] == 2
            assert finding["type"] == "endpoint"

    def test_get_finding_by_id_not_found(self):
        """Test getting non-existent finding."""
        client = SenseClient()
        
        with patch.object(client, "get_findings", return_value=[]):
            finding = client.get_finding_by_id(999)
            assert finding is None

    def test_get_findings_by_type(self):
        """Test filtering findings by type."""
        client = SenseClient()
        
        mock_findings = [
            {"id": 1, "type": "network", "severity": 8.0},
            {"id": 2, "type": "endpoint", "severity": 5.0},
            {"id": 3, "type": "network", "severity": 6.0},
        ]
        
        with patch.object(client, "get_findings", return_value=mock_findings):
            network_findings = client.get_findings_by_type("network")
            assert len(network_findings) == 2
            assert all(f["type"] == "network" for f in network_findings)

    def test_get_findings_by_severity(self):
        """Test filtering findings by severity."""
        client = SenseClient()
        
        mock_findings = [
            {"id": 1, "type": "network", "severity": 8.0},
            {"id": 2, "type": "endpoint", "severity": 5.0},
            {"id": 3, "type": "network", "severity": 6.0},
        ]
        
        with patch.object(client, "get_findings", return_value=mock_findings):
            high_severity = client.get_findings_by_severity(min_severity=6.0)
            assert len(high_severity) == 2
            assert all(f["severity"] >= 6.0 for f in high_severity)

    def test_context_manager(self):
        """Test context manager usage."""
        with patch.object(SenseClient, "close") as mock_close:
            with SenseClient() as client:
                assert isinstance(client, SenseClient)
            
            mock_close.assert_called_once()
