# ==============================================================================
# device_manager.py - Adaptive Compute Accelerator Allocation & System Profile
# ==============================================================================

import os
import sys
import multiprocessing
import psutil
from typing import Dict, Any
from ai_engine.config.ai_settings import ai_settings
from ai_engine.exceptions.exceptions import DeviceException, MemoryException, GPUException


class DeviceManager:
    """
    Monitors hardware architecture constraints, queries accelerator backends (CUDA/MPS/TPU),
    provisions device memory, and locks down OMP/MKL multi-threaded parameters for CPU workloads.
    """
    def __init__(self) -> None:
        self._initialize_threading_caps()

    def _initialize_threading_caps(self) -> None:
        """Sets internal engine thread pools to avoid CPU resource starvation and thrashing."""
        threads = str(ai_settings.num_threads)
        os.environ["OMP_NUM_THREADS"] = threads
        os.environ["MKL_NUM_THREADS"] = threads
        os.environ["OPENBLAS_NUM_THREADS"] = threads
        os.environ["VECLIB_MAXIMUM_THREADS"] = threads
        os.environ["NUMEXPR_NUM_THREADS"] = threads

    def detect_cuda_capabilities(self) -> Dict[str, Any]:
        """Queries CUDA accelerator driver details, compute capability levels, and global memory indices."""
        try:
            import torch
            if not torch.cuda.is_available():
                return {"available": False, "devices": []}

            device_count = torch.cuda.device_count()
            devices_info = []
            
            for i in range(device_count):
                props = torch.cuda.get_device_properties(i)
                devices_info.append({
                    "index": i,
                    "name": props.name,
                    "compute_capability": f"{props.major}.{props.minor}",
                    "total_vram_mb": round(props.total_memory / (1024 * 1024), 2),
                    "multi_processor_count": props.multi_processor_count
                })
            
            return {
                "available": True,
                "driver_version": torch.version.cuda,
                "device_count": device_count,
                "devices": devices_info
            }
        except ImportError:
            return {"available": False, "devices": [], "reason": "PyTorch not installed"}
        except Exception as e:
            raise GPUException(f"Failed to fetch CUDA telemetry: {str(e)}")

    def detect_mps_capabilities(self) -> Dict[str, Any]:
        """Queries Apple Silicon Metal Performance Shaders integration state."""
        try:
            import torch
            available = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
            return {
                "available": available,
                "device_name": "Apple M-Series Unified GPU" if available else "N/A"
            }
        except ImportError:
            return {"available": False, "reason": "PyTorch not installed"}

    def inspect_vram_utilization(self, device_index: int = 0) -> Dict[str, float]:
        """Queries CUDA VRAM allocation indices and handles alert states."""
        try:
            import torch
            if not torch.cuda.is_available():
                return {"allocated_mb": 0.0, "reserved_mb": 0.0, "free_mb": 0.0}

            allocated = torch.cuda.memory_allocated(device_index) / (1024 * 1024)
            reserved = torch.cuda.memory_reserved(device_index) / (1024 * 1024)
            total = torch.cuda.get_device_properties(device_index).total_memory / (1024 * 1024)
            free = total - allocated
            
            if allocated / total > 0.95:
                raise MemoryException(f"Critical: GPU index {device_index} has exceeded 95% VRAM limit.")

            return {
                "allocated_mb": round(allocated, 2),
                "reserved_mb": round(reserved, 2),
                "free_mb": round(free, 2),
                "total_mb": round(total, 2)
            }
        except Exception as e:
            if isinstance(e, MemoryException):
                raise e
            raise GPUException(f"Failed to inspect VRAM utilization: {str(e)}")

    def inspect_host_memory(self) -> Dict[str, float]:
        """Inspects host system RAM capacity and availability."""
        mem = psutil.virtual_memory()
        return {
            "total_gb": round(mem.total / (1024**3), 2),
            "available_gb": round(mem.available / (1024**3), 2),
            "used_percent": mem.percent
        }

    def resolve_optimal_device(self) -> str:
        """
        Implements an automatic selector that routes workloads using a fallback strategy:
        CUDA -> MPS -> CPU.
        """
        pref = ai_settings.device_preference

        try:
            import torch
        except ImportError:
            return "cpu"

        if pref == "cuda":
            if torch.cuda.is_available():
                return "cuda"
            raise DeviceException("CUDA requested but not supported on host container.")

        elif pref == "mps":
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
            raise DeviceException("Apple MPS accelerator requested but not supported on host.")

        # Default fallback strategy (Auto-routing)
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"

        return "cpu"


# Singleton instance
device_manager = DeviceManager()
