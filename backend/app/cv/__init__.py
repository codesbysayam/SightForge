"""
SIGHTFORGE Computer Vision Engine
Core package for real-time person detection, human pose keypoints, and tracking.
"""

from .config import CVConfig
from .detector import PersonDetector
from .pose import PoseDetector
from .tracker import PersonTracker
from .pipeline import CVPipeline
from .schemas import Detection, Keypoint, PersonPose, CVFrameResult

__all__ = [
    "CVConfig",
    "PersonDetector",
    "PoseDetector",
    "PersonTracker",
    "CVPipeline",
    "Detection",
    "Keypoint",
    "PersonPose",
    "CVFrameResult",
]
