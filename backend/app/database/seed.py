"""Seed the database with demo data so the dashboard looks complete immediately.

Usage:
    python -m app.database.seed          # only seeds an empty database
    python -m app.database.seed --force  # drops all tables and reseeds
"""

import argparse
from datetime import date, datetime, time, timedelta

from sqlalchemy import select

import app.models  # noqa: F401  (registers all models on Base.metadata)
from app.database.migrations import run_migrations
from app.database.session import Base, SessionLocal, engine
from app.models import Assignment, Event, SchoolClass, Todo
from app.models.enums import AssignmentStatus, EventType, Priority


def seed(force: bool = False) -> None:
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    db = SessionLocal()
    try:
        if db.scalar(select(SchoolClass).limit(1)) is not None:
            if not force:
                print("Database already contains data. Use --force to reseed.")
                return
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        today = date.today()

        cs = SchoolClass(
            name="CS 250: Data Structures",
            professor="Dr. Elena Vasquez",
            location="Halligan Hall 102",
            meeting_days="Mon,Wed,Fri",
            meeting_time="10:00 – 10:50 AM",
            office_hours="Tue 2:00 – 4:00 PM",
            color="#3b82f6",
        )
        math = SchoolClass(
            name="MATH 220: Linear Algebra",
            professor="Prof. Daniel Okafor",
            location="Bromfield-Pearson 210",
            meeting_days="Tue,Thu",
            meeting_time="1:30 – 2:45 PM",
            office_hours="Wed 1:00 – 3:00 PM",
            color="#8b5cf6",
        )
        hist = SchoolClass(
            name="HIST 150: Modern American History",
            professor="Dr. Sarah Chen",
            location="East Hall 015",
            meeting_days="Mon,Wed",
            meeting_time="3:00 – 4:15 PM",
            office_hours="Fri 10:00 AM – 12:00 PM",
            color="#f59e0b",
        )
        db.add_all([cs, math, hist])
        db.flush()

        assignments = [
            Assignment(
                class_id=cs.id, name="Problem Set 4", due_date=today,
                status=AssignmentStatus.IN_PROGRESS, priority=Priority.HIGH,
                notes="Focus on the AVL rotation proofs.",
            ),
            Assignment(
                class_id=cs.id, name="Binary Tree Lab", due_date=today + timedelta(days=3),
                status=AssignmentStatus.TODO, priority=Priority.MEDIUM,
            ),
            Assignment(
                class_id=cs.id, name="Reading: Chapter 7", due_date=today - timedelta(days=2),
                status=AssignmentStatus.COMPLETE, priority=Priority.LOW,
            ),
            Assignment(
                class_id=math.id, name="Homework 6", due_date=today + timedelta(days=1),
                status=AssignmentStatus.TODO, priority=Priority.HIGH,
                notes="Eigenvalues and eigenvectors.",
            ),
            Assignment(
                class_id=math.id, name="Proof Portfolio Draft",
                due_date=today + timedelta(days=6),
                status=AssignmentStatus.TODO, priority=Priority.MEDIUM,
            ),
            Assignment(
                class_id=math.id, name="Homework 5", due_date=today - timedelta(days=3),
                status=AssignmentStatus.COMPLETE, priority=Priority.MEDIUM,
            ),
            Assignment(
                class_id=hist.id, name="Primary Source Essay",
                due_date=today + timedelta(days=5),
                status=AssignmentStatus.IN_PROGRESS, priority=Priority.HIGH,
                notes="1500 words on the New Deal press coverage.",
            ),
            Assignment(
                class_id=hist.id, name="Discussion Post: Week 9",
                due_date=today - timedelta(days=1),
                status=AssignmentStatus.WAITING, priority=Priority.LOW,
                notes="Waiting on partner's reply to finish the thread.",
            ),
        ]
        db.add_all(assignments)

        todos = [
            Todo(title="Pick up package from mail center", priority=Priority.MEDIUM,
                 due_date=today, sort_order=1),
            Todo(title="Do laundry", priority=Priority.LOW, due_date=today, sort_order=2),
            Todo(title="Call home", priority=Priority.LOW,
                 due_date=today + timedelta(days=1), sort_order=3),
            Todo(title="Renew library books", priority=Priority.MEDIUM,
                 due_date=today + timedelta(days=4), sort_order=4,
                 description="Both stats books are due this week."),
            Todo(title="Submit club budget", priority=Priority.HIGH, completed=True,
                 due_date=today - timedelta(days=1), sort_order=5),
        ]
        db.add_all(todos)

        events = [
            Event(
                title="CS 250 Midterm Review",
                location="Halligan Hall 102",
                start_time=datetime.combine(today + timedelta(days=2), time(18, 0)),
                end_time=datetime.combine(today + timedelta(days=2), time(20, 0)),
                type=EventType.EXAM,
            ),
            Event(
                title="Intramural Soccer vs. Baker Hall",
                location="Ellis Oval",
                start_time=datetime.combine(today + timedelta(days=4), time(19, 0)),
                end_time=datetime.combine(today + timedelta(days=4), time(20, 30)),
                type=EventType.SOCIAL,
            ),
        ]
        db.add_all(events)

        db.commit()
        print(
            f"Seeded {len([cs, math, hist])} classes, {len(assignments)} assignments, "
            f"{len(todos)} todos, {len(events)} events."
        )
    finally:
        db.close()


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description=__doc__)
    arg_parser.add_argument(
        "--force", action="store_true", help="Drop all tables and reseed."
    )
    args = arg_parser.parse_args()
    seed(force=args.force)
