from openai import OpenAI
from app.core.config import settings
import base64
import io
import tempfile
import os


def process_audio(api_key: str, audio_path: str):
    client = OpenAI(api_key=api_key)
    try:
        # Open the file in binary mode for OpenAI
        with open(audio_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        print(response.text)
        return response.text
    finally:
        # Clean up the temporary file
        if os.path.exists(audio_path):
            os.remove(audio_path)

