"""Fetch spreadsheet rows for the Google Sheets import.

Uses the sheet's public CSV export endpoint, which works for any sheet
shared as "Anyone with the link can view" — no API key required.
"""

import csv
import io
import re

import httpx

from app.core.exceptions import SheetImportError

_SHEET_ID_RE = re.compile(r"/spreadsheets/d/([a-zA-Z0-9_-]+)")
_GID_RE = re.compile(r"[#&?]gid=(\d+)")

_FETCH_TIMEOUT_SECONDS = 30.0


def extract_sheet_id(sheet_url: str) -> str | None:
    match = _SHEET_ID_RE.search(sheet_url)
    return match.group(1) if match else None


def fetch_sheet_rows(sheet_url: str) -> list[list[str]]:
    sheet_id = extract_sheet_id(sheet_url)
    if sheet_id is None:
        raise SheetImportError(
            "That does not look like a Google Sheets URL. Expected a link like "
            "https://docs.google.com/spreadsheets/d/<id>/..."
        )

    gid_match = _GID_RE.search(sheet_url)
    gid = gid_match.group(1) if gid_match else "0"
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    try:
        response = httpx.get(url, follow_redirects=True, timeout=_FETCH_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise SheetImportError(f"Could not download the sheet: {exc}") from exc
    if response.status_code != 200 or "text/csv" not in response.headers.get(
        "content-type", ""
    ):
        raise SheetImportError(
            "Could not download the sheet. Make sure link sharing is set to "
            "\"Anyone with the link can view\"."
        )
    return list(csv.reader(io.StringIO(response.text)))
