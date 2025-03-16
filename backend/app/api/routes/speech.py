from fastapi import APIRouter, HTTPException
from app.api.services.text_to_speech import text_to_speech as tts_service
from pydantic import BaseModel

router = APIRouter(prefix="/speech", tags=["speech"])

class TextToSpeechRequest(BaseModel):
    text: str

@router.post("/")
async def text_to_speech(body: TextToSpeechRequest):
    """
    Convert text to speech using ElevenLabs API
    """
    if not body.text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    audio_base64 = tts_service(body.text)
    if not audio_base64:
        raise HTTPException(status_code=500, detail="Failed to generate speech")
        
    return {
        "text": body.text,
        "audio": audio_base64
    }