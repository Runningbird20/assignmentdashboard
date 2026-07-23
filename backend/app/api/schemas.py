from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssignmentOut(BaseModel):
    """API representation of a stored assignment."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    canvas_id: int
    course_id: int
    course_name: str
    name: str
    due_at: datetime | None
    unlock_at: datetime | None
    html_url: str | None
    created_at: datetime | None
    updated_at: datetime | None
    first_seen: datetime
    last_seen: datetime


class HealthOut(BaseModel):
    status: str
