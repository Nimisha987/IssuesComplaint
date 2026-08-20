from sqlalchemy.orm import Session
from app.models.complaint import Complaint, ComplaintStatus
from app.models.department import Department


def assign_department(db: Session, complaint: Complaint) -> None:
    """
    MVP: simple category -> department lookup.
    Later: could factor in ward/location too.
    """
    department = db.query(Department).filter_by(
        handles_category=complaint.category
    ).first()

    if department:
        complaint.department_id = department.id
        complaint.status = ComplaintStatus.ASSIGNED
        db.commit()
    # if no department found, stays in VERIFIED status for manual assignment