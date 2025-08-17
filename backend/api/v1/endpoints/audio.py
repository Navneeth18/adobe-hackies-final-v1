from fastapi import APIRouter, HTTPException, Request
from typing import Dict, List, Optional
from services.tts_service import tts_service
from services.enhanced_podcast_service import enhanced_podcast_service
from pydantic import BaseModel
import os
import logging

router = APIRouter(prefix="/audio")
logger = logging.getLogger(__name__)

class MultilingualPodcastRequest(BaseModel):
    document_id: str
    language: str = "en"
    summarize: bool = True
    size: str = "medium"  # small, medium, large

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
        contextual_insights = request.get("contextual_insights", [])
        cross_document_connections = request.get("cross_document_connections", [])
        
        # Generate podcast with enhanced insights
        audio_filename = await tts_service.generate_podcast_audio(
            selected_text=selected_text,
            snippets=snippets,
            contradictions=contradictions,
            alternate_viewpoints=alternate_viewpoints,
            contextual_insights=contextual_insights,
            cross_document_connections=cross_document_connections
        )
        
        if not audio_filename:
            logger.error("Podcast generation failed: No audio file generated")
            raise HTTPException(status_code=500, detail="Failed to generate podcast audio")
        
        logger.info(f"Generated audio file: {audio_filename}")
        
        # Extract audio_id from filename (remove .mp3 extension)
        audio_id = audio_filename.replace('.mp3', '')
        
        # Return audio file information
        return {
            "success": True,
            "audio_id": audio_id,
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
        audio_path = f"{audio_id}.mp3"
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

@router.get("/serve/{audio_id}")
async def serve_audio_file(audio_id: str):
    """Serve the actual audio file"""
    from fastapi.responses import FileResponse
    try:
        audio_path = f"{audio_id}.mp3"
        
        if os.path.exists(audio_path):
            return FileResponse(
                audio_path, 
                media_type="audio/mpeg",
                filename=f"podcast_{audio_id}.mp3"
            )
        else:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error serving audio file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-multilingual-podcast")
async def generate_multilingual_podcast(request: MultilingualPodcastRequest):
    """Generate a multilingual podcast from PDF document"""
    try:
        # Get the PDF file path from document ID
        pdf_path = f"pdf_storage/{request.document_id}.pdf"

        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF document not found")

        # Generate multilingual podcast
        result = await enhanced_podcast_service.generate_multilingual_podcast_from_pdf(
            pdf_path=pdf_path,
            language=request.language,
            summarize=request.summarize,
            size=request.size
        )

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate podcast"))

        return {
            "success": True,
            "audio_id": result["audio_id"],
            "language": result["language"],
            "language_name": result["language_name"],
            "file_size": result["file_size"],
            "summarized": result["summarized"],
            "message": f"Multilingual podcast generated successfully in {result['language_name']}"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error generating multilingual podcast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for multilingual podcasts"""
    try:
        languages = enhanced_podcast_service.get_supported_languages()
        return {
            "success": True,
            "languages": languages,
            "total_languages": len(languages)
        }
    except Exception as e:
        logger.error(f"Error getting supported languages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/serve-multilingual/{audio_id}")
@router.head("/serve-multilingual/{audio_id}")
async def serve_multilingual_audio_file(audio_id: str):
    """Serve multilingual podcast audio file"""
    from fastapi.responses import FileResponse
    try:
        # Try different possible filenames and locations
        possible_files = [
            f"podcasts/podcast_{audio_id}.mp3",
            f"multilingual_podcast_{audio_id}.mp3",
            f"podcast_{audio_id}.mp3",
            f"{audio_id}.mp3"
        ]

        audio_path = None
        for file_path in possible_files:
            if os.path.exists(file_path):
                audio_path = file_path
                break

        if audio_path:
            return FileResponse(
                audio_path,
                media_type="audio/mpeg",
                filename=f"multilingual_podcast_{audio_id}.mp3"
            )
        else:
            raise HTTPException(status_code=404, detail="Multilingual audio file not found")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error serving multilingual audio file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))