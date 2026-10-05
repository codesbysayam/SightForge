# ==============================================================================
# dependencies.py - FastAPI Dependency Injections for Request Contexts
# ==============================================================================

from typing import Generator
from sqlalchemy.orm import Session
from backend.app.database.database import SessionLocal
from backend.app.core.logging import setup_logger

logger = setup_logger("dependencies")


def get_db() -> Generator[Session, None, None]:
    """
    Dependency generator yielding a transactional SQL Alchemy Session context.
    Strictly guarantees cleanup (closing connection) at the end of every request cycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        # Close connection context and return it to the SQLAlchemy pool
        db.close()
