from fastapi import APIRouter, UploadFile

from app.api.deps import DbSession
from app.core.config import get_settings
from app.core.exceptions import IcsImportError, SheetImportError
from app.schemas.ics_import import IcsParseResult
from app.schemas.imports import ImportRequest, ImportSummary
from app.services import ics_import_service, import_service

router = APIRouter(prefix="/import", tags=["import"])

_MAX_ICS_BYTES = 5 * 1024 * 1024


@router.post("/google-sheet", response_model=ImportSummary)
def import_google_sheet(payload: ImportRequest, db: DbSession) -> ImportSummary:
    settings = get_settings()
    sheet_url = payload.sheet_url or settings.google_sheet_url
    if not sheet_url:
        raise SheetImportError(
            "No Google Sheet URL provided. Add one in Settings or set GOOGLE_SHEET_URL."
        )
    return import_service.sync_from_sheet(db, sheet_url)


@router.post("/gt-schedule", response_model=IcsParseResult)
async def import_gt_schedule(file: UploadFile) -> IcsParseResult:
    """Parse a GT Scheduler .ics export into candidate classes for review.

    This does not write to the database — the frontend shows the results for
    the user to edit, then creates each one through the normal POST /classes
    endpoint (so duplicate-name validation still applies).
    """
    ics_bytes = await file.read(_MAX_ICS_BYTES + 1)
    if len(ics_bytes) > _MAX_ICS_BYTES:
        raise IcsImportError("That file is too large (max 5 MB).")
    return ics_import_service.parse_ics_schedule(ics_bytes)
