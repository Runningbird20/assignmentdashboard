from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import FileUploadError, NotFoundError
from app.models import ClassFile
from app.services import class_service, file_storage

_MAX_FILE_BYTES = 25 * 1024 * 1024


def list_files(db: Session, class_id: int) -> list[ClassFile]:
    class_service.get_class(db, class_id)
    stmt = (
        select(ClassFile)
        .where(ClassFile.class_id == class_id)
        .order_by(ClassFile.created_at.desc())
    )
    return list(db.scalars(stmt))


def get_file(db: Session, file_id: int) -> ClassFile:
    class_file = db.get(ClassFile, file_id)
    if class_file is None:
        raise NotFoundError(f"File {file_id} not found")
    return class_file


def create_file(db: Session, class_id: int, upload: UploadFile) -> ClassFile:
    class_service.get_class(db, class_id)
    if not upload.filename:
        raise FileUploadError("The upload has no filename.")

    content = upload.file.read(_MAX_FILE_BYTES + 1)
    if len(content) > _MAX_FILE_BYTES:
        raise FileUploadError(
            f"'{upload.filename}' is too large (max {_MAX_FILE_BYTES // (1024 * 1024)} MB)."
        )

    storage_key = file_storage.new_storage_key(upload.filename)
    file_storage.save(storage_key, content)

    class_file = ClassFile(
        class_id=class_id,
        filename=upload.filename,
        storage_key=storage_key,
        content_type=upload.content_type,
        size_bytes=len(content),
    )
    db.add(class_file)
    db.commit()
    db.refresh(class_file)
    return class_file


def delete_file(db: Session, file_id: int) -> None:
    class_file = get_file(db, file_id)
    file_storage.delete(class_file.storage_key)
    db.delete(class_file)
    db.commit()
