from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import Note
from app.schemas.note import NoteCreate, NoteUpdate
from app.services import class_service


def list_notes(db: Session, class_id: int) -> list[Note]:
    class_service.get_class(db, class_id)
    stmt = (
        select(Note).where(Note.class_id == class_id).order_by(Note.updated_at.desc())
    )
    return list(db.scalars(stmt))


def get_note(db: Session, note_id: int) -> Note:
    note = db.get(Note, note_id)
    if note is None:
        raise NotFoundError(f"Note {note_id} not found")
    return note


def create_note(db: Session, payload: NoteCreate) -> Note:
    class_service.get_class(db, payload.class_id)
    note = Note(**payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def update_note(db: Session, note_id: int, payload: NoteUpdate) -> Note:
    note = get_note(db, note_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note_id: int) -> None:
    db.delete(get_note(db, note_id))
    db.commit()
