from dotenv import load_dotenv
load_dotenv()  # Load .env file FIRST before anything else

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import diagnose, upload, chat
import uvicorn

app = FastAPI(
    title="MechAI - Automotive Fault Diagnosis API",
    description="AI-powered root cause analysis for vehicle faults by TorqueIQ",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose.router, prefix="/api/diagnose", tags=["Diagnosis"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

import os
from fastapi.staticfiles import StaticFiles

@app.get("/health")
async def health():
    return {"status": "healthy"}

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"message": "MechAI API is running", "team": "TorqueIQ", "version": "1.0.0"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
