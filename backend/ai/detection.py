# backend/ai/detection.py
from dataclasses import dataclass
from typing import List, Optional

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

class PersonDetector:
    PERSON_CLASS_ID = 0

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence: float = 0.35,
        iou: float = 0.45,
        device: str = "auto",
    ):
        self.model_path = model_path
        self.confidence = confidence
        self.iou = iou
        self.device = device
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from ultralytics import YOLO
                self._model = YOLO(self.model_path)
            except Exception:
                self._model = None
        return self._model

    def detect(self, frame) -> List[Detection]:
        model = self._get_model()
        if model is None:
            return []

        results = model.predict(
            source=frame,
            conf=self.confidence,
            iou=self.iou,
            device=self.device,
            classes=[self.PERSON_CLASS_ID],
            verbose=False,
        )

        detections: List[Detection] = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                if cls_id != self.PERSON_CLASS_ID:
                    continue

                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()

                detections.append(
                    Detection(
                        class_id=cls_id,
                        class_name="person",
                        confidence=conf,
                        x1=xyxy[0],
                        y1=xyxy[1],
                        x2=xyxy[2],
                        y2=xyxy[3],
                    )
                )

        return detections
