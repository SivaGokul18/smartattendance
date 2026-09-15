import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Attendance API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # MySQL 8.x Configuration
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "SIVAGOKUL@2007")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "smart_attendance")

    # Optional direct connection string override
    DATABASE_URL_OVERRIDE: str = os.getenv("DATABASE_URL", "")

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

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = os.getenv(
        "GOOGLE_CLIENT_ID",
        "652946018589-ncmoasimhfq3ekdkof9vlbkqettnrstm.apps.googleusercontent.com"
    )
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_URL_OVERRIDE:
            return self.DATABASE_URL_OVERRIDE
        # Safely assemble async MySQL URL handling special characters like @ in password
        return URL.create(
            drivername="mysql+aiomysql",
            username=self.MYSQL_USER,
            password=self.MYSQL_PASSWORD,
            host=self.MYSQL_HOST,
            port=self.MYSQL_PORT,
            database=self.MYSQL_DATABASE,
            query={"charset": "utf8mb4"}
        ).render_as_string(hide_password=False)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
