"""Background jobs.

- Recurring todo/assignment rollover: always on, runs every
  RECURRENCE_CHECK_MINUTES. This is a backstop, not the primary mechanism —
  services/recurrence_service.py already runs opportunistically on every
  todos/assignments/dashboard read, so this job mainly covers the case where
  nobody's actively using the app when a due date arrives.
- Google Sheet auto-sync: opt-in, enabled with AUTO_SYNC_ENABLED=true and a
  configured GOOGLE_SHEET_URL.
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import get_settings
from app.database.session import SessionLocal
from app.services.import_service import sync_from_sheet
from app.services.recurrence_service import generate_due_recurrences

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(daemon=True)

_RECURRENCE_CHECK_MINUTES = 60


def sync_google_sheet_job() -> None:
    settings = get_settings()
    if not settings.google_sheet_url:
        return
    db = SessionLocal()
    try:
        sync_from_sheet(db, settings.google_sheet_url)
    except Exception:
        logger.exception("Scheduled Google Sheet sync failed")
    finally:
        db.close()


def generate_recurring_instances_job() -> None:
    db = SessionLocal()
    try:
        generate_due_recurrences(db)
    finally:
        db.close()


def start_scheduler() -> None:
    settings = get_settings()

    scheduler.add_job(
        generate_recurring_instances_job,
        "interval",
        minutes=_RECURRENCE_CHECK_MINUTES,
        id="recurring_instances",
        replace_existing=True,
    )

    if settings.auto_sync_enabled:
        scheduler.add_job(
            sync_google_sheet_job,
            "interval",
            minutes=settings.sync_interval_minutes,
            id="google_sheet_sync",
            replace_existing=True,
        )
        logger.info(
            "Google Sheet auto-sync scheduled every %s minutes",
            settings.sync_interval_minutes,
        )

    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
