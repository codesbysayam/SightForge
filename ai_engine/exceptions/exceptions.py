# ==============================================================================
# exceptions.py - AI Engine Specific Exception Classes
# ==============================================================================

class AIEngineException(Exception):
    """Base exception class for all AI engine specific failures."""
    pass


class ConfigurationException(AIEngineException):
    """Raised when environment variables or model parameter settings are invalid."""
    pass


class DeviceException(AIEngineException):
    """Raised when compute hardware (CPU/GPU/MPS/TPU) allocation fails."""
    pass


class GPUException(DeviceException):
    """Raised when NVIDIA CUDA API failures or kernel errors occur."""
    pass


class MemoryException(DeviceException):
    """Raised during GPU VRAM or host system out-of-memory states."""
    pass


class ModelException(AIEngineException):
    """Base exception for all model operations including registration and loading."""
    pass


class InferenceException(AIEngineException):
    """Raised when forward pass execution fails inside the neural network."""
    pass


class PipelineException(AIEngineException):
    """Raised when a processing pipeline fails to parse, scale, or yield frames."""
    pass


class TrackingException(AIEngineException):
    """Raised when frame association, state filters, or trajectory histories fail."""
    pass
