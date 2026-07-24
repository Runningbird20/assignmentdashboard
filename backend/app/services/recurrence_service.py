"""Rolls recurring todos/assignments forward as their due dates arrive.

A recurring todo/assignment is just a normal row with `recurrence_frequency`
set — there's no separate "series" or "template" concept. Whenever its due
date arrives (<= today), `generate_due_recurrences`:

1. creates a new row for the next occurrence (due date shifted by the
   configured frequency/interval), copying over title/priority/etc., and
2. clears `recurrence_frequency` on the *old* row, so it becomes a normal
   one-off historical record and the new row carries the series forward.

This makes the function naturally idempotent: a row is only ever "due for
rollover" once, since clearing its frequency immediately removes it from
future matches, and the new row's due date is always in the future. That's
what makes it safe to call both opportunistically on every read
(list_todos/list_assignments/dashboard) *and* from the periodic scheduled
job (scheduler/jobs.py) without generating duplicates.

Assignments have a `(class_id, name)` uniqueness constraint (see
models/assignment.py) — changing that constraint to also cover due_date
would be the "proper" fix, but SQLite can't alter a UniqueConstraint
in place without rebuilding the table, which is riskier than necessary here.
Instead, a generated follow-up appends its due date to the name (e.g.
"Weekly Quiz" -> "Weekly Quiz (Aug 11)") to stay unique — only generated
rows are renamed this way; the row the user actually typed a name into
keeps it verbatim. Todos have no such constraint, so their title is copied
as-is.

Errors here are logged and swallowed rather than raised: this runs inside
hot read paths, and a rare failure (e.g., the unlikely case of a genuine
name collision on the disambiguated name above) must never break the
todos/assignments/dashboard pages just because a background rollover
hiccuped — it'll simply retry on the next read or scheduled run.
"""

import logging
from datetime import date, timedelta

from dateutil.relativedelta import relativedelta
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Assignment, Todo
from app.models.enums import RecurrenceFrequency

logger = logging.getLogger(__name__)


def generate_due_recurrences(db: Session) -> int:
    try:
        return _generate_due_recurrences(db)
    except Exception:
        logger.exception("Failed to generate recurring todos/assignments")
        db.rollback()
        return 0


def _generate_due_recurrences(db: Session) -> int:
    today = date.today()
    generated = 0

    due_todos = list(
        db.scalars(
            select(Todo).where(
                Todo.recurrence_frequency.is_not(None), Todo.due_date <= today
            )
        )
    )
    for todo in due_todos:
        next_due = _next_due_date(todo.due_date, todo.recurrence_frequency, todo.recurrence_interval)
        max_order = db.scalar(select(func.max(Todo.sort_order))) or 0
        db.add(
            Todo(
                title=todo.title,
                description=todo.description,
                priority=todo.priority,
                due_date=next_due,
                sort_order=max_order + 1,
                recurrence_frequency=todo.recurrence_frequency,
                recurrence_interval=todo.recurrence_interval,
            )
        )
        todo.recurrence_frequency = None
        generated += 1

    due_assignments = list(
        db.scalars(
            select(Assignment).where(
                Assignment.recurrence_frequency.is_not(None),
                Assignment.due_date <= today,
            )
        )
    )
    for assignment in due_assignments:
        next_due = _next_due_date(
            assignment.due_date, assignment.recurrence_frequency, assignment.recurrence_interval
        )
        db.add(
            Assignment(
                class_id=assignment.class_id,
                name=f"{assignment.name} ({_format_month_day(next_due)})",
                due_date=next_due,
                priority=assignment.priority,
                notes=assignment.notes,
                recurrence_frequency=assignment.recurrence_frequency,
                recurrence_interval=assignment.recurrence_interval,
            )
        )
        assignment.recurrence_frequency = None
        generated += 1

    if generated:
        db.commit()
    return generated


def _next_due_date(current: date, frequency: RecurrenceFrequency, interval: int) -> date:
    if frequency == RecurrenceFrequency.DAILY:
        return current + timedelta(days=interval)
    if frequency == RecurrenceFrequency.WEEKLY:
        return current + timedelta(weeks=interval)
    return current + relativedelta(months=interval)  # MONTHLY


def _format_month_day(value: date) -> str:
    return f"{value.strftime('%b')} {value.day}"
