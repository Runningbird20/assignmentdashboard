from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import TimestampMixin
from app.models.enums import SectionType

if TYPE_CHECKING:
    from app.models.assignment import Assignment
    from app.models.class_file import ClassFile
    from app.models.note import Note


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
    # Distinguishes sections sharing a course code (e.g. lecture vs. lab)
    # when a course has more than one meeting pattern.
    section_type: Mapped[SectionType | None] = mapped_column(
        SAEnum(
            SectionType,
            values_callable=lambda enum: [member.value for member in enum],
            native_enum=False,
            length=20,
        ),
    )

    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="school_class", cascade="all, delete-orphan"
    )
    files: Mapped[list["ClassFile"]] = relationship(
        back_populates="school_class", cascade="all, delete-orphan"
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="school_class", cascade="all, delete-orphan"
    )
