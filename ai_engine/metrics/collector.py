# ==============================================================================
# collector.py - System & Inference Metrics Collection System
# ==============================================================================

import time
import os
import psutil
from typing import Dict, Any, List
from threading import Lock


class MetricsCollector:
    """
    Thread-safe collector gathering runtime telemetry from running stream workers.
    Consolidates frame metrics, drops, and physical accelerator usage records.
    """
    def __init__(self) -> None:
        self._lock = Lock()
        
        # Performance accumulator lists
        self._fps_history: List[float] = []
        self._latency_history: List[float] = []
        
        # Monotonically increasing counters
        self.processed_frames_count: int = 0
        self.dropped_frames_count: int = 0
        
        # State indicators
        self.inference_queue_size: int = 0
        self.last_update_timestamp: float = time.time()

    def record_frame(self, frame_latency_ms: float, current_queue_size: int) -> None:
        """Records metrics for a successfully processed frame."""
        with self._lock:
            self.processed_frames_count += 1
            self.inference_queue_size = current_queue_size
            
            # Slide window latency
            self._latency_history.append(frame_latency_ms)
            if len(self._latency_history) > 500:
                self._latency_history.pop(0)

            # Slide window FPS based on update interval
            now = time.time()
            elapsed = now - self.last_update_timestamp
            if elapsed > 0:
                instant_fps = 1.0 / elapsed
                self._fps_history.append(instant_fps)
                if len(self._fps_history) > 100:
                    self._fps_history.pop(0)
            self.last_update_timestamp = now

    def increment_dropped_frames(self) -> None:
        """Increments dropped frames when stream parsing queues overflow."""
        with self._lock:
            self.dropped_frames_count += 1

    def get_average_fps(self) -> float:
        """Computes current average processing frame rate."""
        with self._lock:
            if not self._fps_history:
                return 0.0
            return sum(self._fps_history) / len(self._fps_history)

    def get_average_latency(self) -> float:
        """Computes current average forward-pass network inference latency."""
        with self._lock:
            if not self._latency_history:
                return 0.0
            return sum(self._latency_history) / len(self._latency_history)

    def get_system_telemetry(self) -> Dict[str, Any]:
        """Gathers OS memory counters, active core percentages, and hardware stats."""
        mem = psutil.virtual_memory()
        process = psutil.Process(os.getpid())
        
        gpu_stats = {"available": False}
        try:
            import torch
            if torch.cuda.is_available():
                gpu_stats = {
                    "available": True,
                    "allocated_vram_mb": round(torch.cuda.memory_allocated(0) / (1024**2), 2),
                    "total_vram_mb": round(torch.cuda.get_device_properties(0).total_memory / (1024**2), 2)
                }
        except Exception:
            pass

        return {
            "average_fps": round(self.get_average_fps(), 2),
            "average_latency_ms": round(self.get_average_latency(), 2),
            "processed_frames": self.processed_frames_count,
            "dropped_frames": self.dropped_frames_count,
            "inference_queue_size": self.inference_queue_size,
            "resource_utilization": {
                "cpu_util_percent": psutil.cpu_percent(),
                "host_ram_rss_mb": round(process.memory_info().rss / (1024**2), 2),
                "host_ram_used_percent": mem.percent,
                "gpu": gpu_stats
            }
        }
