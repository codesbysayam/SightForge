import os
from dataclasses import dataclass

@dataclass
class CVConfig:
    person_model: str = os.getenv("PERSON_MODEL", "models/yolov8n.pt")
    pose_model: str = os.getenv("POSE_MODEL", "models/yolov8n-pose.pt")
    face_model: str = os.getenv("FACE_MODEL", "models/yolov8n-face.pt")

    confidence: float = float(os.getenv("PERSON_CONFIDENCE", "0.35"))
    iou: float = float(os.getenv("PERSON_IOU", "0.45"))
    keypoint_confidence: float = float(os.getenv("KEYPOINT_CONFIDENCE", "0.35"))

    device: str = os.getenv("CV_DEVICE", "auto")

    tracking_enabled: bool = os.getenv("TRACKING_ENABLED", "true").lower() in ("true", "1", "yes")
    pose_enabled: bool = os.getenv("POSE_ENABLED", "true").lower() in ("true", "1", "yes")
    face_enabled: bool = os.getenv("FACE_ENABLED", "false").lower() in ("true", "1", "yes")

    person_detection_interval: int = int(os.getenv("PERSON_DETECTION_INTERVAL", "1"))
    pose_interval: int = int(os.getenv("POSE_INTERVAL", "1"))
