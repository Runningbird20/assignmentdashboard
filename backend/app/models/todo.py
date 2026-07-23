from datetime import date

from sqlalchemy import Boolean, Date, Enum as SAEnum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base
from app.models.base import TimestampMixin
from app.models.enums import Priority


class Todo(TimestampMixin, Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[Priority] = mapped_column(
        SAEnum(
            Priority,
            values_callable=lambda enum: [member.value for member in enum],
            native_enum=False,
            length=10,
        ),
        default=Priority.MEDIUM,
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    # Manual ordering position for drag-and-drop.
    sort_order: Mapped[int] = mapped_column(default=0, index=True)
