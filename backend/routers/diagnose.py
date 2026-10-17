from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from services.gemini_service import analyze_fault
import uuid
from datetime import datetime
from typing import Optional

router = APIRouter()

# In-memory store for local dev (Firestore used in production on Cloud Run)
_local_store = {}

async def try_save_diagnosis(session_id, car_info, issue, diagnosis):
    """Save to Firestore if available, fallback to in-memory for local dev."""
    try:
        from services.firestore_service import save_diagnosis
        await save_diagnosis(session_id, car_info, issue, diagnosis)
    except Exception:
        _local_store[session_id] = {
            "session_id": session_id,
            "car_info": car_info,
            "issue_description": issue,
            "diagnosis": diagnosis,
            "created_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }

@router.post("/")
async def diagnose_fault(
    car_brand: str = Form(...),
    car_model: str = Form(...),
    car_year: int = Form(...),
    issue_description: str = Form(...),
    obd_code: Optional[str] = Form(None),
    image: UploadFile = File(None),
    video: UploadFile = File(None)
):
    """Main diagnosis endpoint. Accepts car info + issue + optional OBD-II code + image/video."""
    try:
        session_id = str(uuid.uuid4())

        image_bytes = await image.read() if image else None
        video_bytes = await video.read() if video else None
        image_mime = image.content_type if image else "image/jpeg"
        video_mime = video.content_type if video else "video/mp4"

        diagnosis = await analyze_fault(
            car_brand=car_brand,
            car_model=car_model,
            car_year=car_year,
            issue_description=issue_description,
            obd_code=obd_code,
            image_data=image_bytes,
            video_data=video_bytes,
            image_mime=image_mime,
            video_mime=video_mime
        )

        car_info = {"brand": car_brand, "model": car_model, "year": car_year}
        await try_save_diagnosis(session_id, car_info, issue_description, diagnosis)

        return JSONResponse(content={
            "session_id": session_id,
            "car_info": car_info,
            "issue": issue_description,
            "diagnosis": diagnosis,
            "status": "success"
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_recent_history():
    """Get recent diagnosis history."""
    try:
        from services.firestore_service import get_recent_diagnoses
        diagnoses = await get_recent_diagnoses(limit=20)
    except Exception:
        diagnoses = list(_local_store.values())[-20:]
    return {"diagnoses": diagnoses}


@router.get("/{session_id}")
async def get_diagnosis_by_id(session_id: str):
    """Retrieve a specific diagnosis by session ID."""
    try:
        from services.firestore_service import get_diagnosis
        diagnosis = await get_diagnosis(session_id)
    except Exception:
        diagnosis = _local_store.get(session_id)
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Diagnosis session not found")
    return diagnosis
