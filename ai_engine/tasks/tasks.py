# ==============================================================================
# tasks.py - Pipeline Background Task Workers & Ingestion Queues
# ==============================================================================

import queue
import threading
import time
from typing import Callable, Any, Optional
from ai_engine.logger import setup_ai_logger

logger = setup_ai_logger("pipeline_tasks")


class FrameIngestionTask:
    """Represents a background thread worker capturing and decoding RTSP frames."""
    def __init__(self, stream_id: str, stream_url: str, on_frame_callback: Callable[[Any], None]) -> None:
        self.stream_id = stream_id
        self.stream_url = stream_url
        self.on_frame = on_frame_callback
        self._is_running = False
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        """Launches the background thread capturing stream frames."""
        if self._is_running:
            return
        self._is_running = True
        self._thread = threading.Thread(
            target=self._capture_loop, 
            daemon=True, 
            name=f"Ingestion-{self.stream_id}"
        )
        self._thread.start()
        logger.info(f"Frame ingestion pipeline worker started for stream: {self.stream_id}")

    def stop(self) -> None:
        """Gracefully shuts down the background ingestion thread."""
        self._is_running = False
        if self._thread:
            self._thread.join(timeout=3.0)
            logger.info(f"Frame ingestion pipeline worker stopped for stream: {self.stream_id}")

    def _capture_loop(self) -> None:
        """Mock stream reader loop mimicking live RTSP buffer timing."""
        import numpy as np
        
        while self._is_running:
            # Simulate RTSP frame reading delay (30 FPS)
            time.sleep(1.0 / 30.0)
            
            # Generate blank 720p color matrix
            mock_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            
            try:
                self.on_frame(mock_frame)
            except Exception as e:
                logger.error(f"Failed to pass frames to pipeline consumer: {str(e)}")
                time.sleep(1.0) # Backoff before retry
