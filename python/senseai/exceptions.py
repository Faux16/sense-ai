"""Custom exceptions for SENSE Python wrapper."""


class SenseError(Exception):
    """Base exception for all SENSE-related errors."""
    pass


class BinaryNotFoundError(SenseError):
    """Raised when the SENSE binary cannot be found or downloaded."""
    pass


class ServerError(SenseError):
    """Raised when there's an error with the SENSE backend server."""
    pass


class APIError(SenseError):
    """Raised when there's an error communicating with the SENSE API."""
    pass
