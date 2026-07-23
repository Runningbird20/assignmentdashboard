"""Background jobs. Currently a single job: periodic Google Sheet auto-sync,
enabled with AUTO_SYNC_ENABLED=true and a configured GOOGLE_SHEET_URL."""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import get_settings
from app.database.session import SessionLocal
from app.services.import_service import sync_from_sheet

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(daemon=True)


def sync_google_sheet_job() -> None:
    settings = get_settings()
    if not settings.google_sheet_url:
        return
    db = SessionLocal()
    try:
        sync_from_sheet(db, settings.google_sheet_url, settings.google_sheets_api_key)
    except Exception:
        logger.exception("Scheduled Google Sheet sync failed")
    finally:
        db.close()


def start_scheduler() -> None:
    settings = get_settings()
    if not settings.auto_sync_enabled:
        return
    scheduler.add_job(
        sync_google_sheet_job,
        "interval",
        minutes=settings.sync_interval_minutes,
        id="google_sheet_sync",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Google Sheet auto-sync scheduled every %s minutes",
        settings.sync_interval_minutes,
    )


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
