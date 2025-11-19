#!/usr/bin/env bash
set -euo pipefail

echo "[dev] Using Python: $(python3 --version 2>/dev/null || python --version)"

if [ ! -d .venv ]; then
  echo "[dev] Creating venv (.venv)"
  python3 -m venv .venv || python -m venv .venv
fi

echo "[dev] Activating venv"
if [ -f .venv/bin/activate ]; then
  source .venv/bin/activate
else
  source .venv/Scripts/activate
fi

if [ "${NO_INSTALL:-}" != "1" ]; then
  echo "[dev] Upgrading pip and installing requirements (includes qiskit)"
  python -m pip install --upgrade pip
  pip install -r requirements.txt
fi

if [ ! -f .env ]; then
  echo "[dev] Creating .env from .env.example"
  cp .env.example .env || true
fi

echo "[dev] Starting uvicorn on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

