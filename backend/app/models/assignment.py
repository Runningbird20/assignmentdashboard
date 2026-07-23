from datetime import date

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import TimestampMixin
from app.models.enums import AssignmentStatus, Priority
from app.models.school_class import SchoolClass


class Assignment(TimestampMixin, Base):
    __tablename__ = "assignments"
    __table_args__ = (
        UniqueConstraint("class_id", "name", name="uq_assignment_class_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(
        ForeignKey("classes.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[AssignmentStatus] = mapped_column(
        SAEnum(
            AssignmentStatus,
            values_callable=lambda enum: [member.value for member in enum],
            native_enum=False,
            length=20,
        ),
        default=AssignmentStatus.TODO,
    )
    priority: Mapped[Priority] = mapped_column(
        SAEnum(
            Priority,
            values_callable=lambda enum: [member.value for member in enum],
            native_enum=False,
            length=10,
        ),
        default=Priority.MEDIUM,
    )
    notes: Mapped[str | None] = mapped_column(Text)

    # Eagerly joined so read schemas can expose class_name/class_color.
    school_class: Mapped[SchoolClass] = relationship(
        back_populates="assignments", lazy="joined"
    )

    @property
    def class_name(self) -> str:
        return self.school_class.name

    @property
    def class_color(self) -> str:
        return self.school_class.color
