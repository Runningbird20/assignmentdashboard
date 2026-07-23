from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Assignment(Base):
    """A Canvas assignment mirrored into the local database.

    ``created_at`` / ``updated_at`` mirror the values reported by Canvas.
    ``first_seen`` records when this row was first discovered locally and
    drives the "Recently Added" view; ``last_seen`` is refreshed every sync.
    """

    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    canvas_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, index=True)
    course_name: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)

    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    unlock_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    html_url: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    first_seen: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
