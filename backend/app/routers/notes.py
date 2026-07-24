from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.services import note_service

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteRead])
def list_notes(class_id: int, db: DbSession) -> list[NoteRead]:
    return [NoteRead.model_validate(n) for n in note_service.list_notes(db, class_id)]


@router.post("", response_model=NoteRead, status_code=201)
def create_note(payload: NoteCreate, db: DbSession) -> NoteRead:
    return NoteRead.model_validate(note_service.create_note(db, payload))


@router.put("/{note_id}", response_model=NoteRead)
def update_note(note_id: int, payload: NoteUpdate, db: DbSession) -> NoteRead:
    return NoteRead.model_validate(note_service.update_note(db, note_id, payload))


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, db: DbSession) -> None:
    note_service.delete_note(db, note_id)
