from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import EventType


class EventBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=120)
    start_time: datetime
    end_time: datetime | None = None
    type: EventType = EventType.OTHER

    @model_validator(mode="after")
    def validate_times(self) -> "EventBase":
        if self.end_time is not None and self.end_time < self.start_time:
            raise ValueError("end_time must not be before start_time")
        return self


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=120)
    start_time: datetime | None = None
    end_time: datetime | None = None
    type: EventType | None = None


class EventRead(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
