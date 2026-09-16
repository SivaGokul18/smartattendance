import os
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Attendance API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Supabase / PostgreSQL Configuration
    DATABASE_URL_OVERRIDE: str = ""
    SUPABASE_DB_URL: str = ""

    # Secret Key for JWT encryption
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart-attendance-institutional-production-master-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Redis (optional for multi-node WebSocket broadcasting and cache)
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Global attendance thresholds
    BLE_SIGNAL_RANGE_DEFAULT: float = 15.0  # meters
    BLE_RSSI_THRESHOLD_DEFAULT: float = -75.0  # dBm
    FACE_CONFIDENCE_THRESHOLD_DEFAULT: float = 85.0  # %

    # Google OAuth 2.0 Credentials (accepts both Web and Android Client IDs)
    GOOGLE_CLIENT_ID: str = os.getenv(
        "GOOGLE_CLIENT_ID",
        "652946018589-ncmoasimhfq3ekdkof9vlbkqettnrstm.apps.googleusercontent.com,652946018589-f54vmc1ml3cn0srfki80uat9n57p7s7g.apps.googleusercontent.com"
    )
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    ALLOW_GOOGLE_AUTOPROVISION: bool = os.getenv("ALLOW_GOOGLE_AUTOPROVISION", "true").lower() in ("true", "1", "yes")

    @property
    def DATABASE_URL(self) -> str:
        # 1. Use explicit DATABASE_URL or SUPABASE_DB_URL
        raw_url = (os.getenv("DATABASE_URL") or self.DATABASE_URL_OVERRIDE or os.getenv("SUPABASE_DB_URL") or self.SUPABASE_DB_URL or "").strip()
        if raw_url:
            url = raw_url
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
                url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
            
            # Clean up Supabase / asyncpg query parameters
            # asyncpg does not accept ?sslmode=require, it expects ssl=require or strips it for connect_args
            if "sslmode=require" in url:
                url = url.replace("sslmode=require", "ssl=require")
            
            # Strip pgbouncer query param from URL (asyncpg handles pooling via statement_cache_size)
            if "pgbouncer=true" in url:
                url = url.replace("?pgbouncer=true&", "?").replace("&pgbouncer=true", "").replace("?pgbouncer=true", "")

            return url

        # 2. Check if SQLite is explicitly requested
        if os.getenv("USE_SQLITE", "false").lower() in ("true", "1", "yes"):
            return "sqlite+aiosqlite:///./smart_attendance.db"

        # 3. Default fallback to local SQLite async database if no Supabase/PostgreSQL URL is set
        return "sqlite+aiosqlite:///./smart_attendance.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
