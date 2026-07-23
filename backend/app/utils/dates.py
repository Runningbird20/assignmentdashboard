from datetime import date

from dateutil import parser

DAY_ABBREVS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


def day_abbrev(value: date) -> str:
    return DAY_ABBREVS[value.weekday()]


def parse_flexible_date(value: str) -> date:
    """Parse dates in common formats ("2026-09-01", "9/1/26", "Sep 1 2026")."""
    return parser.parse(value.strip()).date()
