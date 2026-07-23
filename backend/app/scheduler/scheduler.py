import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import get_settings
from app.services.sync_service import perform_sync

logger = logging.getLogger(__name__)

_JOB_ID = "canvas_sync"


class SyncScheduler:
    """Runs the Canvas sync on startup and then on a fixed interval."""

    def __init__(self) -> None:
        self._scheduler = BackgroundScheduler()

    def start(self) -> None:
        settings = get_settings()

        # Initial sync on startup.
        self._safe_sync()

        self._scheduler.add_job(
            self._safe_sync,
            trigger="interval",
            hours=settings.sync_interval_hours,
            id=_JOB_ID,
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info(
            "Scheduler started; syncing every %s hour(s).",
            settings.sync_interval_hours,
        )

    def shutdown(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)

    @staticmethod
    def _safe_sync() -> None:
        try:
            perform_sync()
        except Exception:
            logger.exception("Scheduled sync failed.")
