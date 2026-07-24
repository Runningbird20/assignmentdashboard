"""Sync assignments from a Google Sheet with columns: Class | Assignment Name | Due Date.

Extra columns are ignored. Rows are matched to existing assignments by
(class, assignment name), case-insensitively:
- unknown assignments are inserted,
- existing assignments with a changed due date are updated,
- identical rows are skipped.
Classes named in the sheet that don't exist yet are created automatically.
"""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import SheetImportError
from app.models import Assignment, SchoolClass
from app.schemas.imports import ImportSummary
from app.services.google_sheets import fetch_sheet_rows
from app.utils.dates import parse_flexible_date

logger = logging.getLogger(__name__)

_CLASS_HEADERS = ("class", "course")
_NAME_HEADERS = ("assignment name", "assignment", "name", "title")
_DUE_HEADERS = ("due date", "due", "deadline")

# Colors assigned to classes auto-created during import.
_IMPORT_COLORS = (
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#ef4444", "#06b6d4", "#64748b",
)


def sync_from_sheet(db: Session, sheet_url: str) -> ImportSummary:
    rows = fetch_sheet_rows(sheet_url)
    if not rows:
        raise SheetImportError("The sheet is empty.")

    header = [cell.strip().lower() for cell in rows[0]]
    class_col = _find_column(header, _CLASS_HEADERS)
    name_col = _find_column(header, _NAME_HEADERS)
    due_col = _find_column(header, _DUE_HEADERS)
    if class_col is None or name_col is None or due_col is None:
        raise SheetImportError(
            "Could not find the required columns. The first row must contain "
            "'Class', 'Assignment Name' and 'Due Date' headers."
        )

    classes_by_name = {c.name.lower(): c for c in db.scalars(select(SchoolClass))}
    assignments_by_key = {
        (a.class_id, a.name.lower()): a for a in db.scalars(select(Assignment))
    }

    summary = ImportSummary()
    for row_number, row in enumerate(rows[1:], start=2):
        class_name = _cell(row, class_col)
        assignment_name = _cell(row, name_col)
        due_raw = _cell(row, due_col)
        if not class_name and not assignment_name and not due_raw:
            continue
        if not class_name or not assignment_name or not due_raw:
            summary.errors.append(f"Row {row_number}: missing a required value, skipped.")
            continue

        try:
            due_date = parse_flexible_date(due_raw)
        except (ValueError, OverflowError):
            summary.errors.append(
                f"Row {row_number}: could not parse due date '{due_raw}', skipped."
            )
            continue

        school_class = classes_by_name.get(class_name.lower())
        if school_class is None:
            school_class = SchoolClass(
                name=class_name,
                color=_IMPORT_COLORS[len(classes_by_name) % len(_IMPORT_COLORS)],
            )
            db.add(school_class)
            db.flush()
            classes_by_name[class_name.lower()] = school_class

        key = (school_class.id, assignment_name.lower())
        existing = assignments_by_key.get(key)
        if existing is None:
            assignment = Assignment(
                class_id=school_class.id, name=assignment_name, due_date=due_date
            )
            db.add(assignment)
            assignments_by_key[key] = assignment
            summary.created += 1
        elif existing.due_date != due_date:
            existing.due_date = due_date
            summary.updated += 1
        else:
            summary.skipped += 1

    db.commit()
    logger.info(
        "Sheet import finished: %s created, %s updated, %s skipped, %s errors",
        summary.created, summary.updated, summary.skipped, len(summary.errors),
    )
    return summary


def _find_column(header: list[str], candidates: tuple[str, ...]) -> int | None:
    for candidate in candidates:
        if candidate in header:
            return header.index(candidate)
    return None


def _cell(row: list[str], index: int) -> str:
    return row[index].strip() if index < len(row) else ""
