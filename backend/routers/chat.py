from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.gemini_service import chat_followup

router = APIRouter()

# In-memory store for chat history during local dev
_local_chat_store = {}

class ChatMessage(BaseModel):
    session_id: str
    message: str
    language: Optional[str] = "en"

async def try_get_diagnosis(session_id):
    try:
        from services.firestore_service import get_diagnosis
        return await get_diagnosis(session_id)
    except Exception:
        # Fallback to the memory store in diagnose router
        from routers.diagnose import _local_store
        return _local_store.get(session_id)

async def try_get_chat_history(session_id):
    try:
        from services.firestore_service import get_chat_history
        return await get_chat_history(session_id)
    except Exception:
        return _local_chat_store.get(session_id, [])

async def try_save_chat_message(session_id, role, text):
    try:
        from services.firestore_service import save_chat_message
        await save_chat_message(session_id, role, text)
    except Exception:
        if session_id not in _local_chat_store:
            _local_chat_store[session_id] = []
        _local_chat_store[session_id].append({"role": role, "parts": [text]})

@router.post("/")
async def send_chat_message(payload: ChatMessage):
    """Follow-up chat after initial diagnosis."""
    try:
        diagnosis_data = await try_get_diagnosis(payload.session_id)
        if not diagnosis_data:
            raise HTTPException(status_code=404, detail="Session not found")

        history = await try_get_chat_history(payload.session_id)

        if not history:
            context_intro = f"You previously diagnosed this vehicle: Car: {diagnosis_data.get('car_info')} Issue: {diagnosis_data.get('issue_description')} Your diagnosis: {diagnosis_data.get('diagnosis')}. Now answer follow-up questions from the technician in simple, plain English."
            history = [{"role": "user", "parts": [context_intro]},
                      {"role": "model", "parts": ["Understood. I have the full diagnosis context. Please ask your follow-up questions."]}]

        await try_save_chat_message(payload.session_id, "user", payload.message)
        
        # Note: Chat uses same model but needs to clear the strict JSON generation_config for normal chat
        response_text = await chat_followup(history, payload.message, language=payload.language or "en")

        await try_save_chat_message(payload.session_id, "model", response_text)

        return {
            "session_id": payload.session_id,
            "response": response_text,
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/history")
async def get_session_chat(session_id: str):
    history = await try_get_chat_history(session_id)
    return {"session_id": session_id, "history": history}
