# ==============================================================================
# pipelines.py - Reusable Pipeline Interfaces & Flow Controls
# ==============================================================================

from abc import ABC, abstractmethod
from typing import Generator, Any, List
import numpy as np


class InferencePipelineInterface(ABC):
    """Abstract interface for managing raw tensor forward-pass sequences."""
    
    @abstractmethod
    def preprocess(self, input_data: Any) -> Any:
        """Transforms raw source structures into normalized network tensor matrices."""
        pass

    @abstractmethod
    def forward(self, tensor_data: Any) -> Any:
        """Executes hardware-accelerated model predictions."""
        pass

    @abstractmethod
    def postprocess(self, inference_output: Any) -> Any:
        """Translates predictions into human-readable bounding coordinate collections."""
        pass


class ImagePipelineInterface(ABC):
    """Abstract interface for static image analytical pathways."""

    @abstractmethod
    def process_image(self, file_path_or_bytes: Any) -> dict:
        """Analyzes a single frame snapshot and returns metadata dictionaries."""
        pass


class VideoPipelineInterface(ABC):
    """Abstract interface for parsing and evaluating offline video archives."""

    @abstractmethod
    def process_file(self, video_path: str) -> Generator[dict, None, None]:
        """Iterates over video frames and yields tracking detection metadata blocks."""
        pass


class LiveStreamPipelineInterface(ABC):
    """Abstract interface for real-time video stream ingestion (e.g., RTSP, WebRTC)."""

    @abstractmethod
    def connect(self, stream_url: str) -> None:
        """Establishes stream connection buffers, starting background thread pools."""
        pass

    @abstractmethod
    def read_frames(self) -> Generator[np.ndarray, None, None]:
        """Yields raw frames from current active queues."""
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """Closes connections, flushes video queues, and cleans resources."""
        pass


class BatchPipelineInterface(ABC):
    """Abstract interface for batch processing pipelines designed for cloud-scale throughput."""

    @abstractmethod
    def process_batch(self, batch_inputs: List[Any]) -> List[dict]:
        """Evaluates list of inputs concurrently to optimize hardware memory pipelines."""
        pass


class TrackingPipelineInterface(ABC):
    """Abstract interface for mapping historical trajectories to detection boxes."""

    @abstractmethod
    def track_objects(self, frame: np.ndarray, detections: List[Any]) -> List[Any]:
        """Associates new frames with historical IDs."""
        pass


class AnalyticsPipelineInterface(ABC):
    """Abstract interface for calculating spatial analytics (e.g., tripwires, heatmaps)."""

    @abstractmethod
    def calculate_metrics(self, active_tracks: List[Any]) -> dict:
        """Evaluates entry/exit boundary breaches and spatial traffic counters."""
        pass
