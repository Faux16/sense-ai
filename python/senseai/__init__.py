"""
SENSE Python Wrapper
~~~~~~~~~~~~~~~~~~~~~

Python wrapper for SENSE: Shadow Exposure & eNterprise Surveillance for AI.

Basic usage:

    >>> from senseai import SenseClient, SenseServer
    >>> 
    >>> # Start the backend server
    >>> server = SenseServer(port=8080)
    >>> server.start()
    >>> 
    >>> # Use the API client
    >>> client = SenseClient(base_url="http://localhost:8080")
    >>> findings = client.get_findings()
    >>> 
    >>> # Cleanup
    >>> server.stop()

:copyright: (c) 2024 by Sanket Sarkar.
:license: MIT, see LICENSE for more details.
"""

__version__ = "0.1.0"
__author__ = "Sanket Sarkar"
__license__ = "MIT"

from senseai.client import SenseClient
from senseai.server import SenseServer
from senseai.exceptions import (
    SenseError,
    BinaryNotFoundError,
    ServerError,
    APIError,
)

__all__ = [
    "SenseClient",
    "SenseServer",
    "SenseError",
    "BinaryNotFoundError",
    "ServerError",
    "APIError",
    "__version__",
]
