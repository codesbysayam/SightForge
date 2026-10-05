# ==============================================================================
# base.py - Reusable Multi-Object Tracker Abstraction Interface
# ==============================================================================

from abc import ABC, abstractmethod
import numpy as np


class BaseTracker(ABC):
    """Abstract base class establishing the interface for tracking detections across consecutive video frames."""

    @abstractmethod
    def update(self, detections: list, frame: np.ndarray) -> list:
        """Associates new bounding box detections with historical trajectories (tracks)."""
        pass

    @abstractmethod
    def reset(self) -> None:
        """Clears all active tracking IDs and historical paths."""
        pass
