import httpx
import tempfile
import os
import time
from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

MAX_RETRIES = 2


def transcribe(media_url: str) -> tuple[str, str]:
    try:
        audio_bytes = httpx.get(media_url, timeout=10).content
    except Exception:
        return "", "en"  # couldn't fetch audio — return empty, extraction handles it gracefully

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        for attempt in range(MAX_RETRIES + 1):
            try:
                with open(tmp_path, "rb") as f:
                    result = client.audio.transcriptions.create(
                        model="whisper-large-v3",
                        file=f,
                        response_format="verbose_json",
                    )
                return result.text, result.language

            except Exception:
                if attempt < MAX_RETRIES:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                return "", "en"  # exhausted retries — fail safe

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)