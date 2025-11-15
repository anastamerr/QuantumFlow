# --- Base image: Python 3.11 (recommended for qiskit) ---
FROM python:3.11-slim

# --- Prevent Python from writing .pyc files and using stdout buffering ---
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# --- Install system dependencies required by qiskit ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libssl-dev \
    libffi-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# --- Create app directory ---
WORKDIR /app

# --- Copy requirements early to leverage Docker layer caching ---
COPY requirements.txt .

# --- Install Python dependencies ---
RUN pip install --upgrade pip && pip install -r requirements.txt

# --- Copy application code ---
COPY . .

# --- Expose FastAPI port ---
EXPOSE 8000

# --- Command to start FastAPI server ---
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
