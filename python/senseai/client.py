"""REST API client for SENSE backend."""

import json
from typing import Any, Dict, Generator, List, Optional

import requests
import sseclient

from senseai.exceptions import APIError


class SenseClient:
    """Client for interacting with the SENSE REST API."""

    def __init__(
        self,
        base_url: str = "http://localhost:8080",
        timeout: int = 30,
    ):
        """
        Initialize the SENSE API client.

        Args:
            base_url: Base URL of the SENSE API server
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def health_check(self) -> bool:
        """
        Check if the SENSE server is running and responsive.

        Returns:
            True if server is healthy, False otherwise
        """
        try:
            response = self.session.get(
                f"{self.base_url}/findings",
                timeout=5,
            )
            return response.status_code == 200
        except Exception:
            return False

    def get_findings(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieve all findings from the SENSE backend.

        Args:
            limit: Optional limit on number of findings to return

        Returns:
            List of finding dictionaries

        Raises:
            APIError: If the API request fails
        """
        try:
            response = self.session.get(
                f"{self.base_url}/findings",
                timeout=self.timeout,
            )
            response.raise_for_status()
            
            findings = response.json()
            
            if limit is not None and isinstance(findings, list):
                findings = findings[:limit]
            
            return findings if isinstance(findings, list) else []
            
        except requests.exceptions.RequestException as e:
            raise APIError(f"Failed to fetch findings: {e}")
        except json.JSONDecodeError as e:
            raise APIError(f"Failed to parse API response: {e}")

    def stream_findings(self) -> Generator[Dict[str, Any], None, None]:
        """
        Stream real-time findings from the SENSE backend using Server-Sent Events.

        Yields:
            Finding dictionaries as they are detected

        Raises:
            APIError: If the stream connection fails
        """
        try:
            response = self.session.get(
                f"{self.base_url}/stream",
                stream=True,
                timeout=None,  # No timeout for streaming
                headers={"Accept": "text/event-stream"},
            )
            response.raise_for_status()

            client = sseclient.SSEClient(response)
            
            for event in client.events():
                if event.event == "finding":
                    try:
                        finding = json.loads(event.data)
                        yield finding
                    except json.JSONDecodeError:
                        # Skip malformed events
                        continue
                elif event.event == "connected":
                    # Initial connection event, skip
                    continue

        except requests.exceptions.RequestException as e:
            raise APIError(f"Failed to stream findings: {e}")
        except KeyboardInterrupt:
            # Allow graceful shutdown
            return

    def get_finding_by_id(self, finding_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a specific finding by ID.

        Args:
            finding_id: ID of the finding to retrieve

        Returns:
            Finding dictionary if found, None otherwise

        Raises:
            APIError: If the API request fails
        """
        findings = self.get_findings()
        for finding in findings:
            if finding.get("id") == finding_id:
                return finding
        return None

    def get_findings_by_type(self, finding_type: str) -> List[Dict[str, Any]]:
        """
        Get all findings of a specific type.

        Args:
            finding_type: Type of findings to retrieve (e.g., "network", "endpoint")

        Returns:
            List of finding dictionaries

        Raises:
            APIError: If the API request fails
        """
        findings = self.get_findings()
        return [f for f in findings if f.get("type") == finding_type]

    def get_findings_by_severity(
        self,
        min_severity: float = 0.0,
        max_severity: float = 10.0,
    ) -> List[Dict[str, Any]]:
        """
        Get findings within a severity range.

        Args:
            min_severity: Minimum severity (inclusive)
            max_severity: Maximum severity (inclusive)

        Returns:
            List of finding dictionaries

        Raises:
            APIError: If the API request fails
        """
        findings = self.get_findings()
        return [
            f
            for f in findings
            if min_severity <= f.get("severity", 0) <= max_severity
        ]

    def close(self) -> None:
        """Close the HTTP session."""
        self.session.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
