# ==============================================================================
# image.py - Reusable Image Preprocessing Operations
# ==============================================================================

import cv2
import numpy as np


def resize_letterbox(image: np.ndarray, target_shape: tuple) -> tuple:
    """
    Resizes an image using letterbox padding to maintain its native aspect ratio.
    Ensures input matrices exactly match the expected dimensions of computer vision model backbones.
    """
    h, w = image.shape[:2]
    th, tw = target_shape[:2]
    
    # Calculate scale ratios
    scale = min(tw / w, th / h)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    
    # Resize the image
    resized = cv2.resize(image, (nw, nh), interpolation=cv2.INTER_LINEAR)
    
    # Create background canvas with padding
    canvas = np.full((th, tw, 3), 114, dtype=np.uint8) # 114 is standard gray background padding
    
    # Paste resized image into canvas
    dx = (tw - nw) // 2
    dy = (th - nh) // 2
    canvas[dy:dy+nh, dx:dx+nw] = resized
    
    return canvas, scale, (dx, dy)
