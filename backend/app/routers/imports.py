from fastapi import APIRouter

from app.api.deps import DbSession
from app.core.config import get_settings
from app.core.exceptions import SheetImportError
from app.schemas.imports import ImportRequest, ImportSummary
from app.services import import_service

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/google-sheet", response_model=ImportSummary)
def import_google_sheet(payload: ImportRequest, db: DbSession) -> ImportSummary:
    settings = get_settings()
    sheet_url = payload.sheet_url or settings.google_sheet_url
    if not sheet_url:
        raise SheetImportError(
            "No Google Sheet URL provided. Add one in Settings or set GOOGLE_SHEET_URL."
        )
    return import_service.sync_from_sheet(db, sheet_url, settings.google_sheets_api_key)
