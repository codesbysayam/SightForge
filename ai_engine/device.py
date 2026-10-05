# ==============================================================================
# device.py - Hardware Accelerator (CUDA/MPS/CPU) Resolver
# ==============================================================================

import sys
from ai_engine.config import ai_config
from ai_engine.logger import setup_ai_logger

logger = setup_ai_logger("hardware_resolver")


def resolve_compute_device() -> str:
    """
    Scans host environment capabilities to resolve optimal AI processing device.
    Supports NVIDIA CUDA, Apple Silicon MPS (Metal), and defaults safely to standard CPU.
    """
    pref = ai_config.DEVICE_PREFERENCE.lower()

    if pref in ["cuda", "gpu"]:
        import torch
        if torch.cuda.is_available():
            logger.info(f"Target GPU verified: {torch.cuda.get_device_name(0)}")
            return "cuda"
        logger.warning("CUDA preferred but torch.cuda is not available. Falling back to search.")

    elif pref == "mps":
        import torch
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            logger.info("Apple Silicon Metal Performance Shaders (MPS) verified.")
            return "mps"
        logger.warning("MPS preferred but not supported. Falling back to search.")

    # Search for any valid GPU if set to auto
    import torch
    if torch.cuda.is_available():
        logger.info(f"Auto-selected CUDA GPU: {torch.cuda.get_device_name(0)}")
        return "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        logger.info("Auto-selected Apple Silicon MPS.")
        return "mps"

    logger.warning("No hardware accelerators discovered. Execution will run on standard host CPU.")
    return "cpu"
