# VisionTrack AI — Enterprise Computer Vision SaaS Platform

VisionTrack AI is a highly scalable, production-grade enterprise SaaS platform designed for real-time edge computer vision, multi-stream video analysis, YOLOv8 object detection, and robust Multi-Object Tracking (MOT). This repository holds the foundational codebase, system configurations, docker orchestration networks, CI automation, and code formatting rules for the platform.

---

## 🚀 Key Architectural Layout

The foundation follows SOLID and Clean Architecture guidelines split across separate micro-services running in secure containers.

```
                  +-----------------------------------+
                  |        IP Camera/RTSP Feed        |
                  +-----------------------------------+
                                    |
                                    v (H.264/RTSP stream)
                  +-----------------------------------+
                  |           AI Inference Node       |
                  |          (PyTorch + YOLOv8)       |
                  +-----------------------------------+
                                    |
                                    v (ByteTrack Matches)
+--------------+  +-----------------------------------+
| Next.js Client|<-|           FastAPI Gateway         |
|  (React 19)  |  |           (SQLAlchemy)            |
+--------------+  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |          PostgreSQL Pool          |
                  +-----------------------------------+
```

---

## 📂 System Directory Tree Reference

This platform is structured to ensure separation of concerns and rapid independent modular engineering.

```
/
├── .github/workflows/          # Enterprise Continuous Integration (CI) configuration
├── ai_engine/                  # Edge Computer Vision processing daemon (PyTorch / YOLO)
│   ├── weights/                # CNN target model storage directory (.pt / .onnx)
│   ├── detectors/              # Model wrapper classes (lazy initializers & warmers)
│   ├── trackers/               # Object tracking systems (ByteTrack, BoT-SORT)
│   ├── preprocessing/          # OpenCV resizing, alignment, and normalizing pipelines
│   └── main.py                 # Primary CV acquisition and processing event loop
├── backend/                    # Core REST API Gateway & metadata controller
│   └── app/
│       ├── api/                # Route handlers, response schemas, and controllers
│       ├── core/               # Pydantic configuration settings and exceptions
│       ├── database/           # Connection pooling engine and SQLAlchemy sessions
│       ├── models/             # Database relational table models
│       └── main.py             # FastAPI bootstrap loader and event registers
├── src/                        # Next.js / React 19 visual client explorer
│   ├── components/             # Subdivided, high-fidelity UI layout files
│   └── App.tsx                 # Core interactive visual architect portal
├── docker-compose.yml          # Full-stack network composition orchestrator
├── Dockerfile.frontend         # Stage 2 production optimized Next.js dockerizer
├── Dockerfile.backend          # Stage 2 production optimized FastAPI dockerizer
├── Dockerfile.ai               # PyTorch GPU-accelerated node dockerizer
├── Makefile                    # Developer shell automation task executor
└── requirements.txt            # Locked Python requirements list
```

---

## 🛠️ Step-by-Step Installation & Quickstart

To run the full stack (Next.js, FastAPI, PostgreSQL, and PyTorch AI nodes) in development mode, follow these steps.

### Prerequisites
- Docker Engine & Docker Compose
- Node.js 18+ (for local frontend hacking)
- Python 3.12 (for local backend hacking)
- NVIDIA Container Toolkit (optional, for hardware-accelerated local inference)

### 1. Configure the Local Environment
Initialize the environment settings from our system template:
```bash
cp .env.example .env
```
*(Open `.env` in your editor to tune DB passwords, YOLO threshold levels, and Gemini API keys as needed).*

### 2. Orchestrate Container Infrastructure via Docker Compose
Build and boot the database pools, API gateways, computer vision daemons, and client dashboards in one unified network:
```bash
make up
```
*(Verify container health states via `make status` or stream telemetry outputs via `make logs`)*.

### 3. Local Developer Workspace Setup
If you prefer running components locally outside of Docker during micro-service debugging:

#### Starting FastAPI REST server locally:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Running the AI Computer Vision daemon locally:
```bash
cd ai_engine
source ../backend/venv/bin/activate
python main.py
```

#### Hacking on the React Client interface locally:
```bash
npm install
npm run dev
```

---

## 🏆 Clean Architecture & SOLID Design Principles
1. **Separation of Concerns**: Business core calculations are purely separated from external frameworks.
2. **Explicit Layer Responsibilities**:
   - **Presentation Layer**: Next.js client renders pixels and caches server data via React query hook states.
   - **Application Layer**: FastAPI routes receive REST commands, validate schema structures via Pydantic, and authorize access tokens.
   - **Domain Layer**: SQLAlchemy models map business structures, entity relationships, and transaction records.
   - **Infrastructure Layer**: Docker virtualization, PyTorch model-loader loops, GStreamer, and PostgreSQL handle direct system calls.
3. **No Hardcoded Variables**: All keys, ports, models, and latency buffers are dynamically resolved from environment variables via Pydantic.

---

## 🛡️ License
Distributed under the **MIT License**. Read `LICENSE` file for more details.
