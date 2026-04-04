import uuid

from fastapi import APIRouter, UploadFile, File

from quality_check_model.pipeline import run_pipeline
from quality_check_model.floorplan_ai_assistant import (
    ask_floorplan_assistant,
    reset_conversation
)

from quality_check_model.schemas.requests import AskRequest
from quality_check_model.schemas.responses import (
    success_response,
    error_response
)

from quality_check_model.utils.file_handler import (
    validate_svg,
    save_upload
)

from quality_check_model.core.session import (
    create_session,
    get_session
)

from quality_check_model.core.logging import logger

router = APIRouter()


# ======================================
# HEALTH ENDPOINT
# ======================================

@router.get("/health")
def health_check():

    return success_response({
        "status": "ok"
    })


# ======================================
# ANALYZE
# ======================================

@router.post("/analyze/")
async def analyze_floorplan(file: UploadFile = File(...)):

    if not validate_svg(file):
        return error_response("Only SVG files allowed")

    try:

        file_path = save_upload(file)

        logger.info("Running pipeline...")

        result = run_pipeline(
            file_path,
            verbose=False   # logging cleanup
        )

        session_id = str(uuid.uuid4())

        create_session(
            session_id,
            result
        )

        return success_response({

            "session_id": session_id,

            "summary":
                result.get("summary", {}),

            "suggestions":
                result.get("suggestions", []),

            "parsed":
                result.get("parsed", {})

        })

    except Exception as e:

        logger.error(str(e))

        return error_response(str(e))


# ======================================
# ASK
# ======================================

@router.post("/ask/")
async def ask_question(request: AskRequest):

    if not request.question.strip():
        return error_response(
            "Question cannot be empty"
        )

    pipeline_result = get_session(
        request.session_id
    )

    if pipeline_result is None:
        return error_response(
            "Invalid or expired session_id"
        )

    try:

        answer = ask_floorplan_assistant(
            pipeline_result,
            request.question
        )

        return success_response({
            "answer": answer
        })

    except Exception as e:

        logger.error(str(e))

        return error_response(str(e))


# ======================================
# RESET
# ======================================

@router.post("/reset/")
def reset_chat():

    reset_conversation()

    return success_response({
        "message": "Conversation reset"
    })