# ==============================================================================
# middleware.py - Request Timing, Request Profiling, & Logging Middlewares
# ==============================================================================

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from backend.app.core.logging import setup_logger

logger = setup_logger("timing_middleware")


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """
    Measures duration of every backend request-response cycle.
    Exposes process latency headers to client browsers for telemetry validation.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Proceed with request pipeline
        response = await call_next(request)
        
        # Calculate milliseconds elapsed
        duration = (time.time() - start_time) * 1000
        logger.debug(f"{request.method} {request.url.path} handled in {duration:.2f}ms")
        
        # Append elapsed telemetry to browser response headers
        response.headers["X-Response-Time-Ms"] = f"{duration:.2f}"
        return response
