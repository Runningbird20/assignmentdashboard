from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClassFileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_id: int
    filename: str
    content_type: str | None
    size_bytes: int
    created_at: datetime
