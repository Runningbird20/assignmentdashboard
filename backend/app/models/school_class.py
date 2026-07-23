from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.assignment import Assignment


class SchoolClass(TimestampMixin, Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    professor: Mapped[str | None] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(120))
    # Comma-separated day abbreviations, e.g. "Mon,Wed,Fri".
    meeting_days: Mapped[str] = mapped_column(String(60), default="")
    meeting_time: Mapped[str | None] = mapped_column(String(60))
    office_hours: Mapped[str | None] = mapped_column(String(120))
    color: Mapped[str] = mapped_column(String(20), default="#3b82f6")

    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="school_class", cascade="all, delete-orphan"
    )
