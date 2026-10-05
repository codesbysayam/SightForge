# Makefile: SIGHTFORGE Developer Orchestration Tool
# ==============================================================================

.PHONY: help build up down restart logs status shell-backend shell-ai test lint format clean

help:
	@echo "SIGHTFORGE: Development Orchestration Commands:"
	@echo "  make build          Build all docker containers with no-cache"
	@echo "  make up             Start the full SaaS stack in background (db, backend, ai, frontend)"
	@echo "  make down           Stop and remove all containers, preserving volumes"
	@echo "  make restart        Restart all platform containers"
	@echo "  make logs           Stream logs from all container services"
	@echo "  make status         Check running container services status"
	@echo "  make shell-backend  Open bash session inside the FastAPI backend container"
	@echo "  make shell-ai       Open bash session inside the AI Inference container"
	@echo "  make test           Run full test suites (Frontend Jest, Python pytest)"
	@echo "  make lint           Check coding standards compliance (eslint, flake8, mypy)"
	@echo "  make format         Auto-format codebases (prettier, black, isort)"
	@echo "  make clean          Clean local build artifacts, temp files, and caches"

build:
	docker-compose build --no-cache

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

status:
	docker-compose ps

shell-backend:
	docker-compose exec backend /bin/bash

shell-ai:
	docker-compose exec ai_engine /bin/bash

test:
	@echo "==> Testing Next.js Frontend..."
	npm run test --prefix frontend || true
	@echo "==> Testing FastAPI Backend..."
	docker-compose exec backend pytest tests/ || true

lint:
	@echo "==> Linting Frontend (TypeScript)..."
	npm run lint || true
	@echo "==> Linting Backend (flake8)..."
	flake8 backend/app/ || true
	@echo "==> Type-checking Backend (mypy)..."
	mypy backend/app/ || true

format:
	@echo "==> Auto-formatting Frontend (Prettier)..."
	npm run format || true
	@echo "==> Auto-formatting Backend (Black & Isort)..."
	black backend/app/
	isort backend/app/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name "node_modules" -exec rm -rf {} +
	find . -type d -name ".next" -exec rm -rf {} +
	find . -type d -name "dist" -exec rm -rf {} +
