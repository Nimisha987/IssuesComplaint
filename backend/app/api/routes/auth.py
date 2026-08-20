from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.official import Official
from app.core.security import verify_password, hash_password, create_access_token, decode_access_token
from app.schemas.auth import SignupRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(Official).filter_by(email=payload.email).first()
    if existing:
        raise HTTPException(400, "An account with this email already exists")

    official = Official(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        department=payload.department,
        is_admin=False,
    )
    db.add(official)
    db.commit()
    db.refresh(official)

    token = create_access_token({"sub": str(official.id), "email": official.email})
    return AuthResponse(
        access_token=token, name=official.name, email=official.email, is_admin=official.is_admin
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    official = db.query(Official).filter_by(email=payload.email).first()
    if not official or not verify_password(payload.password, official.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = create_access_token({"sub": str(official.id), "email": official.email})
    return AuthResponse(
        access_token=token, name=official.name, email=official.email, is_admin=official.is_admin
    )


def get_current_official(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(401, "Invalid token")
    official = db.query(Official).filter_by(id=payload["sub"]).first()
    if not official:
        raise HTTPException(401, "Official not found")
    return official


@router.get("/officials")
def list_officials(current: Official = Depends(get_current_official), db: Session = Depends(get_db)):
    if not current.is_admin:
        raise HTTPException(403, "Admin access required")
    return db.query(Official).all()


@router.patch("/officials/{official_id}/toggle-admin")
def toggle_admin(official_id: str, current: Official = Depends(get_current_official), db: Session = Depends(get_db)):
    if not current.is_admin:
        raise HTTPException(403, "Admin access required")
    official = db.query(Official).filter_by(id=official_id).first()
    if not official:
        raise HTTPException(404, "Not found")
    official.is_admin = not official.is_admin
    db.commit()
    return {"is_admin": official.is_admin}