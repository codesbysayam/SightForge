# ==============================================================================
# benchmark.py - Edge Model Inference Benchmarking Utilities
# ==============================================================================

import time
from ai_engine.logger import setup_ai_logger
from ai_engine.model_loader import EnterpriseModelLoader
from ai_engine.config import ai_config

logger = setup_ai_logger("pipeline_benchmark")


def run_pipeline_benchmark(iterations: int = 50) -> dict:
    """
    Measures processing speed, latency, memory consumption, and frame-per-second (FPS) capacity
    of the local GPU/CPU hardware. Useful for provisioning hardware inside server farms.
    """
    logger.info(f"Starting performance profiling benchmark: {iterations} frame iterations...")
    
    loader = EnterpriseModelLoader()
    try:
        model = loader.load_model()
    except Exception as e:
        logger.error(f"Cannot perform speed profiling, model load failed: {str(e)}")
        return {"success": False, "error": str(e)}

    import numpy as np
    
    # Generate mock frame buffers
    test_frame = np.random.randint(0, 255, (ai_config.TARGET_HEIGHT, ai_config.TARGET_WIDTH, 3), dtype=np.uint8)
    
    # Track latencies
    latencies = []
    
    logger.info("Executing benchmark runs...")
    for i in range(iterations):
        t_start = time.perf_counter()
        
        # Dry inference
        model.predict(
            test_frame,
            device=loader.device,
            verbose=False,
            conf=ai_config.CONFIDENCE_THRESHOLD,
            iou=ai_config.IOU_THRESHOLD
        )
        
        t_end = time.perf_counter()
        latencies.append((t_end - t_start) * 1000) # Save as milliseconds

    # Compute profiling aggregates
    min_lat = min(latencies)
    max_lat = max(latencies)
    avg_lat = sum(latencies) / len(latencies)
    avg_fps = 1000.0 / avg_lat

    results = {
        "success": True,
        "model_loaded": ai_config.MODEL_NAME,
        "device": loader.device,
        "iterations_completed": iterations,
        "latency_stats_ms": {
            "min": round(min_lat, 2),
            "max": round(max_lat, 2),
            "average": round(avg_lat, 2)
        },
        "throughput_fps": round(avg_fps, 2)
    }

    logger.info(f"BENCHMARK COMPLETE | Throughput: {results['throughput_fps']} FPS | Avg Latency: {results['latency_stats_ms']['average']} ms")
    return results
