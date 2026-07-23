from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CanvasCourse(BaseModel):
    """A course as returned by the Canvas API."""

    model_config = ConfigDict(extra="ignore")

    id: int
    name: str | None = None


class CanvasAssignment(BaseModel):
    """An assignment as returned by the Canvas API."""

    model_config = ConfigDict(extra="ignore")

    id: int
    name: str
    course_id: int
    due_at: datetime | None = None
    unlock_at: datetime | None = None
    html_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
