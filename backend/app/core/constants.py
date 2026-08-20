VALID_CATEGORIES = ["streetlight", "garbage", "pothole", "water_leakage", "drainage"]
VALID_SEVERITIES = ["minor", "medium", "severe"]
VALID_STATUSES = [
    "received",
    "verified",
    "assigned",
    "in_progress",
    "resolved",
    "duplicate",
]
SLA_DAYS = {
    "severe": 2,
    "medium": 5,
    "minor": 10,
}