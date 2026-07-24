from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Assignment
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate
from app.services import class_service, recurrence_service


def list_assignments(db: Session, class_id: int | None = None) -> list[Assignment]:
    recurrence_service.generate_due_recurrences(db)
    stmt = select(Assignment).order_by(Assignment.due_date, Assignment.name)
    if class_id is not None:
        stmt = stmt.where(Assignment.class_id == class_id)
    return list(db.scalars(stmt))


def get_assignment(db: Session, assignment_id: int) -> Assignment:
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError(f"Assignment {assignment_id} not found")
    return assignment


def find_duplicate(
    db: Session, class_id: int, name: str, exclude_id: int | None = None
) -> Assignment | None:
    stmt = select(Assignment).where(
        Assignment.class_id == class_id,
        func.lower(Assignment.name) == name.lower(),
    )
    if exclude_id is not None:
        stmt = stmt.where(Assignment.id != exclude_id)
    return db.scalar(stmt)


def create_assignment(db: Session, payload: AssignmentCreate) -> Assignment:
    class_service.get_class(db, payload.class_id)
    if find_duplicate(db, payload.class_id, payload.name) is not None:
        raise ConflictError(
            f"An assignment named '{payload.name}' already exists in that class"
        )
    assignment = Assignment(**payload.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def update_assignment(
    db: Session, assignment_id: int, payload: AssignmentUpdate
) -> Assignment:
    assignment = get_assignment(db, assignment_id)
    values = payload.model_dump(exclude_unset=True)

    class_id = values.get("class_id", assignment.class_id)
    name = values.get("name", assignment.name)
    if "class_id" in values:
        class_service.get_class(db, class_id)
    if find_duplicate(db, class_id, name, exclude_id=assignment_id) is not None:
        raise ConflictError(
            f"An assignment named '{name}' already exists in that class"
        )

    for field, value in values.items():
        setattr(assignment, field, value)
    db.commit()
    db.refresh(assignment)
    return assignment


def delete_assignment(db: Session, assignment_id: int) -> None:
    db.delete(get_assignment(db, assignment_id))
    db.commit()
