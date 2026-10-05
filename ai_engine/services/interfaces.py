# ==============================================================================
# interfaces.py - Service Layer Abstract Specifications
# ==============================================================================

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np


class IDeviceService(ABC):
    """Abstract interface defining target hardware resolution services."""
    
    @abstractmethod
    def get_optimal_device(self) -> str:
        """Resolves active execution hardware (e.g., 'cuda', 'mps', 'cpu')."""
        pass

    @abstractmethod
    def get_hardware_diagnostics(self) -> Dict[str, Any]:
        """Gathers system VRAM allocations, chip names, and core thread profiles."""
        pass


class IModelService(ABC):
    """Abstract interface for managing download, registration, and loading cycles of model weights."""

    @abstractmethod
    def fetch_model_weights(self, model_name: str) -> str:
        """Retrieves and checks integrity hashes on local weight files."""
        pass

    @abstractmethod
    def load_active_model(self, model_name: str, device: str) -> Any:
        """Preloads model weights onto designated compute memory buffers."""
        pass

    @abstractmethod
    def release_model(self, model_name: str, device: str) -> None:
        """Wipes specific active weight caches and unloads execution layers."""
        pass


class IInferenceService(ABC):
    """Abstract interface handling actual frame evaluation cycles."""

    @abstractmethod
    def run_prediction(self, frame: np.ndarray, confidence_threshold: float) -> List[Dict[str, Any]]:
        """Processes a single BGR frame, returning bounding box maps."""
        pass


class IPipelineService(ABC):
    """Abstract interface for starting, pausing, and monitoring active live camera pipelines."""

    @abstractmethod
    def register_stream(self, stream_id: str, stream_url: str) -> None:
        """Adds a live camera feeds worker queue."""
        pass

    @abstractmethod
    def start_pipeline(self, stream_id: str) -> None:
        """Commences background capture loop threads for the registered stream."""
        pass

    @abstractmethod
    def stop_pipeline(self, stream_id: str) -> None:
        """Gracefully halts stream consumer loops, freeing network bindings."""
        pass

    @abstractmethod
    def query_pipeline_status(self, stream_id: str) -> str:
        """Fetches thread states (e.g. 'live', 'buffering', 'offline')."""
        pass


class IMetricsService(ABC):
    """Abstract interface for publishing system metrics to Prometheus or REST dashboards."""

    @abstractmethod
    def increment_counters(self, processed: int, dropped: int) -> None:
        """Records state counters for the current pipeline cycle."""
        pass

    @abstractmethod
    def compile_active_telemetry(self) -> Dict[str, Any]:
        """Assembles metrics into JSON packages for remote API polling."""
        pass


class IBenchmarkService(ABC):
    """Abstract interface executing performance sweeps on target nodes."""

    @abstractmethod
    def profile_node_throughput(self, iterations: int) -> Dict[str, Any]:
        """Runs iterative frame operations to benchmark FPS limits and latency peaks."""
        pass
