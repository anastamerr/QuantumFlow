# QuantumFlow Backend (FastAPI + Qiskit)

This backend executes QuantumFlow circuits on a real Qiskit backend (Aer simulator by default) and returns measurement counts and probabilities.

## Endpoints

- `GET /health` — quick health check, reports Qiskit availability and backend setting.
- `POST /api/v1/execute` — execute a circuit described by gates.
  - Request body:
    ```json
    {
      "num_qubits": 2,
      "gates": [
        {"type": "h", "qubit": 0, "position": 0},
        {"type": "cx", "qubit": 0, "targets": [1], "position": 1}
      ],
      "shots": 1024,
      "memory": false
    }
    ```
  - Response body:
    ```json
    {
      "backend": "aer_simulator",
      "shots": 1024,
      "counts": {"00": 500, "11": 524},
      "probabilities": {"00": 0.4883, "11": 0.5117},
      "memory": null,
      "status": "success"
    }
    ```

## Quick Start (use the dev scripts)

These scripts create a virtual environment, install dependencies (including `qiskit`), ensure a `.env` exists, and start the FastAPI server on `http://localhost:8000`.

Windows (PowerShell)
```powershell
cd backend
.# First run installs deps and starts server
./dev.ps1

# Subsequent runs (skip reinstall)
./dev.ps1 -NoInstall
```

macOS/Linux
```bash
cd backend
chmod +x dev.sh
# First run installs deps and starts server
./dev.sh

# Subsequent runs (skip reinstall)
NO_INSTALL=1 ./dev.sh
```

Open http://localhost:8000/health and http://localhost:8000/docs to verify.

## Environment Variables

- `HOST` (default `0.0.0.0`)
- `PORT` (default `8000`)
- `ALLOWED_ORIGINS` — comma-separated list of frontend origins. Example: `http://localhost:3000`.
- `QISKIT_BACKEND` — Qiskit backend name (default `aer_simulator`).

## Notes

- Uses Aer simulator by default. For IBM Quantum hardware, we can extend to `qiskit_ibm_runtime` with credentials on request.
- Gate support includes: `h,x,y,z,s,t,rx,ry,rz,p,cx/cnot,cz,swap,toffoli/ccx`.
