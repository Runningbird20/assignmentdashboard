from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.dashboard import DashboardRead
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardRead)
def get_dashboard(db: DbSession) -> DashboardRead:
    return dashboard_service.get_dashboard(db)
