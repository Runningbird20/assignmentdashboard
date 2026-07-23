from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import AssignmentOut, HealthOut
from app.database.repository import AssignmentRepository
from app.database.session import get_db
from app.services.sync_service import SyncResult, perform_sync

router = APIRouter()


def get_repository(db: Session = Depends(get_db)) -> AssignmentRepository:
    return AssignmentRepository(db)


@router.get("/health", response_model=HealthOut, tags=["system"])
def health() -> HealthOut:
    return HealthOut(status="ok")


@router.get("/assignments", response_model=list[AssignmentOut], tags=["assignments"])
def list_assignments(
    repo: AssignmentRepository = Depends(get_repository),
) -> list[AssignmentOut]:
    return [AssignmentOut.model_validate(a) for a in repo.get_all()]


@router.get(
    "/assignments/today",
    response_model=list[AssignmentOut],
    tags=["assignments"],
)
def assignments_today(
    repo: AssignmentRepository = Depends(get_repository),
) -> list[AssignmentOut]:
    return [AssignmentOut.model_validate(a) for a in repo.due_today()]


@router.get(
    "/assignments/week",
    response_model=list[AssignmentOut],
    tags=["assignments"],
)
def assignments_week(
    repo: AssignmentRepository = Depends(get_repository),
) -> list[AssignmentOut]:
    return [AssignmentOut.model_validate(a) for a in repo.due_this_week()]


@router.get(
    "/assignments/recent",
    response_model=list[AssignmentOut],
    tags=["assignments"],
)
def assignments_recent(
    repo: AssignmentRepository = Depends(get_repository),
) -> list[AssignmentOut]:
    return [AssignmentOut.model_validate(a) for a in repo.recently_added()]


@router.get(
    "/assignments/overdue",
    response_model=list[AssignmentOut],
    tags=["assignments"],
)
def assignments_overdue(
    repo: AssignmentRepository = Depends(get_repository),
) -> list[AssignmentOut]:
    return [AssignmentOut.model_validate(a) for a in repo.overdue()]


@router.post("/sync", response_model=SyncResult, tags=["system"])
def trigger_sync() -> SyncResult:
    return perform_sync()
