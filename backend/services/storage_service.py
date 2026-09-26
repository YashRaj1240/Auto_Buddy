from google.cloud import storage
import os
import uuid
from datetime import timedelta

GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", "mechai-uploads")

def get_storage_client():
    return storage.Client(project=os.environ.get("GCP_PROJECT_ID"))

async def upload_file_to_gcs(file_bytes: bytes, filename: str, content_type: str) -> dict:
    """Upload a file to Google Cloud Storage and return public URL."""
    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)

    unique_filename = f"uploads/{uuid.uuid4()}_{filename}"
    blob = bucket.blob(unique_filename)
    blob.upload_from_string(file_bytes, content_type=content_type)

    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(hours=1),
        method="GET"
    )

    return {
        "gcs_path": f"gs://{GCS_BUCKET_NAME}/{unique_filename}",
        "signed_url": signed_url,
        "filename": unique_filename
    }

async def delete_file_from_gcs(filename: str):
    """Delete a file from GCS after processing."""
    client = get_storage_client()
    bucket = client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(filename)
    blob.delete()
