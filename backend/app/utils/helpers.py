# ==============================================================================
# helpers.py - Common Utilities and String Formatter Algorithms
# ==============================================================================

import time


def get_current_epoch_ms() -> int:
    """Returns the current Unix epoch timestamp in milliseconds."""
    return int(time.time() * 1000)


def format_bytes_to_readable(size_in_bytes: int) -> str:
    """Formats raw integers of bytes to human-readable memory scale notations."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"
