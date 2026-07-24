from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Priority, RecurrenceFrequency


class TodoBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    priority: Priority = Priority.MEDIUM
    completed: bool = False
    due_date: date | None = None
    recurrence_frequency: RecurrenceFrequency | None = None
    recurrence_interval: int = Field(default=1, ge=1)


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    priority: Priority | None = None
    completed: bool | None = None
    due_date: date | None = None
    recurrence_frequency: RecurrenceFrequency | None = None
    recurrence_interval: int | None = Field(default=None, ge=1)


class TodoReorder(BaseModel):
    ids: list[int] = Field(min_length=1)


class TodoRead(TodoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
