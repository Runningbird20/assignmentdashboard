import logging

import httpx

from app.canvas.schemas import CanvasAssignment, CanvasCourse

logger = logging.getLogger(__name__)

_PER_PAGE = 100
_TIMEOUT = 30.0


class CanvasClient:
    """Thin client over the Canvas REST API with Link-header pagination."""

    def __init__(self, api_url: str, access_token: str) -> None:
        self.base_url = api_url.rstrip("/")
        self._headers = {"Authorization": f"Bearer {access_token}"}

    def _paginate(self, path: str, params: dict[str, str | int]) -> list[dict]:
        url: str | None = f"{self.base_url}/api/v1{path}"
        query: dict[str, str | int] | None = {**params, "per_page": _PER_PAGE}
        results: list[dict] = []

        with httpx.Client(timeout=_TIMEOUT, headers=self._headers) as client:
            while url:
                response = client.get(url, params=query)
                response.raise_for_status()
                results.extend(response.json())
                url = response.links.get("next", {}).get("url")
                query = None  # the "next" URL already carries the query params

        return results

    def get_active_courses(self) -> list[CanvasCourse]:
        raw = self._paginate("/courses", {"enrollment_state": "active"})
        courses: list[CanvasCourse] = []
        for item in raw:
            # Courses restricted by date come back without a usable name.
            if item.get("access_restricted_by_date"):
                continue
            courses.append(CanvasCourse.model_validate(item))
        return courses

    def get_course_assignments(self, course_id: int) -> list[CanvasAssignment]:
        raw = self._paginate(f"/courses/{course_id}/assignments", {})
        return [CanvasAssignment.model_validate(item) for item in raw]
