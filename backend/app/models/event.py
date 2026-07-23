from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base
from app.models.base import TimestampMixin
from app.models.enums import EventType


class Event(TimestampMixin, Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(120))
    # Naive local times: events live in the student's local timezone.
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime)
    type: Mapped[EventType] = mapped_column(
        SAEnum(
            EventType,
            values_callable=lambda enum: [member.value for member in enum],
            native_enum=False,
            length=10,
        ),
        default=EventType.OTHER,
    )
