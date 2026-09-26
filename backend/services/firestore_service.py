from google.cloud import firestore
import os
import uuid
from datetime import datetime

def get_db():
    return firestore.Client(project=os.environ.get("GCP_PROJECT_ID"))

async def save_diagnosis(session_id: str, car_info: dict, issue: str, diagnosis: dict) -> str:
    """Save a diagnosis session to Firestore."""
    db = get_db()
    doc_ref = db.collection("diagnoses").document(session_id)
    doc_ref.set({
        "session_id": session_id,
        "car_info": car_info,
        "issue_description": issue,
        "diagnosis": diagnosis,
        "created_at": datetime.utcnow().isoformat(),
        "status": "completed"
    })
    return session_id

async def get_diagnosis(session_id: str) -> dict:
    """Retrieve a diagnosis session from Firestore."""
    db = get_db()
    doc = db.collection("diagnoses").document(session_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

async def save_chat_message(session_id: str, role: str, message: str):
    """Append a chat message to an existing session."""
    db = get_db()
    chat_ref = db.collection("diagnoses").document(session_id).collection("chat")
    chat_ref.add({
        "role": role,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    })

async def get_chat_history(session_id: str) -> list:
    """Fetch full chat history for a session."""
    db = get_db()
    chat_ref = db.collection("diagnoses").document(session_id).collection("chat")
    docs = chat_ref.order_by("timestamp").stream()
    return [{"role": doc.get("role"), "parts": [doc.get("message")]} for doc in docs]

async def get_recent_diagnoses(limit: int = 10) -> list:
    """Get recent diagnoses for analytics/history page."""
    db = get_db()
    docs = db.collection("diagnoses").order_by(
        "created_at", direction=firestore.Query.DESCENDING
    ).limit(limit).stream()
    return [doc.to_dict() for doc in docs]
