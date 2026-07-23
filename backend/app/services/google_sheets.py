"""Fetch spreadsheet rows for the Google Sheets import.

Two access paths:
- With GOOGLE_SHEETS_API_KEY set, the official Sheets API v4 is used.
- Without a key, the sheet's public CSV export endpoint is used, which works
  for any sheet shared as "Anyone with the link can view".
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


def fetch_sheet_rows(sheet_url: str, api_key: str | None) -> list[list[str]]:
    sheet_id = extract_sheet_id(sheet_url)
    if sheet_id is None:
        raise SheetImportError(
            "That does not look like a Google Sheets URL. Expected a link like "
            "https://docs.google.com/spreadsheets/d/<id>/..."
        )
    if api_key:
        return _fetch_via_api(sheet_id, api_key)
    return _fetch_via_csv_export(sheet_url, sheet_id)


def _fetch_via_api(sheet_id: str, api_key: str) -> list[list[str]]:
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/A1:Z10000"
    try:
        response = httpx.get(url, params={"key": api_key}, timeout=_FETCH_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise SheetImportError(f"Could not reach the Google Sheets API: {exc}") from exc
    if response.status_code != 200:
        raise SheetImportError(
            f"Google Sheets API returned {response.status_code}. "
            "Check the API key and the sheet's sharing settings."
        )
    values = response.json().get("values", [])
    return [[str(cell) for cell in row] for row in values]


def _fetch_via_csv_export(sheet_url: str, sheet_id: str) -> list[list[str]]:
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
            "\"Anyone with the link can view\", or configure a Google Sheets API key."
        )
    return list(csv.reader(io.StringIO(response.text)))
