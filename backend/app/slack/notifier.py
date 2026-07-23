import logging
from datetime import datetime, timedelta

import httpx

from app.models.assignment import Assignment
from app.utils.time import utcnow

logger = logging.getLogger(__name__)

_TIMEOUT = 15.0


def _format_due(due_at: datetime | None) -> str:
    if due_at is None:
        return "No due date"

    now = utcnow()
    today = datetime(now.year, now.month, now.day)
    due_day = datetime(due_at.year, due_at.month, due_at.day)
    delta_days = (due_day - today).days

    if delta_days == 0:
        return "Due Today"
    if delta_days == 1:
        return "Due Tomorrow"
    if 2 <= delta_days <= 6:
        return f"Due {due_at.strftime('%A')}"
    return f"Due {due_at.strftime('%b %-d')}"


def build_summary_message(new_assignments: list[Assignment]) -> str:
    count = len(new_assignments)
    plural = "assignment" if count == 1 else "assignments"

    lines = ["📚 Canvas Update", "", f"{count} new {plural} found", ""]
    for assignment in new_assignments:
        lines.append(f"• {assignment.course_name}")
        lines.append(f"  {assignment.name}")
        lines.append(f"  {_format_due(assignment.due_at)}")
        lines.append("")

    return "\n".join(lines).rstrip()


class SlackNotifier:
    """Posts summary messages to a Slack Incoming Webhook."""

    def __init__(self, webhook_url: str) -> None:
        self.webhook_url = webhook_url

    def notify_new_assignments(self, new_assignments: list[Assignment]) -> None:
        if not new_assignments:
            return
        if not self.webhook_url:
            logger.info("Slack webhook not configured; skipping notification.")
            return

        message = build_summary_message(new_assignments)
        try:
            response = httpx.post(
                self.webhook_url,
                json={"text": message},
                timeout=_TIMEOUT,
            )
            response.raise_for_status()
        except httpx.HTTPError:
            logger.exception("Failed to post Slack notification.")
