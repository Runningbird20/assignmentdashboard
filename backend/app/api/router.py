from fastapi import APIRouter

from app.routers import (
    assignments,
    classes,
    dashboard,
    events,
    health,
    imports,
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
):
    api_router.include_router(module_router)
