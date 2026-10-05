# ==============================================================================
# camera.py - Camera and Stream Data Transfer Objects (Schemas)
# ==============================================================================

from pydantic import BaseModel, Field
from typing import Optional, List


class CameraBase(BaseModel):
    name: str = Field(..., description="Unique human-readable name of the camera stream.")
    rtsp_url: str = Field(..., description="Target RTSP or video stream network location.")
    is_active: bool = Field(True, description="Indicates if stream analytics are enabled.")
    location: Optional[str] = Field("Facility Perimeter", description="Physical location zone.")
    classes: Optional[List[str]] = Field(default_factory=lambda: ["Person", "Car"], description="Target object categories to run detector on.")


class CameraCreate(CameraBase):
    pass


class CameraResponse(CameraBase):
    id: str = Field(..., description="Unique string camera channel identifier.")
    resolution: str = Field("1920x1080", description="Live video resolution.")
    fps: int = Field(30, description="Frames per second stream rate.")
    bitrate: str = Field("4096 kbps", description="Network stream ingestion rate.")
    device_status: str = Field("online", description="Status label of the stream: online, offline.")
    gpu_allocated: str = Field("GPU-0 (8%)", description="Target hardware execution node.")
    active_tracks: int = Field(0, description="Number of active multi-object trackers.")
    feed_url: str = Field("https://picsum.photos/seed/gate/800/450", description="Web-safe streaming image source URL.")

    class Config:
        from_attributes = True
