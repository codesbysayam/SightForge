# SIGHTFORGE: System Architecture

Welcome to the **SIGHTFORGE** real-time computer vision platform architecture documentation.

## Repository Layout

Our repository is organized as follows:

- **`frontend/`**: A Next.js 15 web interface featuring React 19, tailwindcss v4, and motion.
- **`backend/`**: A FastAPI REST Gateway using SQLAlchemy, Pydantic v2, Alembic, and connection pooling.
- **`ai_engine/`**: An isolated PyTorch-based computer vision daemon using a custom multi-object tracking pipeline.
- **`docker/`**: Independent, specialized Docker files for multi-container orchestration.
- **`docs/`**: Platform specs and structural roadmaps.
- **`scripts/`**: DevOps automation and verification tooling.
- **`.github/`**: Configuration files for continuous integration pipelines.

## Component Integrations

```
┌─────────────────────────────────┐
│     Next.js 15 Web Console      │
│          (Port 3000)            │
└────────────────┬────────────────┘
                 │
                 │ HTTP (REST Gateway API)
                 ▼
┌─────────────────────────────────┐
│        FastAPI Backend          │
│          (Port 8000)            │
└────────┬───────────────┬────────┘
         │               │
         │ SQLAlchemy    │ Inter-process Metadata
         ▼               ▼
┌────────────────┐ ┌───────────────┐
│ PostgreSQL Pool│ │   AI Engine   │
│  (Port 5432)   │ │ (PyTorch/YOLO)│
└────────────────┘ └───────────────┘
```
