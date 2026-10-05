# ==============================================================================
# database.py - Enterprise SQLAlchemy Engine & Connection Pool Orchestration
# ==============================================================================

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings
from backend.app.core.logging import setup_logger

logger = setup_logger("database_core")

# Initialize robust connection pool properties matching cloud-scale databases
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=True, # Active connection liveness checks before serving transactions
    echo=False          # Turn true only during manual developer diagnostics to prevent log bloat
)

# Declarative Session Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base Declarative Model Class for models/ schemas mapping
Base = declarative_base()


def verify_database_connection() -> bool:
    """
    Validates database accessibility on app startup (active dependency check).
    Runs a lightweight direct transaction to confirm engine configuration is operational.
    """
    try:
        # Obtain a direct connection from the pool and issue light query
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("Successfully established active connection pool with database instance.")
        return True
    except Exception as e:
        logger.critical(f"FATAL: Database connectivity check failed: {str(e)}")
        return False
