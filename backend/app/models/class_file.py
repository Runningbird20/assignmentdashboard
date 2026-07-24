from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.school_class import SchoolClass


class ClassFile(TimestampMixin, Base):
    __tablename__ = "class_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(
        ForeignKey("classes.id", ondelete="CASCADE"), index=True
    )
    # User-facing original filename, shown in the UI and used as the
    # download's Content-Disposition filename.
    filename: Mapped[str] = mapped_column(String(255))
    # Name of the blob on disk (or, later, the object key in S3-compatible
    # storage) — never derived from user input, so it can't path-traverse
    # or collide. See services/file_storage.py.
    storage_key: Mapped[str] = mapped_column(String(255), unique=True)
    content_type: Mapped[str | None] = mapped_column(String(120))
    size_bytes: Mapped[int] = mapped_column(Integer)

    school_class: Mapped["SchoolClass"] = relationship(back_populates="files")
