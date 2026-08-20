import httpx
from app.config import settings

WHATSAPP_API_URL = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_ID}/messages"
HEADERS = {"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}"}


class IncomingMessage:
    def __init__(self, type, sender, text=None, media_url=None,
                 photo_url=None, latitude=None, longitude=None, landmark_text=None):
        self.type = type
        self.sender = sender
        self.text = text
        self.media_url = media_url
        self.photo_url = photo_url
        self.latitude = latitude
        self.longitude = longitude
        self.landmark_text = landmark_text


def parse_incoming(payload: dict) -> IncomingMessage:
    """Normalizes Meta's webhook payload into a simple internal format"""
    entry = payload["entry"][0]["changes"][0]["value"]
    message = entry["messages"][0]
    sender = message["from"]
    msg_type = message["type"]

    if msg_type == "text":
        return IncomingMessage(type="text", sender=sender, text=message["text"]["body"])
    elif msg_type == "audio":
        media_url = _resolve_media_url(message["audio"]["id"])
        return IncomingMessage(type="voice", sender=sender, media_url=media_url)
    elif msg_type == "image":
        media_url = _resolve_media_url(message["image"]["id"])
        return IncomingMessage(type="photo", sender=sender, photo_url=media_url,
                                text=message["image"].get("caption"))
    elif msg_type == "location":
        loc = message["location"]
        return IncomingMessage(type="location", sender=sender,
                                latitude=loc["latitude"], longitude=loc["longitude"])

    return IncomingMessage(type="unknown", sender=sender)


def _resolve_media_url(media_id: str) -> str:
    resp = httpx.get(f"https://graph.facebook.com/v19.0/{media_id}", headers=HEADERS)
    return resp.json()["url"]


async def send_text(to: str, body: str):
    payload = {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": body}}
    httpx.post(WHATSAPP_API_URL, headers=HEADERS, json=payload)


async def send_acknowledgment(to: str, complaint, language: str, is_duplicate: bool):
    if is_duplicate:
        msg = f"This issue has already been reported (ID: {complaint.duplicate_of_id}). We'll keep you updated."
    else:
        msg = f"Complaint received. Your tracking ID is {complaint.complaint_code}. We'll notify you as it progresses."
    await send_text(to, msg)


async def send_status_update(to: str, complaint):
    msg = f"Complaint {complaint.complaint_code} status: {complaint.status.value.replace('_', ' ').title()}"
    await send_text(to, msg)