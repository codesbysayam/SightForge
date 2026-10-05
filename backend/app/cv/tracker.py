from typing import List, Optional, Any
import numpy as np
from .schemas import Detection

class PersonTracker:
    def __init__(
        self,
        model_path: str = "models/yolov8n.pt",
        confidence: float = 0.35,
        iou: float = 0.45,
        device: str = "auto",
        tracker_type: str = "bytetrack.yaml",
    ):
        self.model_path = model_path
        self.confidence = confidence
        self.iou = iou
        self.device = device
        self.tracker_type = tracker_type
        self.model: Optional[Any] = None
        self.is_loaded = False
        self.person_class_id: int = 0

        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            for class_id, class_name in self.model.names.items():
                if str(class_name).lower() == "person":
                    self.person_class_id = int(class_id)
                    break
            self.is_loaded = True
        except Exception as e:
            print(f"[SIGHTFORGE CV] Tracker load note: {e}")
            self.is_loaded = False

    def track(self, frame: np.ndarray) -> List[Detection]:
        if frame is None or frame.size == 0 or not self.is_loaded or self.model is None:
            return []

        height, width = frame.shape[:2]

        results = self.model.track(
            source=frame,
            persist=True,
            conf=self.confidence,
            iou=self.iou,
            device=self.device,
            tracker=self.tracker_type,
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
            track_ids = (
                boxes.id.cpu().numpy().astype(int)
                if boxes.id is not None
                else [None] * len(boxes)
            )

            for bbox, conf, cls_id, trk_id in zip(xyxy, confidences, class_ids, track_ids):
                if cls_id != self.person_class_id:
                    continue

                x1, y1, x2, y2 = map(float, bbox)
                x1 = max(0.0, min(x1, float(width)))
                y1 = max(0.0, min(y1, float(height)))
                x2 = max(0.0, min(x2, float(width)))
                y2 = max(0.0, min(y2, float(height)))

                detections.append(
                    Detection(
                        class_id=cls_id,
                        class_name="person",
                        confidence=float(conf),
                        x1=x1,
                        y1=y1,
                        x2=x2,
                        y2=y2,
                        track_id=int(trk_id) if trk_id is not None else None,
                        x1_norm=x1 / width,
                        y1_norm=y1 / height,
                        x2_norm=x2 / width,
                        y2_norm=y2 / height,
                    )
                )

        return detections
