from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.complaint import ComplaintCategory,Severity,ComplaintStatus

class ComplaintCreate(BaseModel):
    raw_transcript: Optional[str] = None
    original_language: Optional[str] = None
    photo_url: Optional[str] = None
    whatsapp_number: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    landmark_text: Optional[str] = None

class ComplaintExtracted(BaseModel):
    """What Claude API returns after processing raw_transcript"""
    category: ComplaintCategory
    description:str
    severity:Severity
    urgency_reason:Optional[str]=None

class ComplaintResponse(BaseModel):
    id: UUID
    complaint_code: str
    category: ComplaintCategory
    description: str
    severity: Severity
    status: ComplaintStatus
    photo_verified: bool
    is_overdue: bool = False
    latitude: Optional[float]
    longitude: Optional[float]
    landmark_text: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


    class Config:
        from_attributes = True
class ComplaintStatusUpdate(BaseModel):
    new_status : ComplaintStatus
    note: Optional[str]=None
    changed_by: str


class ComplaintFilter(BaseModel):
    category: Optional[ComplaintCategory]=None
    status: Optional[ComplaintStatus]=None
    severity: Optional[Severity]=None
    ward: Optional[str] = None

class ParsePreviewRequest(BaseModel):
    transcript: str


class ParsePreviewResponse(BaseModel):
    landmark_guess: Optional[str] = None
    category_guess: Optional[str] = None