from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.todo import TodoCreate, TodoRead, TodoReorder, TodoUpdate
from app.services import todo_service

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[TodoRead])
def list_todos(db: DbSession) -> list[TodoRead]:
    return [TodoRead.model_validate(t) for t in todo_service.list_todos(db)]


@router.post("", response_model=TodoRead, status_code=201)
def create_todo(payload: TodoCreate, db: DbSession) -> TodoRead:
    return TodoRead.model_validate(todo_service.create_todo(db, payload))


# Declared before /{todo_id} so "reorder" is not parsed as an id.
@router.put("/reorder", response_model=list[TodoRead])
def reorder_todos(payload: TodoReorder, db: DbSession) -> list[TodoRead]:
    return [
        TodoRead.model_validate(t)
        for t in todo_service.reorder_todos(db, payload.ids)
    ]


@router.put("/{todo_id}", response_model=TodoRead)
def update_todo(todo_id: int, payload: TodoUpdate, db: DbSession) -> TodoRead:
    return TodoRead.model_validate(todo_service.update_todo(db, todo_id, payload))


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: DbSession) -> None:
    todo_service.delete_todo(db, todo_id)
