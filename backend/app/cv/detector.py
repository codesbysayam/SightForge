import time
from typing import List, Optional, Any
import numpy as np
from .schemas import Detection

class PersonDetector:
    def __init__(
        self,
        model_path: str = "models/yolov8n.pt",
        confidence: float = 0.35,
        iou: float = 0.45,
        device: str = "auto",
    ):
        self.model_path = model_path
        self.confidence = confidence
        self.iou = iou
        self.device = device
        self.model: Optional[Any] = None
        self.person_class_id: Optional[int] = None
        self.is_loaded = False

        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            
            # Dynamically identify person class ID from model names
            for class_id, class_name in self.model.names.items():
                if str(class_name).lower() == "person":
                    self.person_class_id = int(class_id)
                    break

            if self.person_class_id is None:
                # Default COCO person is 0 if names lookup has alternate formatting
                self.person_class_id = 0

            self.is_loaded = True
            print("=" * 60)
            print("SIGHTFORGE PERSON DETECTOR INITIALIZED")
            print(f"Model: {self.model_path}")
            print(f"Confidence threshold: {self.confidence}")
            print(f"IoU threshold: {self.iou}")
            print(f"Device: {self.device}")
            print(f"Resolved Person Class ID: {self.person_class_id}")
            print("=" * 60)
        except Exception as e:
            print(f"[SIGHTFORGE CV] Ultralytics YOLO load info: {e}")
            self.is_loaded = False

    def set_thresholds(self, confidence: float, iou: float):
        self.confidence = confidence
        self.iou = iou

    def detect(self, frame: np.ndarray) -> List[Detection]:
        if frame is None or frame.size == 0:
            return []

        height, width = frame.shape[:2]

        if not self.is_loaded or self.model is None:
            return []

        results = self.model.predict(
            source=frame,
            conf=self.confidence,
            iou=self.iou,
            device=self.device,
            verbose=False,
        )

        detections: List[Detection] = []

        for result in results:
            if result.boxes is None:
                continue

            boxes = result.boxes
            xyxy = boxes.xyxy.cpu().numpy()
            confidences = boxes.conf.cpu().numpy()
            class_ids = boxes.cls.cpu().numpy().astype(int)

            for bbox, conf, cls_id in zip(xyxy, confidences, class_ids):
                # Filter person class
                if cls_id != self.person_class_id:
                    continue

                x1, y1, x2, y2 = map(float, bbox)
                x1 = max(0.0, min(x1, float(width)))
                y1 = max(0.0, min(y1, float(height)))
                x2 = max(0.0, min(x2, float(width)))
                y2 = max(0.0, min(y2, float(height)))

                if x2 <= x1 or y2 <= y1:
                    continue

                detections.append(
                    Detection(
                        class_id=cls_id,
                        class_name="person",
                        confidence=float(conf),
                        x1=x1,
                        y1=y1,
                        x2=x2,
                        y2=y2,
                        x1_norm=x1 / width,
                        y1_norm=y1 / height,
                        x2_norm=x2 / width,
                        y2_norm=y2 / height,
                    )
                )

        return detections
