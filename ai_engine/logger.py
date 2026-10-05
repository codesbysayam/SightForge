# ==============================================================================
# logger.py - AI Inference Process Event Logger Setup
# ==============================================================================

import logging
import sys


def setup_ai_logger(name: str = "ai_engine") -> logging.Logger:
    """
    Creates a highly readable stream logger for tracking frame throughput,
    bounding metrics, FPS states, and GPU resource consumption in real-time.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if logger.hasHandlers():
        return logger

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] (AI Engine) %(name)s: %(message)s"
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    logger.propagate = False
    return logger
