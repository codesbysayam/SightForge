# ==============================================================================
# model_loader.py - Safe Model Loader & Model Warmup Pipeline
# ==============================================================================

import os
import time
from ai_engine.config import ai_config
from ai_engine.logger import setup_ai_logger
from ai_engine.device import resolve_compute_device

logger = setup_ai_logger("model_loader")


class EnterpriseModelLoader:
    """
    Manages safe download, caching, compilation, and warm-up of CNN models.
    Lazy initialization ensures the program boots up instantly without holding memory.
    """
    def __init__(self) -> None:
        self.model = None
        self.device = None
        self.is_warmed_up = False

    def load_model(self):
        """
        Loads the configured object detector model into target compute memory.
        Uses cached weights if available, else initiates secured download.
        """
        if self.model is not None:
            return self.model

        self.device = resolve_compute_device()
        weights_path = os.path.join(ai_config.WEIGHTS_DIR, ai_config.MODEL_NAME)
        
        logger.info(f"Loading computer vision model {ai_config.MODEL_NAME} on device: {self.device}...")
        start_time = time.time()
        
        try:
            # We import ultralytics only on-demand during model load to prevent heavy import delays on startup
            from ultralytics import YOLO
            
            # Ensure weights folder exists
            os.makedirs(ai_config.WEIGHTS_DIR, exist_ok=True)
            
            # Load the model with standard ultralytics architecture
            self.model = YOLO(weights_path)
            
            # Move weights and run fp16 optimizations if required
            if self.device == "cuda" and ai_config.USE_HALF_PRECISION:
                self.model.to(self.device).half()
                logger.info("YOLOv8 compiled with FP16 half-precision optimizations.")
            else:
                self.model.to(self.device)

            elapsed = time.time() - start_time
            logger.info(f"Model successfully loaded and optimized in {elapsed:.2f}s.")
            
            # Trigger warmup check to preload weights in GPU caches
            self.warmup_model()
            
            return self.model
            
        except ImportError:
            logger.error("Ultralytics library not found in Python sys.path. Loader aborted.")
            raise RuntimeError("Missing dependency: ultralytics")
        except Exception as e:
            logger.critical(f"Failed to compile and cache neural network weights: {str(e)}")
            raise e

    def warmup_model(self) -> None:
        """
        Performs inference on a dry blank tensor frame to initialize GPU execution graphs.
        Prevents latency spikes during the first real-time RTSP camera frame.
        """
        if self.is_warmed_up or self.model is None:
            return

        logger.info("Initializing tensor graph warming sequence (dry inference run)...")
        start_time = time.time()
        
        try:
            import numpy as np
            
            # Create a mock blank canvas representing standard 720p frame buffer
            blank_frame = np.zeros((ai_config.TARGET_HEIGHT, ai_config.TARGET_WIDTH, 3), dtype=np.uint8)
            
            # Perform dummy inference pipeline
            self.model.predict(
                blank_frame,
                device=self.device,
                verbose=False,
                conf=ai_config.CONFIDENCE_THRESHOLD,
                iou=ai_config.IOU_THRESHOLD
            )
            
            self.is_warmed_up = True
            elapsed = time.time() - start_time
            logger.info(f"Tensor graph pre-loaded. Hardware ready for real-time video feeds. Warmup: {elapsed:.2f}s.")
        except Exception as e:
            logger.warning(f"Could not complete model pre-warm dry run: {str(e)}. Proceeding anyway.")
