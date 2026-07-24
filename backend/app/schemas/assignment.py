from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AssignmentStatus, Priority, RecurrenceFrequency


class AssignmentBase(BaseModel):
    class_id: int
    name: str = Field(min_length=1, max_length=200)
    due_date: date
    status: AssignmentStatus = AssignmentStatus.TODO
    priority: Priority = Priority.MEDIUM
    notes: str | None = None
    recurrence_frequency: RecurrenceFrequency | None = None
    recurrence_interval: int = Field(default=1, ge=1)


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    class_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    due_date: date | None = None
    status: AssignmentStatus | None = None
    priority: Priority | None = None
    notes: str | None = None
    recurrence_frequency: RecurrenceFrequency | None = None
    recurrence_interval: int | None = Field(default=None, ge=1)


class AssignmentRead(AssignmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_name: str
    class_color: str
    created_at: datetime
    updated_at: datetime
