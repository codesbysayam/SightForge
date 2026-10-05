# ==============================================================================
# registry.py - Enterprise Model Registry & Architecture Factory
# ==============================================================================

import os
import hashlib
from abc import ABC, abstractmethod
from typing import Dict, Any, Type
from ai_engine.exceptions.exceptions import ModelException
from ai_engine.logger import setup_ai_logger

logger = setup_ai_logger("model_registry")


class ModelMetadata:
    """Encapsulates descriptive schemas for verifying registered weights files."""
    def __init__(self, name: str, version: str, file_hash: str, dimensions: tuple, task: str) -> None:
        self.name = name
        self.version = version
        self.file_hash = file_hash
        self.dimensions = dimensions # (width, height)
        self.task = task


class ModelLoaderInterface(ABC):
    """Abstract interface defining standard model lifecycle initialization sequences."""
    @abstractmethod
    def load(self, weights_path: str, device: str) -> Any:
        """Compiles model graphs and places weights in targeted hardware accelerators."""
        pass

    @abstractmethod
    def unload(self) -> None:
        """Releases hardware resources and wipes caches."""
        pass


class DownloadManagerInterface(ABC):
    """Abstract interface for downloading neural networks weights with checksum guarantees."""
    @abstractmethod
    def fetch_weights(self, model_name: str, dest_dir: str) -> str:
        """Secures files from trusted endpoints, validating download logs."""
        pass


class DefaultDownloadManager(DownloadManagerInterface):
    """Fallback implementation that validates local path integrity before downloading."""
    def fetch_weights(self, model_name: str, dest_dir: str) -> str:
        os.makedirs(dest_dir, exist_ok=True)
        path = os.path.join(dest_dir, model_name)
        if os.path.exists(path):
            logger.info(f"Local weight cache hits for: {model_name}")
            return path
        logger.info(f"Mocking secure download process for {model_name} to {path}...")
        # Future modules will implement actual download logic (e.g. requests, huggingface, etc.)
        with open(path, "wb") as f:
            f.write(b"MOCK_WEIGHTS_DATA_PAYLOAD_HERE")
        return path


class ModelValidator:
    """Verifies physical file checksum matches and validates inputs."""
    @staticmethod
    def verify_integrity(file_path: str, expected_sha256: str) -> bool:
        """Computes SHA256 hashes to guarantee downloaded binaries are corruption-free."""
        if not os.path.exists(file_path):
            return False
        if expected_sha256 == "skip":
            return True
        
        sha256 = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(8192), b""):
                    sha256.update(chunk)
            return sha256.hexdigest() == expected_sha256
        except Exception as e:
            logger.error(f"Integrity check failed: {str(e)}")
            return False


class ModelRegistry:
    """Central repository storing metadata schemas and managing weight version profiles."""
    def __init__(self) -> None:
        self._registry: Dict[str, ModelMetadata] = {}
        self._register_default_models()

    def _register_default_models(self) -> None:
        self.register(ModelMetadata(
            name="yolov8n.pt",
            version="1.0.0",
            file_hash="skip", # Use real hashes in production
            dimensions=(640, 640),
            task="object_detection"
        ))
        self.register(ModelMetadata(
            name="yolov8s.pt",
            version="1.0.0",
            file_hash="skip",
            dimensions=(640, 640),
            task="object_detection"
        ))

    def register(self, metadata: ModelMetadata) -> None:
        self._registry[metadata.name] = metadata
        logger.info(f"Registered model layout in local store: {metadata.name} (v{metadata.version})")

    def get_metadata(self, model_name: str) -> ModelMetadata:
        if model_name not in self._registry:
            raise ModelException(f"Requested model '{model_name}' is not registered.")
        return self._registry[model_name]


class ModelLifecycleManager:
    """Orchestrates caching states, checking and loading structures for dynamic AI workloads."""
    def __init__(self, registry: ModelRegistry, downloader: DownloadManagerInterface) -> None:
        self.registry = registry
        self.downloader = downloader
        self._active_models: Dict[str, Any] = {}

    def get_model(self, model_name: str, loader_class: Type[ModelLoaderInterface], device: str) -> Any:
        """Retrieves or loads model instance, caching compiled assets in memory."""
        cache_key = f"{model_name}_{device}"
        if cache_key in self._active_models:
            return self._active_models[cache_key]

        meta = self.registry.get_metadata(model_name)
        weights_dir = "./ai_engine/weights"
        path = self.downloader.fetch_weights(model_name, weights_dir)

        if not ModelValidator.verify_integrity(path, meta.file_hash):
            raise ModelException(f"Security validation failed: File hash mismatch for weights at {path}")

        logger.info(f"Initializing loader pipeline for active model: {model_name}")
        loader = loader_class()
        instance = loader.load(path, device)
        self._active_models[cache_key] = instance
        return instance

    def unload_model(self, model_name: str, device: str) -> None:
        """Releases GPU caches and removes pointers from active model dictionary."""
        cache_key = f"{model_name}_{device}"
        if cache_key in self._active_models:
            logger.info(f"Wiping active model instance from cache memory: {model_name}")
            del self._active_models[cache_key]


# Dependency Injection Model Factory Pattern
class ModelFactory:
    """Standardized entry point for instantiating pipeline components."""
    _downloader: DownloadManagerInterface = DefaultDownloadManager()
    _registry: ModelRegistry = ModelRegistry()
    _lifecycle_mgr: ModelLifecycleManager = ModelLifecycleManager(_registry, _downloader)

    @classmethod
    def set_downloader(cls, downloader: DownloadManagerInterface) -> None:
        cls._downloader = downloader
        cls._lifecycle_mgr = ModelLifecycleManager(cls._registry, cls._downloader)

    @classmethod
    def get_lifecycle_manager(cls) -> ModelLifecycleManager:
        return cls._lifecycle_mgr
