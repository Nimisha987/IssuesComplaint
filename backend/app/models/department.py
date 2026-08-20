from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name= Column(String,nullable=False)
    handles_category = Column(String,nullable=False)
    contact_email = Column(String,nullable=True)
    ward = Column(String, nullable=True)

    complaints = relationship("Complaint",back_populates = "department")