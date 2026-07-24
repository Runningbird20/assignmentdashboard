from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import Todo
from app.schemas.todo import TodoCreate, TodoUpdate
from app.services import recurrence_service


def list_todos(db: Session) -> list[Todo]:
    recurrence_service.generate_due_recurrences(db)
    return list(db.scalars(select(Todo).order_by(Todo.sort_order, Todo.id)))


def get_todo(db: Session, todo_id: int) -> Todo:
    todo = db.get(Todo, todo_id)
    if todo is None:
        raise NotFoundError(f"Todo {todo_id} not found")
    return todo


def create_todo(db: Session, payload: TodoCreate) -> Todo:
    max_order = db.scalar(select(func.max(Todo.sort_order))) or 0
    todo = Todo(**payload.model_dump(), sort_order=max_order + 1)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def update_todo(db: Session, todo_id: int, payload: TodoUpdate) -> Todo:
    todo = get_todo(db, todo_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


def delete_todo(db: Session, todo_id: int) -> None:
    db.delete(get_todo(db, todo_id))
    db.commit()


def reorder_todos(db: Session, ids: list[int]) -> list[Todo]:
    todos = {t.id: t for t in db.scalars(select(Todo).where(Todo.id.in_(ids)))}
    missing = [todo_id for todo_id in ids if todo_id not in todos]
    if missing:
        raise NotFoundError(f"Todos not found: {missing}")
    for position, todo_id in enumerate(ids, start=1):
        todos[todo_id].sort_order = position
    db.commit()
    return list_todos(db)
