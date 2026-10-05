# ==============================================================================
# config.py - AI Engine Specific Settings and Pipeline Hyperparameters
# ==============================================================================

import os


class AIConfig:
    """Configures the edge AI frame analytics pipeline and detector thresholds."""
    # Model Weights Definitions
    MODEL_NAME = os.getenv("YOLO_MODEL_NAME", "yolov8n.pt")
    WEIGHTS_DIR = os.getenv("YOLO_WEIGHTS_DIR", "./ai_engine/weights")
    
    # Detection Thresholding Filters
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.25))
    IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", 0.45))
    
    # Target Processing Hardware
    DEVICE_PREFERENCE = os.getenv("CV_DEVICE", "auto") # auto, cuda, mps, cpu
    USE_HALF_PRECISION = os.getenv("YOLO_HALF_PRECISION", "true").lower() == "true"
    
    # Video Frame Dimensions
    TARGET_WIDTH = int(os.getenv("STREAM_FRAME_WIDTH", 1280))
    TARGET_HEIGHT = int(os.getenv("STREAM_FRAME_HEIGHT", 720))
    TARGET_FPS = int(os.getenv("STREAM_FPS", 30))

    # Pipeline Streaming Pools
    MAX_CONCURRENT_STREAMS = int(os.getenv("MAX_CAMERA_STREAMS", 10))
    RECONNECT_DELAY_SECONDS = int(os.getenv("RECONNECT_INTERVAL_SECONDS", 5))


ai_config = AIConfig()
