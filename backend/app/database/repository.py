from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.utils.time import utcnow


class AssignmentRepository:
    """All database access for assignments lives here."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_all(self) -> list[Assignment]:
        stmt = select(Assignment).order_by(Assignment.due_at)
        return list(self.db.scalars(stmt).all())

    def get_by_canvas_id(self, canvas_id: int) -> Assignment | None:
        stmt = select(Assignment).where(Assignment.canvas_id == canvas_id)
        return self.db.scalars(stmt).first()

    def add(self, assignment: Assignment) -> Assignment:
        self.db.add(assignment)
        return assignment

    def due_today(self) -> list[Assignment]:
        now = utcnow()
        start = datetime(now.year, now.month, now.day)
        end = start + timedelta(days=1)
        stmt = (
            select(Assignment)
            .where(Assignment.due_at >= start, Assignment.due_at < end)
            .order_by(Assignment.due_at)
        )
        return list(self.db.scalars(stmt).all())

    def due_this_week(self) -> list[Assignment]:
        now = utcnow()
        end = now + timedelta(days=7)
        stmt = (
            select(Assignment)
            .where(Assignment.due_at >= now, Assignment.due_at <= end)
            .order_by(Assignment.due_at)
        )
        return list(self.db.scalars(stmt).all())

    def recently_added(self) -> list[Assignment]:
        cutoff = utcnow() - timedelta(hours=24)
        stmt = (
            select(Assignment)
            .where(Assignment.first_seen >= cutoff)
            .order_by(Assignment.first_seen.desc())
        )
        return list(self.db.scalars(stmt).all())

    def overdue(self) -> list[Assignment]:
        now = utcnow()
        stmt = (
            select(Assignment)
            .where(Assignment.due_at.is_not(None), Assignment.due_at < now)
            .order_by(Assignment.due_at.desc())
        )
        return list(self.db.scalars(stmt).all())
