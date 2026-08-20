import resend
from app.config import settings

resend.api_key = getattr(settings, "RESEND_API_KEY", "")


def notify_status_change(email: str, complaint_code: str, new_status: str):
    if not email or "@" not in email or not resend.api_key:
        return  # skip silently if no email or no API key configured

    try:
        resend.Emails.send({
            "from": "Civic Complaints <onboarding@resend.dev>",
            "to": email,
            "subject": f"Update on complaint {complaint_code}",
            "html": f"<p>Your complaint <b>{complaint_code}</b> status is now: <b>{new_status.replace('_', ' ').title()}</b></p>",
        })
    except Exception:
        pass  # never let email failure break the status update