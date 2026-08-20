from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import uuid as uuid_lib
import csv
import io

from app.db.session import get_db
from app.models.complaint import Complaint, ComplaintStatus
from app.models.status_history import StatusHistory
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintStatusUpdate,
    ComplaintCreate,
)

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("/", response_model=ComplaintResponse)
def create_complaint_manual(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """Manual complaint creation — used by the web submit form"""
    from app.services import extraction_service, dedup_service, routing_service, vision_service

    extracted = extraction_service.extract_complaint(payload.raw_transcript or "")

    duplicate = dedup_service.find_duplicate(
        db, category=extracted.category, lat=payload.latitude, lng=payload.longitude
    )

    photo_verified, photo_confidence = False, None
    if payload.photo_url:
        photo_verified, photo_confidence = vision_service.verify_photo(
            payload.photo_url, extracted.category
        )

    complaint = Complaint(
        raw_transcript=payload.raw_transcript,
        whatsapp_number=payload.whatsapp_number,
        photo_url=payload.photo_url,
        photo_verified=photo_verified,
        photo_confidence=photo_confidence,
        category=extracted.category,
        description=extracted.description,
        severity=extracted.severity,
        latitude=payload.latitude,
        longitude=payload.longitude,
        landmark_text=payload.landmark_text,
        status=ComplaintStatus.DUPLICATE if duplicate else ComplaintStatus.VERIFIED,
        duplicate_of_id=duplicate.id if duplicate else None,
    )
    complaint.complaint_code = f"CC-{uuid_lib.uuid4().hex[:5].upper()}"
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    if not duplicate:
        routing_service.assign_department(db, complaint)

    return complaint


@router.get("/", response_model=list[ComplaintResponse])
def list_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    ward: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Dashboard list view — filterable + searchable"""
    query = db.query(Complaint)
    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if severity:
        query = query.filter(Complaint.severity == severity)
    if ward:
        query = query.filter(Complaint.ward == ward)
    if search:
        query = query.filter(
            (Complaint.description.ilike(f"%{search}%")) |
            (Complaint.landmark_text.ilike(f"%{search}%")) |
            (Complaint.complaint_code.ilike(f"%{search}%"))
        )
    return query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    """Download all complaints as CSV"""
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Code", "Category", "Description", "Severity", "Status", "Landmark", "Filed On", "Resolved On"])
    for c in complaints:
        writer.writerow([
            c.complaint_code,
            c.category.value if hasattr(c.category, "value") else c.category,
            c.description,
            c.severity.value if hasattr(c.severity, "value") else c.severity,
            c.status.value if hasattr(c.status, "value") else c.status,
            c.landmark_text or "",
            c.created_at,
            c.resolved_at or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=complaints.csv"},
    )


@router.get("/map/pins")
def get_map_pins(db: Session = Depends(get_db)):
    """Lightweight endpoint for dashboard map view"""
    complaints = db.query(Complaint).filter(
        Complaint.latitude.isnot(None), Complaint.status != ComplaintStatus.DUPLICATE
    ).all()
    return [
        {
            "id": c.id, "lat": c.latitude, "lng": c.longitude,
            "category": c.category, "severity": c.severity, "status": c.status,
        }
        for c in complaints
    ]


@router.get("/by-code/{complaint_code}", response_model=ComplaintResponse)
def get_complaint_by_code(complaint_code: str, db: Session = Depends(get_db)):
    """Used for public status-lookup page"""
    complaint = db.query(Complaint).filter_by(complaint_code=complaint_code.upper()).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")
    return complaint

from app.schemas.complaint import ParsePreviewRequest, ParsePreviewResponse

@router.post("/parse-preview", response_model=ParsePreviewResponse)
def parse_preview(payload: ParsePreviewRequest):
    """Called after voice input finishes — extracts landmark/category to auto-fill the form."""
    from app.services import extraction_service
    result = extraction_service.extract_landmark_preview(payload.transcript)
    return ParsePreviewResponse(**result)

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: UUID, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter_by(id=complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")
    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_status(
    complaint_id: UUID,
    update: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
):
    """Dashboard action — official updates status"""
    complaint = db.query(Complaint).filter_by(id=complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")

    old_status = complaint.status
    complaint.status = update.new_status
    if update.new_status == ComplaintStatus.RESOLVED:
        from sqlalchemy.sql import func
        complaint.resolved_at = func.now()

    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=update.new_status,
        note=update.note,
        changed_by=update.changed_by,
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    return complaint