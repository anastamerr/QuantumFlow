# QuantumFlow Backend - Hackathon Developer Guide

Welcome to the QuantumFlow backend! This FastAPI server executes quantum circuits using Qiskit and provides a REST API for the frontend. This guide will help you understand the backend architecture and extend it for the Qiskit Fall Fest 2025.

## Table of Contents
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Qiskit Integration](#qiskit-integration)
- [Common Tasks](#common-tasks)
- [Environment Configuration](#environment-configuration)
- [Adding Features](#adding-features)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation & Running

The easiest way to start the backend is using the provided development scripts:

**Windows (PowerShell):**
```powershell
cd backend
./dev.ps1              # First run: installs dependencies and starts server
./dev.ps1 -NoInstall   # Subsequent runs: skip reinstall
```

**macOS/Linux:**
```bash
cd backend
chmod +x dev.sh
./dev.sh                # First run: installs dependencies and starts server
NO_INSTALL=1 ./dev.sh   # Subsequent runs: skip reinstall
```

The server will start at `http://localhost:8000`.

### Verify Installation

1. **Health Check**: Open http://localhost:8000/health
   - Should return: `{"status": "ok", "qiskit": true, "backend_env": "aer_simulator"}`

2. **API Documentation**: Open http://localhost:8000/docs
   - Interactive Swagger UI for testing endpoints

3. **Alternative Docs**: Open http://localhost:8000/redoc
   - ReDoc-style API documentation

---

## Architecture Overview

The backend is a **FastAPI application** that:
1. Receives circuit descriptions from the frontend
2. Converts them to Qiskit circuits
3. Executes on Qiskit backends (Aer simulator or IBM Quantum)
4. Returns measurement results and probabilities

**Tech Stack:**
- **FastAPI** - Modern Python web framework with automatic API docs
- **Qiskit** - IBM's quantum computing SDK
- **Qiskit Aer** - High-performance quantum circuit simulator
- **Pydantic** - Data validation using Python type hints
- **Uvicorn** - ASGI server for production-ready deployment

**Key Features:**
- CORS support for frontend integration
- Environment-based configuration
- Automatic request/response validation
- Built-in API documentation
- Extensible for real IBM Quantum hardware

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application and route handlers
│   ├── qiskit_runner.py     # Qiskit circuit execution engine
│   ├── models.py            # Pydantic data models (request/response)
│   └── __pycache__/         # Python bytecode cache
│
├── .venv/                   # Python virtual environment
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── .env                     # Your environment config (create this)
├── dev.sh                   # macOS/Linux development script
├── dev.ps1                  # Windows PowerShell development script
└── README.md                # You are here!
```

---

## API Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running and Qiskit is available.

**Response:**
```json
{
  "status": "ok",
  "qiskit": true,
  "backend_env": "aer_simulator"
}
```

**Example:**
```bash
curl http://localhost:8000/health
```

---

### 2. Execute Circuit

**POST** `/api/v1/execute`

Execute a quantum circuit and return measurement results.

**Auth (optional):** If `AUTH_USERNAME`/`AUTH_PASSWORD` are set, include a Basic Auth header:

```
Authorization: Basic base64(username:password)
```

**Request Body:**
```json
{
  "num_qubits": 2,
  "gates": [
    {
      "type": "h",
      "qubit": 0,
      "position": 0
    },
    {
      "type": "cx",
      "qubit": 0,
      "targets": [1],
      "position": 1
    }
  ],
  "shots": 1024,
  "memory": false,
  "backend": "aer_simulator"  // Optional: override default backend
}
```

**Response:**
```json
{
  "backend": "aer_simulator",
  "shots": 1024,
  "counts": {
    "00": 512,
    "11": 512
  },
  "probabilities": {
    "00": 0.5,
    "11": 0.5
  },
  "memory": null,
  "status": "success"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "num_qubits": 2,
    "gates": [
      {"type": "h", "qubit": 0, "position": 0},
      {"type": "cx", "qubit": 0, "targets": [1], "position": 1}
    ],
    "shots": 1024,
    "memory": false
  }'
```

---

## Qiskit Integration

### Supported Gates

The backend supports all standard Qiskit gates:

| Gate Type | Qiskit Method | Parameters | Example |
|-----------|---------------|------------|---------|
| Hadamard | `qc.h(qubit)` | None | `{"type": "h", "qubit": 0}` |
| Pauli-X | `qc.x(qubit)` | None | `{"type": "x", "qubit": 1}` |
| Pauli-Y | `qc.y(qubit)` | None | `{"type": "y", "qubit": 0}` |
| Pauli-Z | `qc.z(qubit)` | None | `{"type": "z", "qubit": 1}` |
| S Gate | `qc.s(qubit)` | None | `{"type": "s", "qubit": 0}` |
| T Gate | `qc.t(qubit)` | None | `{"type": "t", "qubit": 0}` |
| RX | `qc.rx(theta, qubit)` | theta (radians) | `{"type": "rx", "qubit": 0, "params": {"theta": 1.57}}` |
| RY | `qc.ry(theta, qubit)` | theta (radians) | `{"type": "ry", "qubit": 0, "params": {"theta": 1.57}}` |
| RZ | `qc.rz(phi, qubit)` | phi (radians) | `{"type": "rz", "qubit": 0, "params": {"phi": 1.57}}` |
| Phase | `qc.p(phi, qubit)` | phi (radians) | `{"type": "p", "qubit": 0, "params": {"phi": 1.57}}` |
| CNOT | `qc.cx(control, target)` | None | `{"type": "cx", "qubit": 0, "targets": [1]}` |
| CZ | `qc.cz(control, target)` | None | `{"type": "cz", "qubit": 0, "targets": [1]}` |
| SWAP | `qc.swap(qubit1, qubit2)` | None | `{"type": "swap", "qubit": 0, "targets": [1]}` |
| Toffoli | `qc.ccx(c1, c2, target)` | None | `{"type": "toffoli", "qubit": 0, "targets": [1, 2]}` |

### Circuit Execution Flow

```
1. Receive circuit data via API
           ↓
2. Validate request (Pydantic models)
           ↓
3. Build Qiskit QuantumCircuit (qiskit_runner.py)
           ↓
4. Add gates sequentially
           ↓
5. Add measurements (if needed)
           ↓
6. Execute on backend (Aer or IBM Quantum)
           ↓
7. Parse results (counts, probabilities)
           ↓
8. Return JSON response
```

### Backend Options

**Aer Simulator (Default):**
- Fast, local simulation
- Supports up to ~30 qubits
- No queue time
- Noiseless by default

**IBM Quantum (Future):**
- Real quantum hardware
- Requires IBM Quantum account
- Queue times vary
- Realistic noise models

---

## Common Tasks

### Adding a New Gate

**Step 1**: Update `app/models.py` if needed

If your gate has special parameters, add them to the `GateDefinition` model:

```python
class GateDefinition(BaseModel):
    type: str
    qubit: int
    position: int
    targets: Optional[List[int]] = None
    params: Optional[Dict[str, float]] = None
```

**Step 2**: Implement gate in `app/qiskit_runner.py`

Add a new case to the gate handling logic:

```python
def build_circuit(num_qubits: int, gates: List[GateDefinition]) -> QuantumCircuit:
    qc = QuantumCircuit(num_qubits, num_qubits)

    for gate in gates:
        if gate.type == "my_new_gate":
            angle = gate.params.get("angle", 0) if gate.params else 0
            qc.my_new_gate(angle, gate.qubit)
        # ... other gates

    return qc
```

**Step 3**: Test the gate

Use the interactive API docs at http://localhost:8000/docs to test.

---

### Connecting to IBM Quantum Hardware

**Step 1**: Install IBM Quantum Runtime

```bash
pip install qiskit-ibm-runtime
```

**Step 2**: Get IBM Quantum API token

1. Create account at https://quantum-computing.ibm.com/
2. Copy your API token from account settings

**Step 3**: Update `app/qiskit_runner.py`

```python
from qiskit_ibm_runtime import QiskitRuntimeService

# Save credentials (one-time)
QiskitRuntimeService.save_account(channel="ibm_quantum", token="YOUR_TOKEN")

# Load service
service = QiskitRuntimeService(channel="ibm_quantum")

# Get backend
backend = service.backend("ibm_kyoto")  # Or other device

# Execute
job = backend.run(qc, shots=1024)
result = job.result()
```

**Step 4**: Update environment variable

```env
QISKIT_BACKEND=ibm_kyoto
```

---

### Adding a New Endpoint

**Step 1**: Define request/response models in `app/models.py`

```python
class MyNewRequest(BaseModel):
    param1: str
    param2: int

class MyNewResponse(BaseModel):
    result: str
    status: str
```

**Step 2**: Add route in `app/main.py`

```python
@app.post("/api/v1/my-new-endpoint", response_model=MyNewResponse)
async def my_new_endpoint(request: MyNewRequest):
    # Your logic here
    result = process_request(request.param1, request.param2)

    return MyNewResponse(
        result=result,
        status="success"
    )
```

**Step 3**: Test at http://localhost:8000/docs

---

## Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000

# CORS Configuration (add your frontend URL)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

# Qiskit Backend
QISKIT_BACKEND=aer_simulator

# IBM Quantum (if using real hardware)
# IBM_QUANTUM_TOKEN=your_token_here

# Basic Auth (optional)
# AUTH_USERNAME=quantum
# AUTH_PASSWORD=flow

# Rate limiting (optional)
# RATE_LIMIT_REQUESTS=60
# RATE_LIMIT_WINDOW_SEC=60

# Logging
# LOG_LEVEL=INFO
```

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host address |
| `PORT` | `8000` | Server port |
| `ALLOWED_ORIGINS` | (empty) | Comma-separated frontend URLs for CORS |
| `QISKIT_BACKEND` | `aer_simulator` | Qiskit backend name |
| `AUTH_USERNAME` | (unset) | Enable Basic Auth when set |
| `AUTH_PASSWORD` | (unset) | Password for Basic Auth |
| `RATE_LIMIT_REQUESTS` | `0` | Requests allowed per window (0 disables) |
| `RATE_LIMIT_WINDOW_SEC` | `0` | Rate limit window in seconds |
| `LOG_LEVEL` | `INFO` | Log verbosity |

---

## Adding Features

### Example: Add Circuit Optimization Endpoint

**Goal:** Accept a circuit and return an optimized version.

**Step 1**: Add models in `app/models.py`

```python
class OptimizeRequest(BaseModel):
    num_qubits: int
    gates: List[GateDefinition]
    optimization_level: int = 3

class OptimizeResponse(BaseModel):
    original_depth: int
    optimized_depth: int
    optimized_gates: List[GateDefinition]
    status: str
```

**Step 2**: Create optimization function in `app/qiskit_runner.py`

```python
from qiskit.transpiler import transpile

def optimize_circuit(qc: QuantumCircuit, level: int = 3) -> QuantumCircuit:
    optimized = transpile(qc, optimization_level=level)
    return optimized
```

**Step 3**: Add endpoint in `app/main.py`

```python
@app.post("/api/v1/optimize", response_model=OptimizeResponse)
async def optimize_circuit_endpoint(request: OptimizeRequest):
    # Build original circuit
    original_qc = build_circuit(request.num_qubits, request.gates)
    original_depth = original_qc.depth()

    # Optimize
    optimized_qc = optimize_circuit(original_qc, request.optimization_level)
    optimized_depth = optimized_qc.depth()

    # Convert back to gate list (implement conversion logic)
    optimized_gates = circuit_to_gates(optimized_qc)

    return OptimizeResponse(
        original_depth=original_depth,
        optimized_depth=optimized_depth,
        optimized_gates=optimized_gates,
        status="success"
    )
```

---

### Example: Add Noise Simulation

**Goal:** Simulate circuits with realistic quantum noise.

**Step 1**: Install Qiskit Aer noise models

```bash
pip install qiskit-aer
```

**Step 2**: Add noise model to execution in `app/qiskit_runner.py`

```python
from qiskit_aer.noise import NoiseModel, depolarizing_error

def execute_with_noise(qc: QuantumCircuit, shots: int = 1024):
    # Create noise model
    noise_model = NoiseModel()

    # Add depolarizing error
    error_1q = depolarizing_error(0.001, 1)  # 0.1% error on single-qubit gates
    error_2q = depolarizing_error(0.01, 2)   # 1% error on two-qubit gates

    noise_model.add_all_qubit_quantum_error(error_1q, ['h', 'x', 'y', 'z'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx'])

    # Execute with noise
    backend = Aer.get_backend('qasm_simulator')
    job = backend.run(qc, shots=shots, noise_model=noise_model)
    result = job.result()

    return result
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'qiskit'` | Run `pip install -r requirements.lock` (preferred) or `pip install -r requirements.txt` |
| `Port 8000 already in use` | Change `PORT` in `.env` or kill existing process |
| `CORS error from frontend` | Add frontend URL to `ALLOWED_ORIGINS` in `.env` |
| `Qiskit import error` | Ensure Python 3.8+ and reinstall: `pip install --upgrade qiskit` |
| Server won't start | Check Python version: `python --version` |
| `401 Unauthorized` | Ensure `AUTH_USERNAME`/`AUTH_PASSWORD` are set correctly and include Basic Auth header |

### Debugging

**Check Logs:**
The server prints logs to the terminal. Look for:
- Request details
- Qiskit execution output
- Error tracebacks

**Add Print Statements:**
```python
print(f"Received request: {request}")
print(f"Built circuit: {qc}")
```

**Use Python Debugger:**
```python
import pdb; pdb.set_trace()  # Breakpoint
```

**Test API Directly:**
Use http://localhost:8000/docs for interactive testing.

---

## Development Workflow

### Manual Setup (Alternative to Scripts)

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies (prefer the lockfile if present)
pip install -r requirements.lock

# Create .env file
cp .env.example .env

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Code Structure Best Practices

1. **Models in `models.py`**: All Pydantic models
2. **Business logic in `qiskit_runner.py`**: Circuit building and execution
3. **Routes in `main.py`**: API endpoint definitions
4. **Keep functions small**: Each function does one thing
5. **Add type hints**: Use Python type hints for clarity

---

## Testing

Run the backend unit + integration tests:

```bash
cd backend
python -m unittest discover -s tests -p "test_*.py"
```

---

## Performance Considerations

### Scaling Tips

1. **Use async/await**: FastAPI supports async for better concurrency
2. **Connection pooling**: For database connections (if added)
3. **Caching**: Cache frequently-used circuits or results
4. **Rate limiting**: Prevent API abuse
5. **Queue systems**: For long-running quantum jobs (Celery, RQ)

### Optimization

```python
# Example: Cache circuit results
from functools import lru_cache

@lru_cache(maxsize=100)
def execute_circuit_cached(circuit_hash: str, shots: int):
    # Execute and return result
    pass
```

---

## Resources

### Qiskit Documentation
- [Qiskit Docs](https://qiskit.org/documentation/)
- [Qiskit Tutorials](https://qiskit.org/documentation/tutorials.html)
- [Qiskit API Reference](https://qiskit.org/documentation/apidoc/qiskit.html)
- [Qiskit Aer](https://qiskit.org/documentation/apidoc/aer.html)

### FastAPI Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Pydantic Models](https://docs.pydantic.dev/)
- [Uvicorn Server](https://www.uvicorn.org/)

### Python Resources
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [Python asyncio](https://docs.python.org/3/library/asyncio.html)

---

## Contributing

1. Follow PEP 8 style guide
2. Add type hints to all functions
3. Document new endpoints in this README
4. Test thoroughly before committing
5. Keep dependencies minimal

---

## Need Help?

- Check the interactive API docs: http://localhost:8000/docs
- Review Qiskit documentation for quantum-specific questions
- Ask hackathon mentors for guidance
- Check the main README: `../README.md`
- Check frontend README: `../frontend/README.md`

---

**Build amazing quantum features!** The backend is ready to support your innovations.
