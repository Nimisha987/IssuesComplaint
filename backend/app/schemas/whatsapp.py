from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services import stt_service, extraction_service,vision_service\

from app.models.complaint import Complaint, ComplaintStatus

router= APIRouter(prefix = "/whatsapp",tags=["whatsapp"])

@router.get("/webhook")
async def verify_webhook(request:Request):
    """Meta's webhook verification handshake (one-time setup)"""
    params = request.query_params
    if params.get("hub.verify_token") == "YOUR_VERIFY_TOKEN":
        return int(params.get("hub challenge"))
    return {"error":"verification failed"}

@router.post("/webhook")
async def receive_message(request:Requesr,db:Session = Depends(get_db)):
    """
    Main entrypoint - WhatsApp sends voice/photo/text/location here.
    """
    payload = await request.json()
    message= whatsapp_service.parse_incoming(payload)

    if message.type == "text" and message.text.strip().upper().startswith("CC-"):
        return await handle_status_lookup(message,db)


    transcript = message.text
    language="en"
    if message.type == "voice":
        transcript,language = stt_service.transcribe(message.media_url)

    extracted = extraction_service.extract_complaint(transcript)

    photo_verified,confidence = False,None
    if message.photo_url:
        photo_verified,confidence = vision_service.verify_photo(
            message.photo_url,extracted.category
        )

    duplicate = dedup_service.find_duplicate(
        db, category = extracted.category,
        lat = message.latitudem lng=messgae.longitude
    )

    complaint = Complaint(
        raw_transcript = transcript,
        original_language = language,
        photo_url= message.photo_url,
        whatsapp_number=message.sender,
        category=extracted.category,
        description = extracted.description,
        severity = extracted.severity,
        photo_verified = photo_verified,
        photo_confidence = confidence,
        latitude= message.latitude,
        longitude = message.longitude,
        landmark_text=message.landmark_text,
        status = ComplaintStatus.DUPLICATE if duplicate else ComplaintStatus.VERIFIED,
        duplicate_of_id = duplicate.id if duplicate else None,
    )
    complaint.complaint_code = generate_complaint_code()
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    if not duplicate:
        routing_service.assign_department(db,complaint)

    await whatsapp_service.send_acknowledgement(
        to=message.sender,complaint=complaint,
        language=language, is_duplicate=bool(duplicate)
    )
    return {"status": "ok", "complaint_code": complaint.complaint_code}


async def handle_status_lookup(message, db: Session):
    code = message.text.strip().upper()
    complaint = db.query(Complaint).filter_by(complaint_code=code).first()
    if not complaint:
        await whatsapp_service.send_text(message.sender, "Complaint ID not found.")
    else:
        await whatsapp_service.send_status_update(message.sender, complaint)
    return {"status": "ok"}


def generate_complaint_code() -> str:
    import uuid
    return f"CC-{uuid.uuid4().hex[:5].upper()}"