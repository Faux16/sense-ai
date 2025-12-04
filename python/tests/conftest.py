"""Pytest configuration and fixtures."""

import pytest


@pytest.fixture
def mock_findings():
    """Mock findings data for testing."""
    return [
        {
            "id": 1,
            "type": "network",
            "details": "API call to api.openai.com detected",
            "severity": 8.0,
            "timestamp": "2024-12-03T09:00:00Z",
            "source": '{"src_ip": "192.168.1.100", "dst_ip": "104.18.7.192"}',
        },
        {
            "id": 2,
            "type": "endpoint",
            "details": "Python process with TensorFlow detected",
            "severity": 5.0,
            "timestamp": "2024-12-03T09:01:00Z",
            "source": '{"pid": 1234, "name": "python3"}',
        },
        {
            "id": 3,
            "type": "network",
            "details": "API call to api.huggingface.co detected",
            "severity": 7.5,
            "timestamp": "2024-12-03T09:02:00Z",
            "source": '{"src_ip": "192.168.1.100", "dst_ip": "13.225.78.123"}',
        },
    ]
