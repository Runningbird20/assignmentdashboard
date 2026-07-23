from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.assignment import AssignmentCreate, AssignmentRead, AssignmentUpdate
from app.services import assignment_service

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=list[AssignmentRead])
def list_assignments(db: DbSession, class_id: int | None = None) -> list[AssignmentRead]:
    return [
        AssignmentRead.model_validate(a)
        for a in assignment_service.list_assignments(db, class_id)
    ]


@router.post("", response_model=AssignmentRead, status_code=201)
def create_assignment(payload: AssignmentCreate, db: DbSession) -> AssignmentRead:
    return AssignmentRead.model_validate(
        assignment_service.create_assignment(db, payload)
    )


@router.put("/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: int, payload: AssignmentUpdate, db: DbSession
) -> AssignmentRead:
    return AssignmentRead.model_validate(
        assignment_service.update_assignment(db, assignment_id, payload)
    )


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: int, db: DbSession) -> None:
    assignment_service.delete_assignment(db, assignment_id)
