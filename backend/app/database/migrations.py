"""Lightweight, additive schema migrations for SQLite.

There's no Alembic in this project — `Base.metadata.create_all()` only
creates missing tables, it doesn't add columns to tables that already
exist. For a personal local app this ad hoc `ALTER TABLE ... ADD COLUMN`
approach is enough: it's idempotent (checks `PRAGMA table_info` first) and
only ever adds nullable columns, so it can't lose existing data.
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _add_column_if_missing(
    engine: Engine, table: str, column: str, ddl_type: str
) -> None:
    inspector = inspect(engine)
    existing_columns = {col["name"] for col in inspector.get_columns(table)}
    if column in existing_columns:
        return
    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


def run_migrations(engine: Engine) -> None:
    _add_column_if_missing(engine, "classes", "section_type", "VARCHAR(20)")
    _add_column_if_missing(engine, "todos", "recurrence_frequency", "VARCHAR(10)")
    _add_column_if_missing(
        engine, "todos", "recurrence_interval", "INTEGER DEFAULT 1 NOT NULL"
    )
    _add_column_if_missing(engine, "assignments", "recurrence_frequency", "VARCHAR(10)")
    _add_column_if_missing(
        engine, "assignments", "recurrence_interval", "INTEGER DEFAULT 1 NOT NULL"
    )
