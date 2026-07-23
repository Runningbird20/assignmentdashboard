from pydantic import BaseModel, Field


class ImportRequest(BaseModel):
    # Falls back to the GOOGLE_SHEET_URL setting when omitted.
    sheet_url: str | None = None


class ImportSummary(BaseModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = Field(default_factory=list)
