# ==============================================================================
# base.py - Reusable Detector Abstraction Interface
# ==============================================================================

from abc import ABC, abstractmethod
import numpy as np


class BaseDetector(ABC):
    """Abstract base class establishing the interface for all computer vision object detectors."""

    @abstractmethod
    def load(self, weights_path: str) -> None:
        """Loads model weights onto target processing accelerators (CPU, CUDA, MPS)."""
        pass

    @abstractmethod
    def detect(self, image: np.ndarray, confidence_threshold: float) -> list:
        """Performs image matrix inference and returns bounding boxes, labels, and confidence."""
        pass
