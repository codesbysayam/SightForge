#!/usr/bin/env bash

# ==============================================================================
# setup.sh - VisionTrack AI Developer Environment Setup
# ==============================================================================

set -euo pipefail

echo "==> Setting up VisionTrack AI monorepo..."

# Initialize Frontend Dependencies
echo "==> Configuring Frontend (Next.js 15)..."
cd frontend
npm install
cd ..

# Initialize Python Virtual Environment
echo "==> Configuring Backend & AI Engine Virtual Environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

echo "==> Setup completed successfully!"
