from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = ""


class NoteCreate(NoteBase):
    class_id: int


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = None


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_id: int
    created_at: datetime
    updated_at: datetime
