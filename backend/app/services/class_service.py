from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import SchoolClass
from app.schemas.school_class import ClassCreate, ClassUpdate
from app.services import file_storage


def list_classes(db: Session) -> list[SchoolClass]:
    return list(db.scalars(select(SchoolClass).order_by(SchoolClass.name)))


def get_class(db: Session, class_id: int) -> SchoolClass:
    school_class = db.get(SchoolClass, class_id)
    if school_class is None:
        raise NotFoundError(f"Class {class_id} not found")
    return school_class


def find_by_name(db: Session, name: str) -> SchoolClass | None:
    return db.scalar(
        select(SchoolClass).where(func.lower(SchoolClass.name) == name.lower())
    )


def create_class(db: Session, payload: ClassCreate) -> SchoolClass:
    if find_by_name(db, payload.name) is not None:
        raise ConflictError(f"A class named '{payload.name}' already exists")
    school_class = SchoolClass(**_to_column_values(payload.model_dump()))
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def update_class(db: Session, class_id: int, payload: ClassUpdate) -> SchoolClass:
    school_class = get_class(db, class_id)
    values = _to_column_values(payload.model_dump(exclude_unset=True))

    new_name = values.get("name")
    if new_name:
        existing = find_by_name(db, new_name)
        if existing is not None and existing.id != class_id:
            raise ConflictError(f"A class named '{new_name}' already exists")

    for field, value in values.items():
        setattr(school_class, field, value)
    db.commit()
    db.refresh(school_class)
    return school_class


def delete_class(db: Session, class_id: int) -> None:
    school_class = get_class(db, class_id)
    # The DB rows cascade-delete via the relationship, but the on-disk blobs
    # don't clean themselves up — remove them explicitly first.
    for class_file in school_class.files:
        file_storage.delete(class_file.storage_key)
    db.delete(school_class)
    db.commit()


def _to_column_values(data: dict[str, Any]) -> dict[str, Any]:
    if data.get("meeting_days") is not None:
        data["meeting_days"] = ",".join(data["meeting_days"])
    return data
