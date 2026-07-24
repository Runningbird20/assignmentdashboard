from pydantic import BaseModel, Field

from app.models.enums import SectionType


class ParsedClassPreview(BaseModel):
    """A class found in a GT Scheduler .ics export, awaiting user confirmation.

    Nothing is written to the database until the user reviews and submits
    these through the normal POST /classes endpoint.
    """

    name: str
    professor: str | None = None
    location: str | None = None
    meeting_days: list[str] = Field(default_factory=list)
    meeting_time: str | None = None
    color: str
    warning: str | None = None
    section_type: SectionType | None = None
    # True when another parsed row shares this row's course code (e.g. "CS
    # 3001") but a different meeting time — GT Scheduler exports the lecture,
    # lab, recitation, and exam block for a course as separate events, so the
    # frontend should ask the user to label each one before import.
    needs_section_type: bool = False


class IcsParseResult(BaseModel):
    classes: list[ParsedClassPreview]
    skipped_events: int = 0
    warnings: list[str] = Field(default_factory=list)
