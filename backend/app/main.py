from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Added by Entropix ;)
from .models import (
    ExecuteRequest,
    ExecuteResponse,
    SnapshotsRequest,
    SnapshotsResponse,
)
from .qiskit_runner import run_circuit, run_circuit_snapshots


load_dotenv()

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(title="QuantumFlow Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    # Check Qiskit availability and env config
    qiskit_ok = True
    try:
        import qiskit  # noqa: F401
    except Exception:
        qiskit_ok = False
    return {
        "status": "ok",
        "qiskit": qiskit_ok,
        "backend_env": os.getenv("QISKIT_BACKEND", "aer_simulator"),
    }


@app.post("/api/v1/execute", response_model=ExecuteResponse)
def execute(req: ExecuteRequest) -> ExecuteResponse:
    try:
        result = run_circuit(
            num_qubits=req.num_qubits,
            gates=[g.model_dump() for g in req.gates],
            shots=req.shots,
            memory=req.memory,
            override_backend=req.backend,
        )
        return ExecuteResponse(**result, status="success")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# Added by Entropix ;)
@app.post("/api/v1/snapshots", response_model=SnapshotsResponse)
def snapshots_endpoint(req: SnapshotsRequest) -> SnapshotsResponse:
    try:
        result = run_circuit_snapshots(
            num_qubits=req.num_qubits,
            gates=[g.model_dump() for g in req.gates],
            mode=req.mode or "statevector",
            shots=req.shots or 1024,
            compute_entanglement=bool(req.computeEntanglement),
            compute_impacts=bool(req.computeImpacts),
        )
        return SnapshotsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
