from sqlalchemy import Column , String, Text, Float, DateTime, Enum, ForeignKey, Integer,Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.base import Base

class ComplaintCategory(str,enum.Enum):
    STREETLIGHT = "streetlight"
    GARBAGE = "garbage"
    POTHOLE="pothole"
    WATER_LEAKAGE = "water_leakage"
    DRAINAGE = "drainage"

class Severity(str,enum.Enum):
    MINOR="minor"
    MEDIUM="medium"
    SEVERE="severe"

class ComplaintStatus(str,enum.Enum):
    RECEIVED = "received"
    VERIFIED = "verified"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DUPLICATE ="duplicate"


class Complaint(Base):
    __tablename__ = "complaints"

    id=Column(UUID(as_uuid=True),primary_key = True,default=uuid.uuid4)
    complaint_code = Column(String(12),unique=True,index=True)

    raw_transcript = Column(Text,nullable=True)
    original_language = Column(String(10),nullable=True)
    photo_url = Column(String,nullable=True)
    whatsapp_number = Column(String(20),index=True)

    category = Column(Enum(ComplaintCategory),nullable=False)
    description = Column(Text)
    severity = Column(Enum(Severity),default = Severity.MEDIUM)
    photo_verified = Column(Boolean,default=False)
    photo_confidence = Column(Float, nullable=True)


    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    landmark_text = Column(String, nullable=True)
    ward= Column(String,nullable=True)

    status = Column(Enum(ComplaintStatus),default = ComplaintStatus.RECEIVED)
    department_id = Column(UUID(as_uuid = True),ForeignKey("departments.id"),nullable=True)
    duplicate_of_id = Column(UUID(as_uuid = True),ForeignKey("complaints.id"),nullable=True)

    created_at = Column(DateTime(timezone=True),server_default=func.now())
    updated_at = Column(DateTime(timezone=True),onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True),nullable=True)

    department = relationship("Department",back_populates = "complaints")
    status_history = relationship("StatusHistory",back_populates="complaint")

    @property
    def is_overdue(self) -> bool:
        from datetime import datetime, timezone
        from app.core.constants import SLA_DAYS

        if self.status in (ComplaintStatus.RESOLVED, ComplaintStatus.DUPLICATE):
            return False
        sla_days = SLA_DAYS.get(self.severity.value if hasattr(self.severity, "value") else self.severity, 5)
        age_days = (datetime.now(timezone.utc) - self.created_at.replace(tzinfo=timezone.utc)).days
        return age_days > sla_days