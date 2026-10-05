# ==============================================================================
# ai_settings.py - Centralized AI Config & Hyperparameter Engine
# ==============================================================================

import os
from typing import Dict, Any
from ai_engine.exceptions.exceptions import ConfigurationException


class CentralizedAIConfig:
    """
    Centralized, thread-safe, dynamic configurations for edge computer vision pipelines.
    Supports on-demand updates, device preferences (CPU/CUDA/MPS/TPU/TensorRT/ONNX), and mixed precision configurations.
    """
    def __init__(self) -> None:
        self._initialize_defaults()

    def _initialize_defaults(self) -> None:
        # Core Model Properties
        self.model_name: str = os.getenv("YOLO_MODEL_NAME", "yolov8n.pt")
        self.weights_dir: str = os.getenv("YOLO_WEIGHTS_DIR", "./ai_engine/weights")
        self.model_version: str = os.getenv("YOLO_MODEL_VERSION", "1.0.0")
        
        # Detection & Suppression Thresholds
        try:
            self.confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", 0.25))
            self.iou_threshold: float = float(os.getenv("IOU_THRESHOLD", 0.45))
        except ValueError as e:
            raise ConfigurationException(f"Invalid numeric input for thresholds: {str(e)}")

        # Device Optimization Parameters
        self.device_preference: str = os.getenv("CV_DEVICE", "auto").lower()
        self.use_half_precision: bool = os.getenv("YOLO_HALF_PRECISION", "true").lower() == "true"
        self.enable_tensorrt: bool = os.getenv("ENABLE_TENSORRT", "false").lower() == "true"
        self.enable_onnx: bool = os.getenv("ENABLE_ONNX", "false").lower() == "true"
        
        # CPU Multithreading Optimization
        try:
            self.num_threads: int = int(os.getenv("OMP_NUM_THREADS", "4"))
        except ValueError:
            self.num_threads = 4

        # Frame Processing Target Dimensions
        try:
            self.target_width: int = int(os.getenv("STREAM_FRAME_WIDTH", 1280))
            self.target_height: int = int(os.getenv("STREAM_FRAME_HEIGHT", 720))
            self.target_fps: int = int(os.getenv("STREAM_FPS", 30))
        except ValueError as e:
            raise ConfigurationException(f"Invalid frame geometry parameters: {str(e)}")

        # Queue and Multistream Parameters
        try:
            self.max_concurrent_streams: int = int(os.getenv("MAX_CAMERA_STREAMS", 10))
            self.reconnect_delay_seconds: int = int(os.getenv("RECONNECT_INTERVAL_SECONDS", 5))
            self.inference_queue_capacity: int = int(os.getenv("INFERENCE_QUEUE_CAPACITY", 100))
        except ValueError as e:
            raise ConfigurationException(f"Invalid pipeline orchestration limits: {str(e)}")

    def update_settings(self, new_settings: Dict[str, Any]) -> None:
        """Dynamically overrides active hyperparameter settings at runtime."""
        for key, value in new_settings.items():
            if hasattr(self, key):
                current_type = type(getattr(self, key))
                try:
                    # Cast value to correct type
                    if current_type == bool and isinstance(value, str):
                        casted_value = value.lower() == "true"
                    else:
                        casted_value = current_type(value)
                    setattr(self, key, casted_value)
                except (ValueError, TypeError) as e:
                    raise ConfigurationException(f"Failed to dynamically cast '{key}' to {current_type}: {str(e)}")
            else:
                raise ConfigurationException(f"Unknown configuration parameter key: '{key}'")

    def to_dict(self) -> Dict[str, Any]:
        """Serializes current config state to a dictionary representation."""
        return {
            "model_name": self.model_name,
            "weights_dir": self.weights_dir,
            "model_version": self.model_version,
            "confidence_threshold": self.confidence_threshold,
            "iou_threshold": self.iou_threshold,
            "device_preference": self.device_preference,
            "use_half_precision": self.use_half_precision,
            "enable_tensorrt": self.enable_tensorrt,
            "enable_onnx": self.enable_onnx,
            "num_threads": self.num_threads,
            "target_width": self.target_width,
            "target_height": self.target_height,
            "target_fps": self.target_fps,
            "max_concurrent_streams": self.max_concurrent_streams,
            "reconnect_delay_seconds": self.reconnect_delay_seconds,
            "inference_queue_capacity": self.inference_queue_capacity,
        }


# Singleton instance
ai_settings = CentralizedAIConfig()
