"""Parse a GT Scheduler .ics export into a list of candidate classes.

GT Scheduler's calendar export contains one VEVENT per weekly meeting
pattern for each registered class: SUMMARY is the course code, DESCRIPTION
the course title, LOCATION the room, and a weekly RRULE (BYDAY) gives the
meeting days. This is a standard, unambiguous format handled by the
`icalendar` library — no OCR, no computer vision, no AI involved.

Occasionally the same class is exported as several single-day VEVENTs
instead of one VEVENT listing multiple BYDAY values (seen with GT
Scheduler's own recurring extracurricular entries). Events that share a
name and an identical meeting time are merged into one entry with combined
days. Events that share a name but have a *different* time (e.g. a lecture
and a separate recitation section under the same course code) are kept as
separate entries, flagged with `needs_section_type` so the frontend can ask
the user to label each one (Lecture/Lab/Recitation/Exam) — that label, not
the meeting days, is what disambiguates their names, since every class in
StudentOS needs a unique name and "(Mon, Wed, Fri)" isn't a meaningful label
on its own.
"""

from collections import defaultdict
from dataclasses import dataclass, field

from icalendar import Calendar
from icalendar.cal import Event

from app.core.exceptions import IcsImportError
from app.schemas.ics_import import IcsParseResult, ParsedClassPreview

_ICAL_DAY_TO_APP_DAY = {
    "MO": "Mon",
    "TU": "Tue",
    "WE": "Wed",
    "TH": "Thu",
    "FR": "Fri",
    "SA": "Sat",
    "SU": "Sun",
}
_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# Colors assigned to imported classes, in the order they're first seen.
_IMPORT_COLORS = (
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#ef4444", "#06b6d4", "#64748b",
)


@dataclass
class _ParsedEvent:
    course_code: str
    name: str
    meeting_time: str | None
    location: str | None
    days: list[str] = field(default_factory=list)


def parse_ics_schedule(ics_bytes: bytes) -> IcsParseResult:
    try:
        calendar = Calendar.from_ical(ics_bytes)
    except (ValueError, IndexError) as exc:
        raise IcsImportError(f"Could not read that .ics file: {exc}") from exc

    events = [component for component in calendar.walk() if component.name == "VEVENT"]
    if not events:
        return IcsParseResult(
            classes=[], warnings=["No events were found in that .ics file."]
        )

    grouped: dict[tuple[str, str], tuple[ParsedClassPreview, str]] = {}
    skipped = 0

    for event in events:
        parsed = _parse_event(event)
        if parsed is None:
            skipped += 1
            continue

        key = (parsed.name.lower(), parsed.meeting_time or "")
        existing = grouped.get(key)
        if existing is None:
            preview = ParsedClassPreview(
                name=parsed.name,
                location=parsed.location,
                meeting_days=list(parsed.days),
                meeting_time=parsed.meeting_time,
                color=_IMPORT_COLORS[len(grouped) % len(_IMPORT_COLORS)],
            )
            grouped[key] = (preview, parsed.course_code)
        else:
            preview, _ = existing
            for day in parsed.days:
                if day not in preview.meeting_days:
                    preview.meeting_days.append(day)

    classes = [preview for preview, _ in grouped.values()]
    for preview in classes:
        preview.meeting_days.sort(key=_WEEKDAYS.index)

    course_codes = [code for _, code in grouped.values()]
    _flag_repeated_sections(classes, course_codes)

    return IcsParseResult(classes=classes, skipped_events=skipped)


def _parse_event(event: Event) -> _ParsedEvent | None:
    summary = str(event.get("summary") or "").strip()
    if not summary:
        return None

    description = str(event.get("description") or "").strip()
    name = f"{summary}: {description}" if description else summary

    location = str(event.get("location") or "").strip() or None

    dtstart = event.get("dtstart")
    dtend = event.get("dtend")
    meeting_time = (
        _format_time_range(dtstart.dt, dtend.dt)
        if dtstart is not None and dtend is not None
        else None
    )

    return _ParsedEvent(
        course_code=summary,
        name=name,
        meeting_time=meeting_time,
        location=location,
        days=_extract_days(event),
    )


def _extract_days(event: Event) -> list[str]:
    rrule = event.get("rrule")
    byday = [str(day) for day in rrule.get("BYDAY", [])] if rrule is not None else []
    if byday:
        return [_ICAL_DAY_TO_APP_DAY[day] for day in byday if day in _ICAL_DAY_TO_APP_DAY]

    # No recurrence rule: fall back to the single occurrence's own weekday.
    dtstart = event.get("dtstart")
    if dtstart is not None and hasattr(dtstart.dt, "weekday"):
        return [_WEEKDAYS[dtstart.dt.weekday()]]
    return []


def _format_time_range(start, end) -> str:
    return f"{_format_time(start)} - {_format_time(end)}"


def _format_time(value) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


def _flag_repeated_sections(
    classes: list[ParsedClassPreview], course_codes: list[str]
) -> None:
    """Group parsed classes by their GT Scheduler course code.

    A code appearing more than once means GT Scheduler blocked out separate
    lecture/lab/recitation/exam sections under one course. Flag each for the
    user to label — the frontend requires a section type before import and
    uses it (not the meeting days) to make each one's name unique.
    """
    by_code: dict[str, list[ParsedClassPreview]] = defaultdict(list)
    for preview, code in zip(classes, course_codes):
        by_code[code.lower()].append(preview)

    for group in by_code.values():
        if len(group) < 2:
            continue
        for preview in group:
            preview.needs_section_type = True
