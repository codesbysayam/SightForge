import logging
import time
from functools import lru_cache
from typing import Any, Dict

import cv2
import numpy as np

from fastapi import APIRouter, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from backend.app.cv.config import CVConfig
from backend.app.cv.pipeline import CVPipeline

router = APIRouter()
logger = logging.getLogger("sightforge.cv")

_pipeline_instance = None

def get_pipeline() -> CVPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = CVPipeline(CVConfig())
    return _pipeline_instance


@router.get("/health")
async def cv_health():
    try:
        pipeline = get_pipeline()
        is_ready = pipeline.detector.is_loaded if pipeline.detector else False
        return {
            "status": "ready" if is_ready else "degraded",
            "detector_loaded": is_ready,
            "model": pipeline.config.person_model,
            "device": pipeline.config.device,
            "tracking_enabled": pipeline.config.tracking_enabled,
            "pose_enabled": pipeline.config.pose_enabled,
        }
    except Exception as e:
        logger.exception(f"CV health check failed: {e}")
        return {
            "status": "unavailable",
            "detector_loaded": False,
            "error": str(e),
        }


@router.post("/frame")
async def process_frame(
    file: UploadFile = File(...),
    confidence: float = 0.30,
    iou: float = 0.45,
):
    if not 0.0 <= confidence <= 1.0:
        raise HTTPException(
            status_code=422,
            detail="Confidence must be between 0 and 1.",
        )

    if not 0.0 <= iou <= 1.0:
        raise HTTPException(
            status_code=422,
            detail="IoU must be between 0 and 1.",
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/octet-stream",
    }

    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Upload a JPEG, PNG, or WebP frame.",
        )

    raw_bytes = await file.read()

    if not raw_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    if len(raw_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the 10 MB limit.",
        )

    encoded = np.frombuffer(raw_bytes, dtype=np.uint8)
    frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Image could not be decoded.",
        )

    try:
        pipeline = get_pipeline()
        if pipeline.detector and pipeline.detector.is_loaded:
            pipeline.detector.set_thresholds(confidence=confidence, iou=iou)

        result = await run_in_threadpool(pipeline.process_frame, frame)
        return result.to_dict()

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("CV inference failed")
        raise HTTPException(
            status_code=503,
            detail=f"Computer vision inference failed: {exc}",
        ) from exc
