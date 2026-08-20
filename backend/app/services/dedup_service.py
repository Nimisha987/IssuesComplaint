from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.complaint import Complaint, ComplaintStatus

DEDUP_RADIUS_METERS = 50


def find_duplicate(db: Session, category: str, lat: float, lng: float) -> Complaint | None:
    """
    Simple haversine-based proximity check against open complaints
    of the same category. Good enough for MVP — swap for PostGIS
    ST_DWithin later if you need real scale.
    """
    if lat is None or lng is None:
        return None

    open_statuses = [
        ComplaintStatus.RECEIVED, ComplaintStatus.VERIFIED,
        ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS,
    ]

    candidates = db.query(Complaint).filter(
        Complaint.category == category,
        Complaint.status.in_(open_statuses),
        Complaint.latitude.isnot(None),
    ).all()

    for c in candidates:
        distance = _haversine_meters(lat, lng, c.latitude, c.longitude)
        if distance <= DEDUP_RADIUS_METERS:
            return c

    return None


def _haversine_meters(lat1, lon1, lat2, lon2) -> float:
    import math
    R = 6371000  # earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))