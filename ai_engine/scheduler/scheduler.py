# ==============================================================================
# scheduler.py - AI Engine Background Task Scheduler & Cron Runner
# ==============================================================================

import time
import threading
from typing import Callable, List, Dict, Any
from ai_engine.logger import setup_ai_logger

logger = setup_ai_logger("ai_scheduler")


class ScheduledTask:
    """Encapsulates a task function and its execution interval settings."""
    def __init__(self, name: str, action: Callable[[], None], interval_seconds: float) -> None:
        self.name = name
        self.action = action
        self.interval = interval_seconds
        self.last_run = time.time()


class AIScheduler:
    """Runs scheduled background maintenance sweeps (like memory resets and log cleanups) in dedicated threads."""
    def __init__(self) -> None:
        self._tasks: List[ScheduledTask] = []
        self._is_running = False
        self._thread: Optional[threading.Thread] = None

    def add_task(self, name: str, action: Callable[[], None], interval_seconds: float) -> None:
        """Registers a recurring background utility job."""
        self._tasks.append(ScheduledTask(name, action, interval_seconds))
        logger.info(f"Scheduled periodic job '{name}' to run every {interval_seconds}s")

    def start(self) -> None:
        """Launches the background clock daemon."""
        if self._is_running:
            return
        self._is_running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name="AISchedulerDaemon")
        self._thread.start()
        logger.info("Background AI task scheduler daemon started successfully.")

    def stop(self) -> None:
        """Signals background clock daemons to stop."""
        self._is_running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            logger.info("Background AI task scheduler daemon stopped.")

    def _run_loop(self) -> None:
        while self._is_running:
            now = time.time()
            for task in self._tasks:
                if now - task.last_run >= task.interval:
                    try:
                        logger.debug(f"Triggering background job execution: {task.name}")
                        task.action()
                    except Exception as e:
                        logger.error(f"Periodic job execution failed inside '{task.name}': {str(e)}")
                    finally:
                        task.last_run = now
            time.sleep(1.0)
