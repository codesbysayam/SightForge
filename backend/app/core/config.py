# ==============================================================================
# config.py - Enterprise System Settings & Environment Schema (Pydantic v2)
# ==============================================================================

import os
from typing import List, Optional
from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Main system configurations validated at startup using Pydantic.
    Loads and maps variables from system environment or a local .env file.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Core Application Settings
    APP_NAME: str = "SIGHTFORGE"
    APP_ENV: str = "development"  # development, staging, production
    DEBUG: bool = True
    SECRET_KEY: str = "placeholder_secret_key_change_in_production"
    API_PREFIX: str = "/api/v1"

    # Network Configuration
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # CORS Allowed Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database Settings
    POSTGRES_USER: str = "visiontrack_admin"
    POSTGRES_PASSWORD: str = "secure_database_password_here"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "visiontrack"
    DATABASE_URL: Optional[str] = None

    # Database Tuning Pools
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_TIMEOUT: int = 30

    # JWT Authentication Setup
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage Settings
    STORAGE_PROVIDER: str = "local"  # local, s3, gcs
    STORAGE_BASE_PATH: str = "./data/storage"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_STORAGE_BUCKET_NAME: Optional[str] = None
    AWS_S3_REGION_NAME: str = "us-east-1"

    # AI Engine Bounding Thresholds
    YOLO_MODEL_NAME: str = "yolov8n.pt"
    CV_DEVICE: str = "auto"
    CONFIDENCE_THRESHOLD: float = 0.25
    IOU_THRESHOLD: float = 0.45

    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_TO_FILE: bool = True
    LOG_FILE_PATH: str = "./logs/visiontrack.log"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> str:
        """Dynamically build postgresql URL if not explicitly supplied."""
        if isinstance(v, str) and v:
            return v
        
        # Access elements loaded up to this point from the values dictionary
        data = info.data
        user = data.get("POSTGRES_USER", "visiontrack_admin")
        pw = data.get("POSTGRES_PASSWORD", "secure_database_password_here")
        host = data.get("POSTGRES_HOST", "localhost")
        port = data.get("POSTGRES_PORT", 5432)
        db = data.get("POSTGRES_DB", "visiontrack")
        
        return f"postgresql+psycopg2://{user}:{pw}@{host}:{port}/{db}"


# Singleton instance of system settings
settings = Settings()
