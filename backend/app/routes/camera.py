# ==============================================================================
# camera.py - FastAPI RTSP Camera Router API
# ==============================================================================

import random
from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.camera import CameraCreate, CameraResponse

router = APIRouter()

# Thread-safe-ish in-memory registry of active enterprise camera nodes
IN_MEMORY_CAM_REGISTRY: List[CameraResponse] = [
    CameraResponse(
        id="CAM-101",
        name="Facility Main Entrance",
        rtsp_url="rtsp://192.168.10.50:554/stream1",
        is_active=True,
        location="Building A, Lobby",
        resolution="1920x1080",
        fps=30,
        bitrate="4096 kbps",
        device_status="online",
        gpu_allocated="GPU-0 (8%)",
        active_tracks=5,
        classes=["Person", "Backpack", "Briefcase"],
        feed_url="https://picsum.photos/seed/gate/800/450"
    ),
    CameraResponse(
        id="CAM-102",
        name="North Perimeter Parking",
        rtsp_url="rtsp://192.168.10.51:554/stream1",
        is_active=True,
        location="Zone B, Lot 2",
        resolution="1920x1080",
        fps=25,
        bitrate="3072 kbps",
        device_status="online",
        gpu_allocated="GPU-0 (12%)",
        active_tracks=12,
        classes=["Car", "Truck", "License Plate", "Person"],
        feed_url="https://picsum.photos/seed/parking/800/450"
    ),
    CameraResponse(
        id="CAM-103",
        name="Warehouse Loading Dock B",
        rtsp_url="rtsp://192.168.20.12:554/live/feed",
        is_active=True,
        location="Distribution Wing",
        resolution="1280x720",
        fps=30,
        bitrate="2048 kbps",
        device_status="online",
        gpu_allocated="GPU-1 (6%)",
        active_tracks=3,
        classes=["Forklift", "Box", "Person", "Truck"],
        feed_url="https://picsum.photos/seed/warehouse/800/450"
    ),
    CameraResponse(
        id="CAM-104",
        name="Server Room Corridor",
        rtsp_url="rtsp://10.240.5.18:554/axis-media/media.amp",
        is_active=False,
        location="Secure Datacenter Base",
        resolution="1920x1080",
        fps=0,
        bitrate="0 kbps",
        device_status="offline",
        gpu_allocated="None",
        active_tracks=0,
        classes=["Person"],
        feed_url="https://picsum.photos/seed/datacenter/800/450"
    )
]

@router.get("", response_model=List[CameraResponse])
async def list_cameras():
    """
    Fetch all active, standby, and offline registered camera streams.
    """
    return IN_MEMORY_CAM_REGISTRY

@router.post("", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def register_camera(payload: CameraCreate):
    """
    Validate and register a new camera RTSP network streaming channel.
    """
    # Simple validation checks
    if any(cam.rtsp_url == payload.rtsp_url for cam in IN_MEMORY_CAM_REGISTRY):
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail=f"Camera with RTSP stream endpoint '{payload.rtsp_url}' already registered."
         )

    new_id = f"CAM-{random.randint(105, 999)}"
    new_cam = CameraResponse(
        id=new_id,
        name=payload.name,
        rtsp_url=payload.rtsp_url,
        is_active=payload.is_active,
        location=payload.location or "Facility Perimeter",
        resolution="1920x1080",
        fps=30,
        bitrate="3584 kbps",
        device_status="online",
        gpu_allocated="GPU-0 (5%)",
        active_tracks=0,
        classes=payload.classes or ["Person", "Car"],
        feed_url=f"https://picsum.photos/seed/{random.randint(1, 1000)}/800/450"
    )
    
    IN_MEMORY_CAM_REGISTRY.append(new_cam)
    return new_cam
