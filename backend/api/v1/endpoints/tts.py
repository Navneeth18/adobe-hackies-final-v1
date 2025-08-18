# backend/api/v1/endpoints/tts.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from services.tts_service import tts_service
import uuid
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-JennyNeural"

class TTSResponse(BaseModel):
    audio_id: str
    audio_url: str
    success: bool
    error: Optional[str] = None

@router.post("/tts/generate", response_model=TTSResponse)
async def generate_tts_audio(request: TTSRequest):
    """
    Generate TTS audio for Talk to PDF responses using Azure TTS
    """
    try:
        if not request.text or len(request.text.strip()) < 1:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        if not tts_service.speech_config:
            tts_service.configure()
            if not tts_service.speech_config:
                raise HTTPException(status_code=500, detail="TTS service not configured")

        # Generate audio using Azure TTS
        audio_filename = await generate_simple_tts(request.text, request.voice)
        
        if not audio_filename or not os.path.exists(audio_filename):
            raise HTTPException(status_code=500, detail="Failed to generate audio file")

        # Extract just the filename without path for the audio_id
        audio_id = os.path.basename(audio_filename).replace('.mp3', '')
        audio_url = f"http://localhost:8000/api/v1/tts/serve/{audio_id}"

        return TTSResponse(
            audio_id=audio_id,
            audio_url=audio_url,
            success=True
        )

    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        return TTSResponse(
            audio_id="",
            audio_url="",
            success=False,
            error=str(e)
        )

@router.get("/tts/serve/{audio_id}")
async def serve_tts_audio(audio_id: str):
    """
    Serve generated TTS audio files
    """
    try:
        # Look for the audio file
        audio_filename = f"{audio_id}.mp3"
        
        if not os.path.exists(audio_filename):
            raise HTTPException(status_code=404, detail="Audio file not found")

        return FileResponse(
            audio_filename,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename={audio_filename}"}
        )

    except Exception as e:
        logger.error(f"Error serving TTS audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve audio file")

async def generate_simple_tts(text: str, voice: str = "en-US-JennyNeural"):
    """
    Generate simple TTS audio using Azure Speech Services
    """
    try:
        import azure.cognitiveservices.speech as speechsdk
        
        # Generate a unique filename
        audio_id = str(uuid.uuid4())
        filename = f"{audio_id}.mp3"
        
        # Configure speech synthesis
        tts_service.speech_config.speech_synthesis_voice_name = voice
        
        # Create SSML for better speech quality
        ssml_string = f"""
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
            <voice name="{voice}">
                <prosody rate="medium" pitch="medium">
                    {text}
                </prosody>
            </voice>
        </speak>
        """
        
        # Generate audio
        audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=tts_service.speech_config, 
            audio_config=audio_config
        )
        
        result = synthesizer.speak_ssml_async(ssml_string).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            logger.info(f"TTS audio generated successfully: {filename}")
            return filename
        else:
            cancellation = result.cancellation_details
            error_msg = f"Speech synthesis canceled: {cancellation.reason}"
            if cancellation.error_details:
                error_msg += f", Details: {cancellation.error_details}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
            
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise RuntimeError(f"Failed to generate TTS audio: {str(e)}")
