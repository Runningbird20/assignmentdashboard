from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Assignment, Event, SchoolClass, Todo
from app.models.enums import AssignmentStatus
from app.schemas.assignment import AssignmentRead
from app.schemas.dashboard import DashboardRead, DashboardStats, TodaysTasks
from app.schemas.event import EventRead
from app.schemas.school_class import ClassRead
from app.schemas.todo import TodoRead
from app.services import recurrence_service
from app.utils.course_code import extract_course_code
from app.utils.dates import day_abbrev


def get_dashboard(db: Session) -> DashboardRead:
    recurrence_service.generate_due_recurrences(db)
    today = date.today()
    week_end = today + timedelta(days=7)

    classes = list(db.scalars(select(SchoolClass).order_by(SchoolClass.name)))
    # Lecture/lab/recitation/exam sections of the same course share a code
    # (e.g. "MATH 1554: ...") and count as one class, not several.
    distinct_courses = {extract_course_code(c.name).lower() for c in classes}
    todays_schedule = [
        c for c in classes if day_abbrev(today) in (c.meeting_days or "").split(",")
    ]
    todays_schedule.sort(key=lambda c: c.meeting_time or "")

    assignments = list(
        db.scalars(select(Assignment).order_by(Assignment.due_date, Assignment.name))
    )
    incomplete = [a for a in assignments if a.status != AssignmentStatus.COMPLETE]
    due_today = [a for a in incomplete if a.due_date == today]
    due_this_week = [a for a in incomplete if today <= a.due_date <= week_end]
    overdue = [a for a in incomplete if a.due_date < today]

    todos = list(db.scalars(select(Todo).order_by(Todo.sort_order, Todo.id)))
    open_todos = [t for t in todos if not t.completed]
    todos_due_today = [t for t in open_todos if t.due_date == today]

    upcoming_events = list(
        db.scalars(
            select(Event)
            .where(
                Event.start_time >= datetime.combine(today, time.min),
                Event.start_time <= datetime.combine(week_end, time.max),
            )
            .order_by(Event.start_time)
        )
    )

    return DashboardRead(
        date=today,
        todays_schedule=[ClassRead.model_validate(c) for c in todays_schedule],
        todays_tasks=TodaysTasks(
            assignments=[AssignmentRead.model_validate(a) for a in due_today],
            todos=[TodoRead.model_validate(t) for t in todos_due_today],
        ),
        due_today=[AssignmentRead.model_validate(a) for a in due_today],
        due_this_week=[AssignmentRead.model_validate(a) for a in due_this_week],
        upcoming_events=[EventRead.model_validate(e) for e in upcoming_events],
        stats=DashboardStats(
            total_classes=len(distinct_courses),
            assignments_remaining=len(incomplete),
            due_this_week=len(due_this_week),
            completed_assignments=len(assignments) - len(incomplete),
            todos_remaining=len(open_todos),
            overdue_assignments=len(overdue),
        ),
    )
