import time
from typing import Dict, Any
from quality_check_model.core.config import SESSION_EXPIRY_SECONDS

# session_id → data
SESSION_STORE: Dict[str, Dict[str, Any]] = {}


def create_session(session_id: str, data: Dict):

    SESSION_STORE[session_id] = {
        "data": data,
        "created_at": time.time()
    }


def get_session(session_id: str):

    cleanup_sessions()

    if session_id not in SESSION_STORE:
        return None

    return SESSION_STORE[session_id]["data"]


def cleanup_sessions():

    current_time = time.time()

    expired_sessions = []

    for sid, session in SESSION_STORE.items():

        if current_time - session["created_at"] > SESSION_EXPIRY_SECONDS:
            expired_sessions.append(sid)

    for sid in expired_sessions:
        del SESSION_STORE[sid]