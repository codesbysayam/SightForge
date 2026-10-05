import time
from typing import Dict, Any, List, Optional
import numpy as np

from .config import CVConfig
from .detector import PersonDetector
from .pose import PoseDetector
from .tracker import PersonTracker
from .schemas import CVFrameResult, Detection, PersonPose

class CVPipeline:
    def __init__(self, config: Optional[CVConfig] = None):
        self.config = config or CVConfig()
        self.detector = PersonDetector(
            model_path=self.config.person_model,
            confidence=self.config.confidence,
            iou=self.config.iou,
            device=self.config.device,
        )
        self.pose: Optional[PoseDetector] = None
        if self.config.pose_enabled:
            self.pose = PoseDetector(
                model_path=self.config.pose_model,
                confidence=self.config.confidence,
                iou=self.config.iou,
                keypoint_confidence=self.config.keypoint_confidence,
                device=self.config.device,
            )

        self.tracker: Optional[PersonTracker] = None
        if self.config.tracking_enabled:
            self.tracker = PersonTracker(
                model_path=self.config.person_model,
                confidence=self.config.confidence,
                iou=self.config.iou,
                device=self.config.device,
            )

    def process_frame(self, frame: np.ndarray) -> CVFrameResult:
        t0 = time.perf_counter()

        if frame is None or frame.size == 0:
            return CVFrameResult(
                frame_width=0,
                frame_height=0,
                timestamp=time.time(),
                inference_ms=0.0,
                person_count=0,
                tracked_person_count=0,
            )

        height, width = frame.shape[:2]

        detections: List[Detection] = []
        if self.config.tracking_enabled and self.tracker and self.tracker.is_loaded:
            detections = self.tracker.track(frame)
        else:
            detections = self.detector.detect(frame)

        poses: List[PersonPose] = []
        if self.config.pose_enabled and self.pose and self.pose.is_loaded:
            poses = self.pose.detect(frame)

        t1 = time.perf_counter()
        inference_ms = round((t1 - t0) * 1000.0, 2)

        person_count = len(detections)
        tracked_count = len([d for d in detections if d.track_id is not None])

        return CVFrameResult(
            frame_width=width,
            frame_height=height,
            timestamp=time.time(),
            inference_ms=inference_ms,
            person_count=person_count,
            tracked_person_count=tracked_count,
            detections=detections,
            poses=poses,
            faces=[],
            model=self.config.person_model,
            device=self.config.device,
        )
