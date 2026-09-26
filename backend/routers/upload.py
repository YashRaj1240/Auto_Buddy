from fastapi import APIRouter, UploadFile, File, HTTPException
from services.storage_service import upload_file_to_gcs

router = APIRouter()

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]
MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image to Google Cloud Storage."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {ALLOWED_IMAGE_TYPES}")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")

    result = await upload_file_to_gcs(contents, file.filename, file.content_type)
    return {"status": "uploaded", **result}


@router.post("/video")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video to Google Cloud Storage."""
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {ALLOWED_VIDEO_TYPES}")

    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail="Video too large. Max 100MB.")

    result = await upload_file_to_gcs(contents, file.filename, file.content_type)
    return {"status": "uploaded", **result}
