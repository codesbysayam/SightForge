# ==============================================================================
# interfaces.py - Multi-Object Tracking (MOT) Interface Systems
# ==============================================================================

from abc import ABC, abstractmethod
from typing import List, Tuple, Dict, Any, Deque
from collections import deque
import numpy as np


class TrackState:
    """Standard tracking lifecycle state machine labels."""
    TENTATIVE = 1
    ACTIVE = 2
    LOST = 3
    REMOVED = 4


class TrackObject:
    """Representational schema for a uniquely identified moving object within consecutive video streams."""
    def __init__(self, track_id: int, initial_bbox: Tuple[float, float, float, float], class_id: int, initial_score: float) -> None:
        self.track_id: int = track_id
        self.bbox: Tuple[float, float, float, float] = initial_bbox # [x1, y1, x2, y2]
        self.class_id: int = class_id
        self.score: float = initial_score
        self.state: int = TrackState.TENTATIVE
        self.age: int = 1
        self.hits: int = 1
        self.time_since_update: int = 0
        self.features: List[np.ndarray] = [] # Stores deep learning embeddings for Re-ID comparisons


class TrackHistory:
    """Manages raw location ring-buffers for a specific track, logging trajectories."""
    def __init__(self, max_points: int = 150) -> None:
        self.history_points: Deque[Tuple[float, float]] = deque(maxlen=max_points)

    def append_coordinate(self, center: Tuple[float, float]) -> None:
        """Appends an absolute coordinate centroid to the historical ring buffer."""
        self.history_points.append(center)

    def get_trajectory_path(self) -> List[Tuple[float, float]]:
        """Returns the full historical sequence of trajectory positions."""
        return list(self.history_points)


class TrajectoryManager(ABC):
    """Abstract manager responsible for analyzing multi-track direction trends and velocity indicators."""
    
    @abstractmethod
    def calculate_direction_vector(self, track_history: TrackHistory) -> Tuple[float, float]:
        """Analyzes historic points to evaluate the primary heading angle vector."""
        pass

    @abstractmethod
    def predict_future_position(self, track_history: TrackHistory, look_ahead_steps: int) -> Tuple[float, float]:
        """Extrapolates speed metrics to estimate downstream coordinate centers."""
        pass


class ReIDInterface(ABC):
    """Abstract interface for extracting deep convolutional features to resolve visual ID conflicts."""

    @abstractmethod
    def extract_features(self, crop_image: np.ndarray) -> np.ndarray:
        """Generates visual signature embeddings representing the cropped frame target."""
        pass

    @abstractmethod
    def compute_distance_matrix(self, active_features: List[np.ndarray], target_features: List[np.ndarray]) -> np.ndarray:
        """Calculates pairwise cosine or Euclidean distances between target visual maps."""
        pass


class TrackerBaseClass(ABC):
    """Primary tracking base establishing update/reset structures."""

    @abstractmethod
    def update(self, detections: List[Dict[str, Any]], frame: np.ndarray) -> List[TrackObject]:
        """Correlates new raw detections with existing track states across frame buffers."""
        pass

    @abstractmethod
    def reset(self) -> None:
        """Wipes active track indices and wipes history registers."""
        pass


class TrackManager(ABC):
    """Orchestrator monitoring, updating, and expiring active TrackObjects."""

    @abstractmethod
    def register_track(self, track: TrackObject) -> None:
        """Adds a track to the active database list."""
        pass

    @abstractmethod
    def expire_stale_tracks(self, max_lost_frames: int) -> None:
        """Removes tracking entries whose updates have timed out."""
        pass

    @abstractmethod
    def get_active_tracks(self) -> List[TrackObject]:
        """Retrieves currently tracked objects."""
        pass


# Adapters for future tracking algorithms
class ByteTrackAdapter(TrackerBaseClass):
    """
    Interface adapter for ByteTrack.
    Future developers can implement actual association matrices utilizing double confidence thresholds.
    """
    def __init__(self, track_thresh: float = 0.5, match_thresh: float = 0.8) -> None:
        self.track_thresh = track_thresh
        self.match_thresh = match_thresh
        self.tracks: List[TrackObject] = []
        self._next_id = 1

    def update(self, detections: List[Dict[str, Any]], frame: np.ndarray) -> List[TrackObject]:
        # Exposes the tracking hook without locking downstream implementation details.
        return self.tracks

    def reset(self) -> None:
        self.tracks.clear()
        self._next_id = 1


class DeepSORTAdapter(TrackerBaseClass):
    """
    Interface adapter for DeepSORT.
    Exposes Kalman filter prediction steps and cosine Re-ID distance associations.
    """
    def __init__(self, reid_model_path: str = "", max_dist: float = 0.2) -> None:
        self.reid_model_path = reid_model_path
        self.max_dist = max_dist
        self.tracks: List[TrackObject] = []
        self._next_id = 1

    def update(self, detections: List[Dict[str, Any]], frame: np.ndarray) -> List[TrackObject]:
        # Exposes the tracking hook without locking downstream implementation details.
        return self.tracks

    def reset(self) -> None:
        self.tracks.clear()
        self._next_id = 1
