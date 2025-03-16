from openai import OpenAI
from app.core.config import settings
import os
import datetime
from pathlib import Path

def save_audio_file(appointment_id: str, audio_data: bytes):
# Create audio directory if it doesn't exist
    AUDIO_DIR = Path("audio_files")

    print(AUDIO_DIR)
    # Generate a unique filename for the audio
    audio_filename = f"{appointment_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.wav"
    audio_path = AUDIO_DIR / audio_filename
    
    # Save the audio file
    with open(audio_path, "wb") as audio_file:
        audio_file.write(audio_data)
    return audio_path


def process_audio(api_key: str, audio_path: str):
    client = OpenAI(api_key=api_key)
    try:
        # Open the file in binary mode for OpenAI
        with open(audio_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            return response.text
    finally:
        # Clean up the temporary file
        if os.path.exists(audio_path):
            os.remove(audio_path)

