import requests
from app.core.config import settings
import base64
from pathlib import Path
import os

def text_to_speech(text: str) -> str:
    """
    Convert text to speech using ElevenLabs API and return the audio as a base64 string
    """
    try:
        # ElevenLabs API endpoint
        voice_id = "JddqVF50ZSIR7SRbJE6u"  # Rachel voice ID (you can change this to another voice)
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        # Headers with API key
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": settings.ELEVENLABS_API_KEY
        }
        
        # Request body
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        # Make the request
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Convert audio content to base64
            audio_content = response.content
            base64_audio = base64.b64encode(audio_content).decode('utf-8')
            return base64_audio
        else:
            print(f"Error from ElevenLabs API: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        return None
