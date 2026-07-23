from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Weekday = Literal["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"


def _split_days(value: object) -> object:
    if isinstance(value, str):
        return [day for day in value.split(",") if day]
    return value


class ClassBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    professor: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    meeting_days: list[Weekday] = Field(default_factory=list)
    meeting_time: str | None = Field(default=None, max_length=60)
    office_hours: str | None = Field(default=None, max_length=120)
    color: str = Field(default="#3b82f6", pattern=COLOR_PATTERN)

    split_meeting_days = field_validator("meeting_days", mode="before")(_split_days)


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    professor: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    meeting_days: list[Weekday] | None = None
    meeting_time: str | None = Field(default=None, max_length=60)
    office_hours: str | None = Field(default=None, max_length=120)
    color: str | None = Field(default=None, pattern=COLOR_PATTERN)

    split_meeting_days = field_validator("meeting_days", mode="before")(_split_days)


class ClassRead(ClassBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
