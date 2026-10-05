# ==============================================================================
# metrics.py - AI Engine Execution Benchmark & Profiling Infrastructure
# ==============================================================================

import time
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, List
import psutil


class BenchmarkInterface(ABC):
    """Abstract interface for setting and running targeted stress and profiling suites."""
    
    @abstractmethod
    def run_benchmark(self, duration_seconds: float) -> Dict[str, Any]:
        """Runs the profiling routine, compiling system usage metrics."""
        pass


class FPSMonitor:
    """Calculates sliding-window frame-per-second statistics."""
    def __init__(self, window_size: int = 100) -> None:
        self.window_size = window_size
        self.frame_times: List[float] = []

    def tick(self) -> float:
        """Logs a single frame processing timestamp, calculating immediate FPS rates."""
        now = time.perf_counter()
        self.frame_times.append(now)
        
        # Trim historical values outside window boundaries
        if len(self.frame_times) > self.window_size:
            self.frame_times.pop(0)
            
        if len(self.frame_times) < 2:
            return 0.0
            
        total_duration = self.frame_times[-1] - self.frame_times[0]
        return len(self.frame_times) / total_duration if total_duration > 0 else 0.0


class LatencyMonitor:
    """Tracks raw step-by-step latency runtimes for sub-operations."""
    def __init__(self) -> None:
        self.start_times: Dict[str, float] = {}
        self.accumulated_ms: Dict[str, List[float]] = {}

    def start_measurement(self, tag: str) -> None:
        """Starts stopwatch for a specific event tag."""
        self.start_times[tag] = time.perf_counter()

    def stop_measurement(self, tag: str) -> float:
        """Halts stopwatch, returning latency in milliseconds."""
        if tag not in self.start_times:
            return 0.0
        elapsed = (time.perf_counter() - self.start_times[tag]) * 1000.0
        if tag not in self.accumulated_ms:
            self.accumulated_ms[tag] = []
        self.accumulated_ms[tag].append(elapsed)
        return elapsed

    def get_average_ms(self, tag: str) -> float:
        """Computes average latency for a given tag."""
        vals = self.accumulated_ms.get(tag, [])
        return sum(vals) / len(vals) if vals else 0.0


class MemoryBenchmark:
    """Profiles active RAM allocation patterns across execution pipelines."""
    @staticmethod
    def get_current_rss_mb() -> float:
        """Retrieves Resident Set Size memory allocation of the active process."""
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)


class GPUBenchmark:
    """Queries NVIDIA CUDA GPU utilization scales."""
    @staticmethod
    def get_gpu_telemetry() -> Dict[str, Any]:
        """Retrieves real-time details regarding active GPU nodes."""
        try:
            import torch
            if not torch.cuda.is_available():
                return {"available": False}
            
            allocated = torch.cuda.memory_allocated(0) / (1024 * 1024)
            reserved = torch.cuda.memory_reserved(0) / (1024 * 1024)
            return {
                "available": True,
                "vram_allocated_mb": round(allocated, 2),
                "vram_reserved_mb": round(reserved, 2),
                "device_name": torch.cuda.get_device_name(0)
            }
        except ImportError:
            return {"available": False, "reason": "PyTorch not installed"}


class CPUBenchmark:
    """Queries system-wide and process-specific CPU utilization."""
    @staticmethod
    def get_cpu_utilization() -> Dict[str, Any]:
        """Gathers thread counts and percentage indicators."""
        return {
            "percent_utilization": psutil.cpu_percent(interval=None),
            "process_utilization": psutil.Process(os.getpid()).cpu_percent(),
            "logical_cores": multiprocessing.cpu_count()
        }


class PerformanceReportGenerator:
    """Compiles individual hardware telemetry metrics into standardized JSON performance diagnostics."""
    @staticmethod
    def generate_report(
        fps: float, 
        latency_stats: Dict[str, float], 
        duration: float
    ) -> Dict[str, Any]:
        """Structures active stats into a unified diagnosis report."""
        cpu_metrics = CPUBenchmark.get_cpu_utilization()
        gpu_metrics = GPUBenchmark.get_gpu_telemetry()
        rss_memory = MemoryBenchmark.get_current_rss_mb()

        return {
            "timestamp": time.time(),
            "benchmark_duration_seconds": round(duration, 2),
            "throughput": {
                "average_fps": round(fps, 2),
                "target_fps": 30.0
            },
            "latency_breakdown_ms": {tag: round(val, 2) for tag, val in latency_stats.items()},
            "host_hardware": {
                "cpu": cpu_metrics,
                "system_ram_rss_mb": round(rss_memory, 2)
            },
            "accelerator_hardware": gpu_metrics
        }
