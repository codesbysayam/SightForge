# ==============================================================================
# conftest.py - Pytest Custom Fixtures & Mocking Layers
# ==============================================================================

import pytest
import numpy as np
from typing import Dict, Any, List
from unittest.mock import MagicMock


@pytest.fixture
def mock_frame_matrix() -> np.ndarray:
    """Generates a standard 3-channel 720p simulated frame canvas for testing."""
    return np.zeros((720, 1280, 3), dtype=np.uint8)


@pytest.fixture
def mock_detection_payload() -> List[Dict[str, Any]]:
    """Returns a standardized model detection payload mimicking real YOLO outputs."""
    return [
        {
            "box": [100.0, 150.0, 250.0, 350.0],
            "score": 0.8924,
            "class_id": 0 # Represents 'person'
        },
        {
            "box": [500.0, 200.0, 580.0, 290.0],
            "score": 0.7451,
            "class_id": 2 # Represents 'car'
        }
    ]


@pytest.fixture
def mock_detector_instance() -> MagicMock:
    """Mocks the core detector interface, bypassing model weights loading."""
    mock = MagicMock()
    mock.detect.return_value = [
        {"box": [100.0, 150.0, 250.0, 350.0], "score": 0.89, "class_id": 0}
    ]
    return mock
