from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.event import EventCreate, EventRead, EventUpdate
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventRead])
def list_events(db: DbSession) -> list[EventRead]:
    return [EventRead.model_validate(e) for e in event_service.list_events(db)]


@router.post("", response_model=EventRead, status_code=201)
def create_event(payload: EventCreate, db: DbSession) -> EventRead:
    return EventRead.model_validate(event_service.create_event(db, payload))


@router.put("/{event_id}", response_model=EventRead)
def update_event(event_id: int, payload: EventUpdate, db: DbSession) -> EventRead:
    return EventRead.model_validate(event_service.update_event(db, event_id, payload))


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: DbSession) -> None:
    event_service.delete_event(db, event_id)
