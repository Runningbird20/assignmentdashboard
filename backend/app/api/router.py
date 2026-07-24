from fastapi import APIRouter

from app.routers import (
    assignments,
    classes,
    dashboard,
    events,
    files,
    health,
    imports,
    notes,
    todos,
)

api_router = APIRouter()

for module_router in (
    health.router,
    classes.router,
    assignments.router,
    todos.router,
    events.router,
    dashboard.router,
    imports.router,
    files.router,
    notes.router,
):
    api_router.include_router(module_router)
