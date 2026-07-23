from datetime import date

from pydantic import BaseModel

from app.schemas.assignment import AssignmentRead
from app.schemas.event import EventRead
from app.schemas.school_class import ClassRead
from app.schemas.todo import TodoRead


class DashboardStats(BaseModel):
    total_classes: int
    assignments_remaining: int
    due_this_week: int
    completed_assignments: int
    todos_remaining: int
    overdue_assignments: int


class TodaysTasks(BaseModel):
    assignments: list[AssignmentRead]
    todos: list[TodoRead]


class DashboardRead(BaseModel):
    date: date
    todays_schedule: list[ClassRead]
    todays_tasks: TodaysTasks
    due_today: list[AssignmentRead]
    due_this_week: list[AssignmentRead]
    upcoming_events: list[EventRead]
    stats: DashboardStats
