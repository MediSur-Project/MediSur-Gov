
from openai import OpenAI
client = OpenAI()

def process_audio(audio_data: bytes):
    response = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_data
    )
    print(response.text)
    return response.text

