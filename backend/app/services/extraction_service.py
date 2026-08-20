import json
import time
from openai import OpenAI
from app.schemas.complaint import ComplaintExtracted
from app.core.constants import VALID_CATEGORIES
from app.config import settings

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

EXTRACTION_SYSTEM_PROMPT = """You are a civic complaint classifier. Given a citizen's message (transcribed from voice or typed text, possibly in Hindi, English, or Hinglish), extract structured complaint data.

Valid categories: streetlight, garbage, pothole, water_leakage, drainage
Valid severity levels: minor, medium, severe

Respond ONLY with a JSON object, no other text:
{
  "category": "<one of the valid categories>",
  "description": "<clean 1-2 sentence English summary of the issue>",
  "severity": "<minor|medium|severe>",
  "urgency_reason": "<brief reason for severity, or null>"
}
"""

MAX_RETRIES = 2


def extract_complaint(transcript: str) -> ComplaintExtracted:
    last_error = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model="meta-llama/llama-3.3-70b-instruct",
                max_tokens=300,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": transcript},
                ],
                timeout=15,
            )
            raw_text = response.choices[0].message.content.strip()
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(raw_text)

            if data.get("category") not in VALID_CATEGORIES:
                data["category"] = "pothole"

            return ComplaintExtracted(**data)

        except json.JSONDecodeError as e:
            last_error = e
            break  # bad model output won't fix itself on retry

        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                time.sleep(1.5 * (attempt + 1))  # backoff
                continue

    # Fallback — never let a complaint disappear because AI failed
    return ComplaintExtracted(
        category="pothole",
        description=transcript[:200] if transcript else "No description provided",
        severity="medium",
        urgency_reason=f"Auto-extraction failed ({type(last_error).__name__}), flagged for manual review",
    )

def extract_landmark_preview(transcript: str) -> dict:
    """Lightweight parse — just pulls out a location mention if present, for auto-filling the form."""
    if not transcript.strip():
        return {"landmark_guess": None, "category_guess": None}

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct",
            max_tokens=100,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract a short location/landmark mention from this civic complaint text, "
                        "if any (e.g. 'MG Road', 'near the water tank'). Also guess the category "
                        "(streetlight, garbage, pothole, water_leakage, or drainage). "
                        "Respond ONLY with JSON: {\"landmark_guess\": \"<text or null>\", \"category_guess\": \"<category or null>\"}"
                    ),
                },
                {"role": "user", "content": transcript},
            ],
            timeout=10,
        )
        raw = response.choices[0].message.content.strip().replace("```json", "").replace("```", "")
        data = json.loads(raw)
        return {
            "landmark_guess": data.get("landmark_guess"),
            "category_guess": data.get("category_guess"),
        }
    except Exception:
        return {"landmark_guess": None, "category_guess": None}