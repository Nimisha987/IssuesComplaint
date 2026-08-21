from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # AI providers
    OPENROUTER_API_KEY: str
    GROQ_API_KEY: str

    # WhatsApp Cloud API (optional — not currently used)
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = ""
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = ""

    # App
    ENV: str = "development"
    SECRET_KEY: str = "dev-secret-change-in-production"

    class Config:
        env_file = ".env"


settings = Settings()