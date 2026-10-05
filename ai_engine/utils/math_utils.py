# ==============================================================================
# utils.py - Image Coordinates Math & Vector Bounding Box Cleaners
# ==============================================================================

from typing import List, Tuple
import numpy as np


def iou_vectorized(box: np.ndarray, boxes: np.ndarray) -> np.ndarray:
    """
    Computes Intersection-over-Union (IoU) of one anchor box with multiple comparison boxes.
    Utilizes numpy vector calculations for fast coordinate overlap evaluation.
    
    Args:
        box: np.array of shape (4,) representing [x1, y1, x2, y2]
        boxes: np.array of shape (N, 4) representing multiple [x1, y1, x2, y2]
    Returns:
        np.ndarray of shape (N,) with IoU ratios
    """
    # Coordinate boundary points
    x1 = np.maximum(box[0], boxes[:, 0])
    y1 = np.maximum(box[1], boxes[:, 1])
    x2 = np.minimum(box[2], boxes[:, 2])
    y2 = np.minimum(box[3], boxes[:, 3])

    # Overlapping intersection bounding dimensions
    intersection_width = np.maximum(0.0, x2 - x1)
    intersection_height = np.maximum(0.0, y2 - y1)
    intersection_area = intersection_width * intersection_height

    # Calculate union area
    box_area = (box[2] - box[0]) * (box[3] - box[1])
    boxes_area = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
    union_area = box_area + boxes_area - intersection_area

    # Avoid division by zero
    return np.where(union_area > 0, intersection_area / union_area, 0.0)


def scale_coordinates(
    coords: Tuple[float, float, float, float],
    src_shape: Tuple[int, int],
    dest_shape: Tuple[int, int]
) -> Tuple[int, int, int, int]:
    """
    Rescales bounding box coordinates [x1, y1, x2, y2] from source resolution to destination resolution.
    Maintains aspect ratio parameters to prevent distortion in the tracking metadata pipeline.
    """
    src_h, src_w = src_shape[:2]
    dest_h, dest_w = dest_shape[:2]

    # Calculate ratios
    scale_x = dest_w / src_w
    scale_y = dest_h / src_h

    # Return rescaled integer coordinates
    x1 = int(round(coords[0] * scale_x))
    y1 = int(round(coords[1] * scale_y))
    x2 = int(round(coords[2] * scale_x))
    y2 = int(round(coords[3] * scale_y))

    return x1, y1, x2, y2


def normalize_coordinates(
    coords: Tuple[int, int, int, int],
    shape: Tuple[int, int]
) -> Tuple[float, float, float, float]:
    """
    Converts absolute pixel coordinates into normalized float values in range [0.0, 1.0].
    Normalized representations are critical for standardizing database objects and sending messages over WebSockets.
    """
    h, w = shape[:2]
    x1, y1, x2, y2 = coords
    
    return (
        round(float(x1) / w, 4),
        round(float(y1) / h, 4),
        round(float(x2) / w, 4),
        round(float(y2) / h, 4)
    )
