import uuid
import os
import shutil

from fastapi import UploadFile

from quality_check_model.core.config import UPLOAD_DIR


def validate_svg(file: UploadFile):

    if not file.filename.endswith(".svg"):
        return False

    return True


def save_upload(file: UploadFile):

    unique_name = f"{uuid.uuid4()}.svg"

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_name
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path