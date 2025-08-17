# backend/api/v1/endpoints/podcast.py
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from services.tts_service import tts_service
import os

router = APIRouter()

class PodcastRequest(BaseModel):
    intro: str
    discussion: str

@router.post("/podcast/generate")
async def generate_podcast(request: PodcastRequest, http_request: Request):
    if not request.intro or not request.discussion:
        raise HTTPException(status_code=400, detail="Intro and discussion text are required.")

    audio_filename = await tts_service.generate_podcast_audio(request.intro, request.discussion)
    if not audio_filename:
        raise HTTPException(status_code=503, detail="Could not generate audio file.")

    return {"audio_url": f"{http_request.base_url}api/v1/podcast/audio/{audio_filename}"}

@router.get("/podcast/audio/{filename}")
async def get_audio_file(filename: str):
    if os.path.exists(filename):
        return FileResponse(filename, media_type="audio/mpeg", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
    raise HTTPException(status_code=404, detail="Audio file not found.")