import logging
from datetime import datetime

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.canvas.client import CanvasClient
from app.canvas.schemas import CanvasAssignment
from app.config import Settings, get_settings
from app.database.repository import AssignmentRepository
from app.database.session import SessionLocal
from app.models.assignment import Assignment
from app.slack.notifier import SlackNotifier
from app.utils.time import to_naive_utc, utcnow

logger = logging.getLogger(__name__)


class SyncResult(BaseModel):
    courses: int
    seen: int
    new: int
    new_assignment_names: list[str]


def _build_assignment(
    canvas_assignment: CanvasAssignment,
    course_name: str,
    now: datetime,
) -> Assignment:
    return Assignment(
        canvas_id=canvas_assignment.id,
        course_id=canvas_assignment.course_id,
        course_name=course_name,
        name=canvas_assignment.name,
        due_at=to_naive_utc(canvas_assignment.due_at),
        unlock_at=to_naive_utc(canvas_assignment.unlock_at),
        html_url=canvas_assignment.html_url,
        created_at=to_naive_utc(canvas_assignment.created_at),
        updated_at=to_naive_utc(canvas_assignment.updated_at),
        first_seen=now,
        last_seen=now,
    )


class SyncService:
    """Fetches Canvas data, persists it, and reports newly found assignments."""

    def __init__(
        self,
        db: Session,
        canvas: CanvasClient,
        slack: SlackNotifier,
    ) -> None:
        self.repo = AssignmentRepository(db)
        self.db = db
        self.canvas = canvas
        self.slack = slack

    def run(self) -> SyncResult:
        now = utcnow()
        courses = self.canvas.get_active_courses()
        new_assignments: list[Assignment] = []
        seen = 0

        for course in courses:
            course_name = course.name or f"Course {course.id}"
            for canvas_assignment in self.canvas.get_course_assignments(course.id):
                seen += 1
                existing = self.repo.get_by_canvas_id(canvas_assignment.id)
                if existing is None:
                    record = _build_assignment(canvas_assignment, course_name, now)
                    self.repo.add(record)
                    new_assignments.append(record)
                else:
                    self._refresh(existing, canvas_assignment, course_name, now)

        self.db.commit()

        self.slack.notify_new_assignments(new_assignments)

        return SyncResult(
            courses=len(courses),
            seen=seen,
            new=len(new_assignments),
            new_assignment_names=[a.name for a in new_assignments],
        )

    @staticmethod
    def _refresh(
        existing: Assignment,
        canvas_assignment: CanvasAssignment,
        course_name: str,
        now: datetime,
    ) -> None:
        existing.course_name = course_name
        existing.name = canvas_assignment.name
        existing.due_at = to_naive_utc(canvas_assignment.due_at)
        existing.unlock_at = to_naive_utc(canvas_assignment.unlock_at)
        existing.html_url = canvas_assignment.html_url
        existing.updated_at = to_naive_utc(canvas_assignment.updated_at)
        existing.last_seen = now


def perform_sync(settings: Settings | None = None) -> SyncResult:
    """Entry point used by the scheduler and the POST /sync endpoint."""
    settings = settings or get_settings()

    if not settings.canvas_configured:
        logger.warning("Canvas is not configured; skipping sync.")
        return SyncResult(courses=0, seen=0, new=0, new_assignment_names=[])

    canvas = CanvasClient(settings.canvas_api_url, settings.canvas_access_token)
    slack = SlackNotifier(settings.slack_webhook_url)

    db = SessionLocal()
    try:
        result = SyncService(db, canvas, slack).run()
        logger.info(
            "Sync complete: %s courses, %s seen, %s new.",
            result.courses,
            result.seen,
            result.new,
        )
        return result
    except Exception:
        db.rollback()
        logger.exception("Sync failed.")
        raise
    finally:
        db.close()
