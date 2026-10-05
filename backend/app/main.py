# ==============================================================================
# main.py - VisionTrack AI FastAPI Enterprise Server Bootstrapper
# ==============================================================================

from contextlib import asynccontextmanager
from fastapi import FastAPI, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.logging import setup_logger
from backend.app.core.exceptions import global_exception_handler, VisionTrackException
from backend.app.middleware.middleware import RequestTimingMiddleware
from backend.app.database.database import verify_database_connection
from backend.app.api.dependencies import get_db
from backend.app.routes.camera import router as camera_router

# Initialize main logging agency
logger = setup_logger("server_bootstrap")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles stateful startup and shutdown hook events of the web service context.
    Pre-warms DB pools, confirms cloud persistence connectivity, logs shutdown alerts.
    """
    logger.info("Initializing VisionTrack AI Backend Service...")
    
    # Run critical startup system dependency verifications
    db_operational = verify_database_connection()
    if not db_operational:
        logger.warning("Startup database check was unsuccessful. Service is starting with degraded database mode.")
    else:
        logger.info("Startup database verifications succeeded.")

    logger.info("Server startup sequence completed successfully. Port: 8000")
    yield
    
    logger.info("Shutting down VisionTrack AI Backend Service...")
    logger.info("Closing persistent connections. System Offline.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Multi-Stream Computer Vision & Video Analytic platform.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=f"{settings.API_PREFIX}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_PREFIX}/redoc" if settings.DEBUG else None,
    openapi_url=f"{settings.API_PREFIX}/openapi.json" if settings.DEBUG else None,
)

# Apply CORS (Cross-Origin Resource Sharing) restrictions safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply customized request timing middleware
app.add_middleware(RequestTimingMiddleware)

# Bind global exception handling middleware
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(VisionTrackException, global_exception_handler)

# Include RTSP Camera streams router
app.include_router(camera_router, prefix="/api/v1/cameras", tags=["Cameras"])


# ==============================================================================
# CORE SYSTEM ENDPOINTS (Health, Diagnostics, Metrics)
# ==============================================================================

@app.get("/api/health", status_code=status.HTTP_200_OK, tags=["System Health"])
async def health_check():
    """
    Liveness probe. Used by orchestrators (Kubernetes/Cloud Run) to verify container state.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "api_version": "1.0.0"
    }


@app.get("/api/version", status_code=status.HTTP_200_OK, tags=["System Diagnostics"])
async def version_diagnostics():
    """
    Readiness and specification mapping endpoint.
    Reports operational parameters and supported computer vision model configurations.
    """
    return {
        "engine": "FastAPI",
        "api_prefix": settings.API_PREFIX,
        "vision_specs": {
            "default_weights": settings.YOLO_MODEL_NAME,
            "target_accelerator": settings.CV_DEVICE,
            "detection_threshold": settings.CONFIDENCE_THRESHOLD,
            "iou_threshold": settings.IOU_THRESHOLD
        },
        "storage": {
            "active_provider": settings.STORAGE_PROVIDER,
            "storage_path": settings.STORAGE_BASE_PATH
        }
    }
