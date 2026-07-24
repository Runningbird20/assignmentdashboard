"""Local-disk blob storage for uploaded class files.

This is the one module that knows *where* file bytes actually live. Every
other layer (models, services, routers) only ever deals in opaque
`storage_key` strings, so swapping this out for S3-compatible storage later
means rewriting this module alone — no schema or API changes required.
"""

import uuid
from pathlib import Path

from app.core.config import get_settings


def _upload_dir() -> Path:
    directory = Path(get_settings().upload_dir)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _path_for(storage_key: str) -> Path:
    return _upload_dir() / storage_key


def new_storage_key(original_filename: str) -> str:
    # Never derived from user input: avoids path traversal and collisions.
    suffix = Path(original_filename).suffix[:16]
    return f"{uuid.uuid4().hex}{suffix}"


def save(storage_key: str, content: bytes) -> None:
    _path_for(storage_key).write_bytes(content)


def read(storage_key: str) -> bytes:
    return _path_for(storage_key).read_bytes()


def path(storage_key: str) -> Path:
    return _path_for(storage_key)


def delete(storage_key: str) -> None:
    _path_for(storage_key).unlink(missing_ok=True)
