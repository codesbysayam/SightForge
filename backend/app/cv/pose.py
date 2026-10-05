from typing import List, Optional, Any
import numpy as np
from .schemas import Keypoint, PersonPose

COCO_KEYPOINTS = [
    "nose",
    "left_eye",
    "right_eye",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
]

class PoseDetector:
    def __init__(
        self,
        model_path: str = "models/yolov8n-pose.pt",
        confidence: float = 0.35,
        iou: float = 0.45,
        keypoint_confidence: float = 0.35,
        device: str = "auto",
    ):
        self.model_path = model_path
        self.confidence = confidence
        self.iou = iou
        self.keypoint_confidence = keypoint_confidence
        self.device = device
        self.model: Optional[Any] = None
        self.is_loaded = False

        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            self.is_loaded = True
            print("=" * 60)
            print("SIGHTFORGE POSE DETECTOR INITIALIZED")
            print(f"Pose Model: {self.model_path}")
            print(f"Keypoint Confidence: {self.keypoint_confidence}")
            print("=" * 60)
        except Exception as e:
            print(f"[SIGHTFORGE CV] Pose model load note: {e}")
            self.is_loaded = False

    def detect(self, frame: np.ndarray) -> List[PersonPose]:
        if frame is None or frame.size == 0 or not self.is_loaded or self.model is None:
            return []

        results = self.model.predict(
            source=frame,
            conf=self.confidence,
            iou=self.iou,
            device=self.device,
            verbose=False,
        )

        poses: List[PersonPose] = []

        for p_idx, result in enumerate(results):
            if result.keypoints is None:
                continue

            # result.keypoints.xy is shape (N, 17, 2), conf is (N, 17)
            try:
                xy = result.keypoints.xy.cpu().numpy()
                conf = result.keypoints.conf.cpu().numpy() if result.keypoints.conf is not None else None

                for person_i in range(len(xy)):
                    person_kps: List[Keypoint] = []
                    for kp_i in range(min(len(COCO_KEYPOINTS), len(xy[person_i]))):
                        kp_x, kp_y = xy[person_i][kp_i]
                        kp_conf = float(conf[person_i][kp_i]) if conf is not None else 1.0

                        if kp_conf >= self.keypoint_confidence and (kp_x > 0 or kp_y > 0):
                            person_kps.append(
                                Keypoint(
                                    name=COCO_KEYPOINTS[kp_i],
                                    x=float(kp_x),
                                    y=float(kp_y),
                                    confidence=kp_conf,
                                )
                            )

                    poses.append(
                        PersonPose(
                            person_index=p_idx + person_i,
                            keypoints=person_kps,
                        )
                    )
            except Exception as e:
                print(f"[SIGHTFORGE CV] Keypoint parsing error: {e}")

        return poses
