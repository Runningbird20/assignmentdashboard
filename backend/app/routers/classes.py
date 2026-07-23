from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.school_class import ClassCreate, ClassRead, ClassUpdate
from app.services import class_service

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("", response_model=list[ClassRead])
def list_classes(db: DbSession) -> list[ClassRead]:
    return [ClassRead.model_validate(c) for c in class_service.list_classes(db)]


@router.get("/{class_id}", response_model=ClassRead)
def get_class(class_id: int, db: DbSession) -> ClassRead:
    return ClassRead.model_validate(class_service.get_class(db, class_id))


@router.post("", response_model=ClassRead, status_code=201)
def create_class(payload: ClassCreate, db: DbSession) -> ClassRead:
    return ClassRead.model_validate(class_service.create_class(db, payload))


@router.put("/{class_id}", response_model=ClassRead)
def update_class(class_id: int, payload: ClassUpdate, db: DbSession) -> ClassRead:
    return ClassRead.model_validate(class_service.update_class(db, class_id, payload))


@router.delete("/{class_id}", status_code=204)
def delete_class(class_id: int, db: DbSession) -> None:
    class_service.delete_class(db, class_id)
