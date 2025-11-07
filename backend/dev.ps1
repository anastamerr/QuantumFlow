param(
  [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'

Write-Host "[dev] Using Python: $(python --version)"

if (-not (Test-Path .venv)) {
  Write-Host "[dev] Creating venv (.venv)"
  python -m venv .venv
}

Write-Host "[dev] Activating venv"
. .\.venv\Scripts\Activate.ps1

if (-not $NoInstall) {
  Write-Host "[dev] Upgrading pip and installing requirements (includes qiskit)"
  python -m pip install --upgrade pip
  pip install -r requirements.txt
}

if (-not (Test-Path .env)) {
  Write-Host "[dev] Creating .env from .env.example"
  Copy-Item .env.example .env -ErrorAction Ignore
}

Write-Host "[dev] Starting uvicorn on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

