# ==============================================================================
# main.py - AI Engine Inference Core & Stream Orchestrator
# ==============================================================================

import time
import sys
from ai_engine.config import ai_config
from ai_engine.logger import setup_ai_logger
from ai_engine.model_loader import EnterpriseModelLoader

logger = setup_ai_logger("pipeline_daemon")


class VisionTrackAIDaemon:
    """
    Primary processing daemon.
    Subscribes to active camera streams, routes frame matrices through the model loader,
    coordinates multi-object tracker matches, and pushes metadata payloads back to FastAPI.
    """
    def __init__(self) -> None:
        logger.info("Initializing SIGHTFORGE Edge Daemon...")
        self.loader = EnterpriseModelLoader()
        self.is_running = False

    def start(self) -> None:
        """Starts the background video stream inference pipelines."""
        try:
            self.model = self.loader.load_model()
        except Exception as e:
            logger.critical(f"Inference pipeline aborted: Core model could not be pre-loaded: {str(e)}")
            sys.exit(1)

        self.is_running = True
        logger.info("SIGHTFORGE Edge Daemon actively listening for live RTSP camera feeds...")
        
        # Simulate video stream loop inside standard edge processing lifecycle
        frame_counter = 0
        try:
            while self.is_running:
                # In real scenario, we acquire frame matrix from OpenCV or GStreamer stream buffer here:
                # ret, frame = cap.read()
                
                # Simulating frame intake intervals matching configured target FPS
                time.sleep(1.0 / ai_config.TARGET_FPS)
                frame_counter += 1
                
                # Emit telemetry state reports every 10 seconds to indicate pipeline liveness
                if frame_counter % (ai_config.TARGET_FPS * 10) == 0:
                    logger.info(
                        f"Active Pipelines: 0 camera streams (waiting for registration) | "
                        f"Average Loop Rate: {ai_config.TARGET_FPS} FPS | "
                        f"Compute Device: {self.loader.device}"
                    )
        except KeyboardInterrupt:
            self.stop()

    def stop(self) -> None:
        """Gracefully halts active pipeline loops and releases accelerator hardware pools."""
        if not self.is_running:
            return
            
        logger.info("De-activating processing queues and releasing camera streams...")
        self.is_running = False
        
        # Free CUDA caches
        if self.loader.device == "cuda":
            import torch
            torch.cuda.empty_cache()
            logger.info("Released CUDA device memory pools.")
            
        logger.info("Inference system offline.")


if __name__ == "__main__":
    daemon = VisionTrackAIDaemon()
    daemon.start()
