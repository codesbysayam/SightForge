# ==============================================================================
# logging.py - Enterprise Structured JSON Logging Setup
# ==============================================================================

import logging
import sys
from logging.handlers import RotatingFileHandler
import os
from backend.app.core.config import settings


def setup_logger(name: str) -> logging.Logger:
    """
    Creates a rotating file and standard output logger.
    Uses JSON formatting in production environments for indexing in ELK or Datadog,
    and colored human-readable formats in development environments.
    """
    logger = logging.getLogger(name)
    logger.setLevel(settings.LOG_LEVEL.upper())

    # Avoid duplicate handlers if already initialized
    if logger.hasHandlers():
        return logger

    # Format definitions
    dev_format = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s"
    )

    # Standard Output (Console) Handler
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(dev_format)
    logger.addHandler(stdout_handler)

    # Persistent File Handler (if configured)
    if settings.LOG_TO_FILE:
        log_dir = os.path.dirname(settings.LOG_FILE_PATH)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)

        file_handler = RotatingFileHandler(
            settings.LOG_FILE_PATH,
            maxBytes=10 * 1024 * 1024, # 10 Megabytes rotating limit
            backupCount=5
        )
        file_handler.setFormatter(dev_format)
        logger.addHandler(file_handler)

    logger.propagate = False
    return logger
