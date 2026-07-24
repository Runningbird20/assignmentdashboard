from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse

from app.api.deps import DbSession
from app.schemas.class_file import ClassFileRead
from app.services import file_service, file_storage

router = APIRouter(prefix="/files", tags=["files"])


@router.get("", response_model=list[ClassFileRead])
def list_files(class_id: int, db: DbSession) -> list[ClassFileRead]:
    return [
        ClassFileRead.model_validate(f) for f in file_service.list_files(db, class_id)
    ]


@router.post("", response_model=ClassFileRead, status_code=201)
def upload_file(
    db: DbSession,
    class_id: int = Form(...),
    file: UploadFile = File(...),
) -> ClassFileRead:
    return ClassFileRead.model_validate(file_service.create_file(db, class_id, file))


@router.get("/{file_id}/download")
def download_file(file_id: int, db: DbSession) -> FileResponse:
    class_file = file_service.get_file(db, file_id)
    return FileResponse(
        path=file_storage.path(class_file.storage_key),
        filename=class_file.filename,
        media_type=class_file.content_type or "application/octet-stream",
    )


@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: int, db: DbSession) -> None:
    file_service.delete_file(db, file_id)
