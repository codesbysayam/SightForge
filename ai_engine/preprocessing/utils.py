# ==============================================================================
# utils.py - Advanced Image Preprocessing Operations
# ==============================================================================

import cv2
import numpy as np
from typing import List, Tuple, Union, Any
from ai_engine.exceptions.exceptions import PipelineException


class PreprocessingUtils:
    """
    Standardizes raw input buffers to conform to deep learning model geometries.
    Optimizes pipelines for high-performance matrix scaling, color spaces, and tensor layouts.
    """

    @staticmethod
    def validate_image_input(image: Any) -> np.ndarray:
        """Verifies input data format, resolving various structures into NumPy frame matrices."""
        if image is None:
            raise PipelineException("Input image payload is null or empty.")
        
        if isinstance(image, np.ndarray):
            if len(image.shape) not in (2, 3):
                raise PipelineException(f"Invalid NumPy array shape for image matrix: {image.shape}")
            return image
            
        raise PipelineException(f"Unsupported image input buffer type: {type(image)}")

    @staticmethod
    def convert_color_space(image: np.ndarray, code: int = cv2.COLOR_BGR2RGB) -> np.ndarray:
        """Translates frame channel formats (e.g. standard BGR to RGB/RGBA)."""
        try:
            return cv2.cvtColor(image, code)
        except Exception as e:
            raise PipelineException(f"Failed to translate frame color-space channels: {str(e)}")

    @staticmethod
    def apply_letterbox(
        image: np.ndarray, 
        target_shape: Tuple[int, int] = (640, 640), 
        color: Tuple[int, int, int] = (114, 114, 114)
    ) -> Tuple[np.ndarray, float, Tuple[int, int]]:
        """
        Resizes frame with zero-distortion, padding outer borders to preserve the native aspect ratio.
        
        Returns:
            Tuple of (padded_image, scale_ratio, (pad_width, pad_height))
        """
        h, w = image.shape[:2]
        target_h, target_w = target_shape
        
        # Determine scale limits
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(round(w * scale)), int(round(h * scale))
        
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        
        # Padding bounds
        pad_w = (target_w - new_w) // 2
        pad_h = (target_h - new_h) // 2
        
        # Create solid color canvas
        padded_canvas = np.full((target_h, target_w, 3), color, dtype=np.uint8)
        padded_canvas[pad_h:pad_h + new_h, pad_w:pad_w + new_w] = resized
        
        return padded_canvas, scale, (pad_w, pad_h)

    @staticmethod
    def normalize_pixel_intensity(image: np.ndarray, max_val: float = 255.0) -> np.ndarray:
        """Converts integer [0, 255] arrays into standard floating point [0.0, 1.0] scales."""
        return image.astype(np.float32) / max_val

    @staticmethod
    def to_chw_tensor_layout(image: np.ndarray) -> np.ndarray:
        """Transposes HWC (Height, Width, Channels) layouts into CHW tensor structures."""
        # Convert HWC -> CHW (e.g. shape [640, 640, 3] -> [3, 640, 640])
        return np.transpose(image, (2, 0, 1))

    @staticmethod
    def build_batch(frames: List[np.ndarray]) -> np.ndarray:
        """Stacks multiple processed CHW frames into a single NCHW batch tensor."""
        if not frames:
            raise PipelineException("Cannot compile empty batch list.")
        try:
            return np.stack(frames, axis=0)
        except Exception as e:
            raise PipelineException(f"Failed to assemble batched NCHW matrices: {str(e)}")

    @classmethod
    def full_preprocess_pipeline(
        cls, 
        image: np.ndarray, 
        target_shape: Tuple[int, int] = (640, 640),
        normalize: bool = True
    ) -> Tuple[np.ndarray, Tuple[float, Tuple[int, int]]]:
        """Runs the standard sequence of validation, letterboxing, conversion, and transpose."""
        validated = cls.validate_image_input(image)
        rgb_img = cls.convert_color_space(validated, cv2.COLOR_BGR2RGB)
        padded_img, scale, padding = cls.apply_letterbox(rgb_img, target_shape)
        
        if normalize:
            norm_img = cls.normalize_pixel_intensity(padded_img)
            tensor_layout = cls.to_chw_tensor_layout(norm_img)
            # Add batch dimension [1, C, H, W]
            final_tensor = np.expand_dims(tensor_layout, axis=0)
            return final_tensor, (scale, padding)
        
        return padded_img, (scale, padding)
