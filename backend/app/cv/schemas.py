from dataclasses import dataclass, asdict, field
from typing import List, Optional, Dict, Any

@dataclass
class Detection:
    class_id: int
    class_name: str
    confidence: float
    x1: float
    y1: float
    x2: float
    y2: float
    track_id: Optional[int] = None
    
    # Normalized coordinates (0.0 - 1.0)
    x1_norm: Optional[float] = None
    y1_norm: Optional[float] = None
    x2_norm: Optional[float] = None
    y2_norm: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class Keypoint:
    name: str
    x: float
    y: float
    confidence: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class PersonPose:
    person_index: int
    track_id: Optional[int] = None
    keypoints: List[Keypoint] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class FaceDetection:
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    track_id: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class CVFrameResult:
    frame_width: int
    frame_height: int
    timestamp: float
    inference_ms: float
    person_count: int
    tracked_person_count: int
    detections: List[Detection] = field(default_factory=list)
    poses: List[PersonPose] = field(default_factory=list)
    faces: List[FaceDetection] = field(default_factory=list)
    model: str = "yolov8n.pt"
    device: str = "cpu"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "frame_width": self.frame_width,
            "frame_height": self.frame_height,
            "timestamp": self.timestamp,
            "inference_ms": self.inference_ms,
            "person_count": self.person_count,
            "tracked_person_count": self.tracked_person_count,
            "detections": [d.to_dict() for d in self.detections],
            "poses": [p.to_dict() for p in self.poses],
            "faces": [f.to_dict() for f in self.faces],
            "model": self.model,
            "device": self.device,
        }
