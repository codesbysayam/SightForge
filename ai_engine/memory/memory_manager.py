# ==============================================================================
# memory_manager.py - PyTorch Tensor & VRAM Garbage Collection Systems
# ==============================================================================

import gc
import sys
from typing import Dict, Any
from ai_engine.logger import setup_ai_logger
from ai_engine.devices.device_manager import device_manager

logger = setup_ai_logger("memory_manager")


class AIMemoryManager:
    """
    Proactively manages neural network memory pools.
    Performs garbage collection on untracked tensor structures and flushes CUDA/MPS cache pools.
    """
    
    @staticmethod
    def force_garbage_collection() -> int:
        """Forces immediate Python interpreter garbage collection sweeps, returning collected objects."""
        before = len(gc.get_objects())
        gc.collect()
        collected = before - len(gc.get_objects())
        if collected > 0:
            logger.debug(f"Forced Python interpreter gc.collect(). Swept {collected} unreferenced variables.")
        return collected

    @classmethod
    def flush_accelerator_pools(cls, device: str) -> None:
        """Frees unreferenced storage allocations inside hardware accelerator pipelines (CUDA or MPS)."""
        cls.force_garbage_collection()
        
        if device == "cuda":
            try:
                import torch
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    torch.cuda.ipc_collect()
                    logger.debug("Successfully purged CUDA GPU memory allocations & IPC buffers.")
            except Exception as e:
                logger.error(f"Failed to flush CUDA caches: {str(e)}")
                
        elif device == "mps":
            try:
                import torch
                if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                    # Empty Apple Silicon MPS caches
                    torch.mps.empty_cache()
                    logger.debug("Successfully purged Apple Silicon MPS unified cache registers.")
            except Exception as e:
                logger.error(f"Failed to flush MPS caches: {str(e)}")

    @classmethod
    def handle_low_memory_conditions(cls, device: str) -> bool:
        """
        Scans host memory and VRAM utilization.
        If thresholds are breached, triggers full system caches flush.
        Returns True if a critical condition was intercepted and mitigated.
        """
        mitigated = False
        
        # Check host system memory limits
        try:
            host_mem = device_manager.inspect_host_memory()
            if host_mem["used_percent"] > 90.0:
                logger.warning(f"Host system RAM usage exceeds 90% ({host_mem['used_percent']}%). Flushing active pools.")
                cls.flush_accelerator_pools(device)
                mitigated = True
        except Exception as e:
            logger.error(f"MemoryManager failed to poll host RAM indices: {str(e)}")

        # Check GPU VRAM limits
        if device == "cuda":
            try:
                vram = device_manager.inspect_vram_utilization(0)
                used_ratio = vram["allocated_mb"] / vram["total_mb"]
                if used_ratio > 0.85:
                    logger.warning(f"NVIDIA GPU VRAM allocations have breached 85% ({used_ratio*100:.1f}%). Releasing caches.")
                    cls.flush_accelerator_pools(device)
                    mitigated = True
            except Exception as e:
                logger.error(f"MemoryManager failed to poll CUDA GPU metrics: {str(e)}")

        return mitigated
