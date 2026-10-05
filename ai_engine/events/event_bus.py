# ==============================================================================
# event_bus.py - Observers & Event Bus Architecture for AI Pipeline State Changes
# ==============================================================================

import time
from typing import Dict, Any, List, Callable
from threading import Lock
from ai_engine.logger import setup_ai_logger

logger = setup_ai_logger("event_bus")


class Event:
    """Base Event payload structure representing state occurrences inside the AI pipeline."""
    def __init__(self, event_type: str, source: str, data: Dict[str, Any] = None) -> None:
        self.event_type = event_type
        self.source = source
        self.timestamp = time.time()
        self.data = data or {}


class EventTypes:
    """Standardized event labels used across the application workspace."""
    # Application Events
    APP_STARTUP = "app:startup"
    APP_SHUTDOWN = "app:shutdown"
    
    # AI Events
    AI_MODEL_LOADED = "ai:model_loaded"
    AI_MODEL_UNLOADED = "ai:model_unloaded"
    AI_INFERENCE_COMPLETED = "ai:inference_completed"
    AI_DETECTION_ALERT = "ai:detection_alert"
    
    # Pipeline Events
    PIPELINE_STREAM_CONNECTED = "pipeline:stream_connected"
    PIPELINE_STREAM_DISCONNECTED = "pipeline:stream_disconnected"
    PIPELINE_FRAME_DROPPED = "pipeline:frame_dropped"
    PIPELINE_ERROR_ENCOUNTERED = "pipeline:error_encountered"


class Subscriber:
    """Represents an event listener targeting designated categories."""
    def __init__(self, name: str, callback: Callable[[Event], None]) -> None:
        self.name = name
        self.callback = callback

    def on_event(self, event: Event) -> None:
        """Invokes the subscriber callback wrapper."""
        try:
            self.callback(event)
        except Exception as e:
            logger.error(f"Subscriber '{self.name}' failed to consume event '{event.event_type}': {str(e)}")


class EventBus:
    """
    Central event dispatch channel.
    Maintains subscriber rosters thread-safely and routes events.
    """
    def __init__(self) -> None:
        self._lock = Lock()
        self._subscribers: Dict[str, List[Subscriber]] = {}

    def subscribe(self, event_type: str, subscriber: Subscriber) -> None:
        """Registers a subscriber listener for a specific event type."""
        with self._lock:
            if event_type not in self._subscribers:
                self._subscribers[event_type] = []
            self._subscribers[event_type].append(subscriber)
            logger.debug(f"Subscriber '{subscriber.name}' registered to receive '{event_type}'")

    def unsubscribe(self, event_type: str, subscriber_name: str) -> None:
        """Unregisters a subscriber, removing it from notification list."""
        with self._lock:
            if event_type in self._subscribers:
                self._subscribers[event_type] = [
                    sub for sub in self._subscribers[event_type] if sub.name != subscriber_name
                ]
                logger.debug(f"Removed subscriber '{subscriber_name}' from '{event_type}' channels")

    def publish(self, event: Event) -> None:
        """Dispatches an event payload to all registered listeners."""
        # Work on local copy under lock to keep dispatch logic non-blocking
        targets: List[Subscriber] = []
        with self._lock:
            # Match specific listeners
            if event.event_type in self._subscribers:
                targets.extend(self._subscribers[event.event_type])
            # Match wildcards (e.g. '*')
            if "*" in self._subscribers:
                targets.extend(self._subscribers["*"])

        for sub in targets:
            sub.on_event(event)


# Singleton publisher channel
event_bus = EventBus()
