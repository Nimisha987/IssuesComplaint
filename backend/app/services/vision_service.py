import base64
import json
import time
import httpx
from openai import OpenAI
from app.config import settings

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

VISION_PROMPT_TEMPLATE = """Look at this image. Does it show a "{category}" civic issue (e.g. broken streetlight, garbage pile, pothole, water leakage, or blocked drainage)?

Respond ONLY with JSON: {{"matches": true|false, "confidence": <0.0 to 1.0>}}
"""

MAX_RETRIES = 2


def verify_photo(photo_url: str, category: str) -> tuple[bool, float]:
    try:
        image_bytes = httpx.get(photo_url, timeout=10).content
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    except Exception:
        # couldn't even download the photo — don't block the complaint on this
        return False, 0.0

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model="google/gemini-2.0-flash-exp:free",
                max_tokens=100,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": VISION_PROMPT_TEMPLATE.format(category=category)},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                    ],
                }],
                timeout=15,
            )
            raw = response.choices[0].message.content.strip().replace("```json", "").replace("```", "")
            result = json.loads(raw)
            return result["matches"], result["confidence"]

        except (json.JSONDecodeError, KeyError):
            return False, 0.0  # bad model output — fail safe, don't retry

        except Exception:
            if attempt < MAX_RETRIES:
                time.sleep(1.5 * (attempt + 1))
                continue
            return False, 0.0  # exhausted retries — fail safe, complaint still gets saved