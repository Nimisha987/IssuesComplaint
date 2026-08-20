from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.complaint import Complaint, ComplaintStatus

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total = db.query(Complaint).count()
    resolved = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    open_count = total - resolved

    # average resolution time (in hours) for resolved complaints
    resolved_complaints = db.query(Complaint).filter(
        Complaint.status == ComplaintStatus.RESOLVED,
        Complaint.resolved_at.isnot(None),
    ).all()

    if resolved_complaints:
        total_hours = sum(
            (c.resolved_at - c.created_at).total_seconds() / 3600
            for c in resolved_complaints
        )
        avg_resolution_hours = round(total_hours / len(resolved_complaints), 1)
    else:
        avg_resolution_hours = None

    # category breakdown
    category_counts = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )

    # last 7 days trend
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_count = db.query(Complaint).filter(Complaint.created_at >= week_ago).count()

    # overdue count (open complaints past SLA)
    all_open = db.query(Complaint).filter(
        Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.DUPLICATE])
    ).all()
    overdue_count = sum(1 for c in all_open if c.is_overdue)

    return {
        "total_complaints": total,
        "resolved": resolved,
        "open": open_count,
        "overdue": overdue_count,
        "avg_resolution_hours": avg_resolution_hours,
        "last_7_days": recent_count,
        "by_category": {cat.value if hasattr(cat, "value") else cat: count for cat, count in category_counts},
    }