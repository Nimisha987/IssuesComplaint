from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import whatsapp, complaints, auth, analytics, uploads
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="Civic Complaint AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(whatsapp.router)
app.include_router(complaints.router)
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(uploads.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok", "service": "civic-complaint-ai"}


@app.get("/health")
def health():
    return {"status": "healthy"}