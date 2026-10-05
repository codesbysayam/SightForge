# ==============================================================================
# utils.py - Advanced Postprocessing & Bounding Box Serializer
# ==============================================================================

import cv2
import json
import numpy as np
from typing import List, Tuple, Dict, Any, Union
from ai_engine.exceptions.exceptions import PipelineException


class PostprocessingUtils:
    """
    Transforms raw prediction arrays, scaling bounding coordinates,
    filtering low-probability detections, and serializing outputs for API payloads.
    """

    @staticmethod
    def xyxy_to_xywh(xyxy_box: Union[np.ndarray, List[float]]) -> Tuple[float, float, float, float]:
        """Translates coordinate systems from [x1, y1, x2, y2] corners to [x_center, y_center, width, height] offsets."""
        x1, y1, x2, y2 = xyxy_box
        w = x2 - x1
        h = y2 - y1
        xc = x1 + (w / 2.0)
        yc = y1 + (h / 2.0)
        return xc, yc, w, h

    @staticmethod
    def xywh_to_xyxy(xywh_box: Union[np.ndarray, List[float]]) -> Tuple[float, float, float, float]:
        """Translates [x_center, y_center, width, height] coordinate offsets back to [x1, y1, x2, y2] corner bounds."""
        xc, yc, w, h = xywh_box
        x1 = xc - (w / 2.0)
        y1 = yc - (h / 2.0)
        x2 = xc + (w / 2.0)
        y2 = yc + (h / 2.0)
        return x1, y1, x2, y2

    @staticmethod
    def scale_to_native(
        xyxy_box: Tuple[float, float, float, float],
        scale: float,
        padding: Tuple[int, int]
    ) -> Tuple[int, int, int, int]:
        """
        Denormalizes letterboxed bounding coordinates, converting them back to raw native video pixel locations.
        Removes padding boundaries before calculating pixel coordinates.
        """
        x1, y1, x2, y2 = xyxy_box
        pad_w, pad_h = padding
        
        # Substract padding bounds
        x1_unpad = (x1 - pad_w) / scale
        y1_unpad = (y1 - pad_h) / scale
        x2_unpad = (x2 - pad_w) / scale
        y2_unpad = (y2 - pad_h) / scale
        
        # Clip coordinates within reasonable image bounds
        return int(max(0, round(x1_unpad))), int(max(0, round(y1_unpad))), int(max(0, round(x2_unpad))), int(max(0, round(y2_unpad)))

    @staticmethod
    def filter_by_confidence(
        boxes: np.ndarray, 
        scores: np.ndarray, 
        class_ids: np.ndarray, 
        threshold: float
    ) -> List[Dict[str, Any]]:
        """Filters detections, keeping only elements whose confidence satisfies thresholds."""
        filtered_results = []
        for i in range(len(scores)):
            if scores[i] >= threshold:
                filtered_results.append({
                    "box": boxes[i].tolist(), # [x1, y1, x2, y2]
                    "score": float(scores[i]),
                    "class_id": int(class_ids[i])
                })
        return filtered_results

    @staticmethod
    def serialize_detections(detections: List[Dict[str, Any]], class_names: Dict[int, str]) -> str:
        """Converts filtered detection structures into clean, standardized JSON strings."""
        payload = []
        for d in detections:
            class_id = d["class_id"]
            label = class_names.get(class_id, f"unknown-{class_id}")
            payload.append({
                "bbox": d["box"],
                "confidence": round(d["score"], 4),
                "class_id": class_id,
                "label": label
            })
        return json.dumps(payload)

    @staticmethod
    def draw_visual_overlays(
        image: np.ndarray, 
        detections: List[Dict[str, Any]], 
        class_names: Dict[int, str],
        color: Tuple[int, int, int] = (0, 255, 0),
        thickness: int = 2
    ) -> np.ndarray:
        """
        Renders bounding boxes and label text on an image matrix.
        Useful for visualization checks and snapshot saves.
        """
        canvas = image.copy()
        for d in detections:
            x1, y1, x2, y2 = map(int, d["box"])
            score = d["score"]
            class_id = d["class_id"]
            label = f"{class_names.get(class_id, 'object')} {score:.2f}"
            
            # Draw bounding box
            cv2.rectangle(canvas, (x1, y1), (x2, y2), color, thickness)
            
            # Draw label background
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(canvas, (x1, y1 - 20), (x1 + w, y1), color, -1)
            cv2.putText(canvas, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
            
        return canvas
