# ==============================================================================
# exceptions.py - Domain Exceptions and Global Middleware Exception Handlers
# ==============================================================================

from fastapi import Request, status
from fastapi.responses import JSONResponse
from backend.app.core.logging import setup_logger

logger = setup_logger("exceptions_handler")


class VisionTrackException(Exception):
    """Base exception class for all domain-specific errors in the platform."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class DatabaseException(VisionTrackException):
    """Raised when structured persistence layer commands fail or time out."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeviceNotAvailableException(VisionTrackException):
    """Raised if configured hardware accelerators (CUDA/MPS) are absent."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


class ModelLoadException(VisionTrackException):
    """Raised when AI Engine fails to read neural networks weight blobs."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Standardizes unhandled system and core python exceptions into REST JSON.
    Guarantees API security by masking traceback details in production modes.
    """
    # Check if custom platform domain exception
    if isinstance(exc, VisionTrackException):
        logger.warning(f"Domain exception on {request.url.path}: {exc.message} (Code: {exc.status_code})")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "type": exc.__class__.__name__,
                    "message": exc.message,
                    "code": exc.status_code
                }
            }
        )

    # General unhandled programming/server exceptions
    logger.error(f"Unhandled system crash on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "type": "InternalServerError",
                "message": "An unexpected server-side error occurred. The incident has been logged.",
                "code": 500
            }
        }
    )
