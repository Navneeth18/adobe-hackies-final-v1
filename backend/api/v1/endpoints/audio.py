from fastapi import APIRouter, HTTPException, Request
from typing import Dict, List, Optional
from services.tts_service import tts_service
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate-podcast")
async def generate_podcast(request: Dict):
    """Generate a podcast from selected text and insights"""
    try:
        selected_text = request.get("selected_text", "")
        if not selected_text:
            raise HTTPException(status_code=400, detail="Selected text is required")
        
        # Get optional data
        snippets = request.get("snippets", [])
        contradictions = request.get("contradictions", [])
        alternate_viewpoints = request.get("alternate_viewpoints", [])
        
        # Generate podcast
        result = await tts_service.generate_podcast_audio(
            selected_text=selected_text,
            snippets=snippets,
            contradictions=contradictions,
            alternate_viewpoints=alternate_viewpoints
        )
        
        if not result or not result.get("success", False):
            error_message = result.get("error", "Unknown error") if result else "Failed to generate podcast"
            logger.error(f"Podcast generation failed: {error_message}")
            raise HTTPException(status_code=500, detail=error_message)
        
        # Return audio file information
        return {
            "success": True,
            "audio_id": result.get("audio_id"),
            "message": "Podcast generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating podcast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/podcast/{audio_id}")
async def get_podcast(audio_id: str):
    """Get a generated podcast by ID"""
    try:
        # Check if the audio file exists
        audio_path = f"./audio_storage/{audio_id}.mp3"
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Return the file path (in a real app, you would stream the file)
        return {
            "success": True,
            "audio_path": audio_path,
            "audio_id": audio_id
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error retrieving podcast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))