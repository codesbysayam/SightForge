# ==============================================================================
# telemetry.py - Enterprise Observability & Monitoring Infrastructure
# ==============================================================================

import json
import logging
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class StructuredJSONFormatter(logging.Formatter):
    """Formats log records into clean, parseable JSON strings for ELK or GCP Cloud Logging."""
    def format(self, record: logging.LogRecord) -> str:
        log_payload = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line_number": record.lineno,
            "process_id": record.process,
            "thread_id": record.threadName
        }
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_payload)


class ITelemetryCollector(ABC):
    """Abstract interface defining the contract for collecting monitoring counters."""
    @abstractmethod
    def record_counter(self, metric_name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None) -> None:
        pass

    @abstractmethod
    def record_gauge(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        pass


class PrometheusMetricsExporter(ITelemetryCollector):
    """
    Adapter formatting and buffering values matching Prometheus /metrics exposition standards.
    Future developers can expose this payload on an HTTP /metrics endpoint.
    """
    def __init__(self) -> None:
        self._counters: Dict[str, float] = {}
        self._gauges: Dict[str, float] = {}
        self._labels: Dict[str, Dict[str, str]] = {}

    def _get_key_with_labels(self, metric_name: str, labels: Optional[Dict[str, str]]) -> str:
        if not labels:
            return metric_name
        label_str = ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()))
        return f"{metric_name}{{{label_str}}}"

    def record_counter(self, metric_name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None) -> None:
        key = self._get_key_with_labels(metric_name, labels)
        self._counters[key] = self._counters.get(key, 0.0) + value

    def record_gauge(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        key = self._get_key_with_labels(metric_name, labels)
        self._gauges[key] = value

    def export_metrics_format(self) -> str:
        """Converts collected variables into Prometheus plaintext exposition format."""
        lines = []
        for key, val in self._counters.items():
            lines.append(f"# TYPE {key.split('{')[0]} counter")
            lines.append(f"{key} {val}")
        for key, val in self._gauges.items():
            lines.append(f"# TYPE {key.split('{')[0]} gauge")
            lines.append(f"{key} {val}")
        return "\n".join(lines)


class GrafanaDashboardGenerator:
    """Generates visual dashboard JSON layout declarations."""
    @staticmethod
    def compile_dashboard_config() -> Dict[str, Any]:
        """Provides a standard Grafana dashboard dashboard schema definition."""
        return {
            "dashboard": {
                "id": None,
                "title": "SIGHTFORGE Edge Metrics",
                "tags": ["sightforge", "edge-cv"],
                "timezone": "browser",
                "schemaVersion": 16,
                "panels": [
                    {
                        "type": "graph",
                        "title": "Frame Processing Speed (FPS)",
                        "targets": [{"expr": "average_fps", "legendFormat": "{{stream_id}}"}],
                    },
                    {
                        "type": "graph",
                        "title": "Inference Latency (ms)",
                        "targets": [{"expr": "average_latency_ms", "legendFormat": "{{device}}"}],
                    }
                ]
            }
        }


class ITracer(ABC):
    """Abstract interface defining the contract for distributed tracing spans."""
    @abstractmethod
    def start_span(self, span_name: str) -> None:
        pass

    @abstractmethod
    def end_span(self, span_name: str) -> None:
        pass


class SimpleDistributedTracer(ITracer):
    """Lightweight tracing tracker logging execution latency spans for deep performance investigation."""
    def __init__(self) -> None:
        self._spans: Dict[str, float] = {}

    def start_span(self, span_name: str) -> None:
        self._spans[span_name] = time.perf_counter()

    def end_span(self, span_name: str) -> None:
        if span_name in self._spans:
            duration_ms = (time.perf_counter() - self._spans[span_name]) * 1000.0
            # Under production, this outputs to Jaeger or Zipkin via OpenTelemetry agents
            logging.getLogger("distributed_tracer").debug(
                f"TRACE: Span '{span_name}' finalized. Duration: {duration_ms:.2f} ms"
            )
            del self._spans[span_name]


# Initialize package structures
def setup_structured_logging(logger_name: str, log_level: int = logging.INFO) -> logging.Logger:
    """Creates a logger instantiating our custom JSON structured formatting layout."""
    logger = logging.getLogger(logger_name)
    logger.setLevel(log_level)
    
    # Avoid duplicate handler bindings
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = StructuredJSONFormatter()
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger
