# QuantumFlow

QuantumFlow is a full-stack quantum circuit design, simulation, and measurement platform. It pairs a visual circuit builder with local statevector simulation and a Qiskit-powered backend for execution, analytics, and metrics.

## Features
- Visual circuit editor with drag-and-drop gates and parameter controls.
- Local statevector simulation for fast iteration (practical browser limit is 8-10 qubits).
- Backend execution with Qiskit Aer and configurable backends.
- Multi-basis measurement (X/Y/Z), partial measurement, mid-circuit measurement, and optional reset.
- Per-qubit probabilities, confidence intervals, and measurement exports.
- COSMIC functional size metrics (occurrences, types, q-cosmic).
- Hardware-oriented metrics (depth, width, gate counts, T-count, CNOT count, etc.).
- Optional C++17 hardware-metrics engine with automatic Python fallback.
- Code generation for Qiskit, Cirq, and Braket.
- Visualization panels for state, Bloch sphere, and measurement histograms.

## Architecture
- Frontend: React + TypeScript + Vite + Chakra UI, with Redux for state management.
- Backend: FastAPI + Qiskit, with measurement analytics and a native C++17 metrics accelerator.

## Quick Start

### Prerequisites
- Node.js 20.x (see `frontend/package.json` engines)
- Python 3.8+ and pip
- CMake and a C++17 compiler (optional, for the native metrics accelerator)

### Backend

Windows (PowerShell):
```powershell
cd backend
./dev.ps1
```

macOS/Linux:
```bash
cd backend
chmod +x dev.sh
./dev.sh
```

The backend will start at `http://localhost:8000`.

Build the optional C++ analyzer before starting the backend:

```bash
cd backend
cmake -S native -B native/build -DCMAKE_BUILD_TYPE=Release
cmake --build native/build --config Release
```

On Windows with Visual Studio Build Tools, run `backend/native/build_windows.cmd`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Configuration

Backend environment:
- Copy `backend/.env.example` to `backend/.env` and update as needed.
- Key settings: `ALLOWED_ORIGINS`, `QISKIT_BACKEND`, `STATEVECTOR_MAX_QUBITS`, `AUTH_USERNAME`, `AUTH_PASSWORD`.

Frontend environment:
- Copy `frontend/.env.example` to `frontend/.env`.
- Key setting: `VITE_API_BASE_URL`.

## API Overview

### Health
`GET /health`

### Execute Circuit
`POST /api/v1/execute`

Example request:
```json
{
  "num_qubits": 2,
  "gates": [
    { "type": "h", "qubit": 0, "position": 0 },
    { "type": "cx", "qubit": 0, "targets": [1], "position": 1 }
  ],
  "shots": 1024,
  "method": "qasm",
  "include_metrics": true,
  "measurement_config": {
    "basis": "z",
    "qubits": [0, 1],
    "classical_bits": [0, 1],
    "reset_after": false,
    "mid_circuit": false
  }
}
```

### COSMIC Metrics
`POST /api/v1/metrics/cosmic`

### Hardware Metrics
`POST /api/v1/metrics/hardware`

For full request and response schemas, see `backend/app/models.py` or the live docs at `http://localhost:8000/docs` when the backend is running.

## Project Structure
```
QuantumFlow/
  backend/   # FastAPI + Qiskit server
  frontend/  # React + TypeScript client
  docs/      # Research references and papers
```

## Testing

Backend:
```bash
cd backend
python -m unittest discover -s tests -p "test_*.py"
python benchmarks/native_hardware_metrics_benchmark.py
```

Frontend:
```bash
cd frontend
npm run test
npm run test:coverage
npm run test:e2e
```

## Contributing
See `CONTRIBUTING.md` for workflow, standards, and guidelines.
