from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from typing import List
from pydantic import BaseModel

from .models import ExecuteRequest, ExecuteResponse
from .qiskit_runner import run_circuit, get_state_evolution


load_dotenv()

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# --- New Model for Task (f) ---
class EvolutionResponse(BaseModel):
    status: str = "success"
    intermediateStates: List[List[str]]


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

@app.post("/api/v1/execute-evolution", response_model=EvolutionResponse)
def execute_evolution(req: ExecuteRequest) -> EvolutionResponse:
    """
    New endpoint for hackathon Task (f).
    Calculates intermediate statevectors.
    """
    try:
        # Call the new function from qiskit_runner.py
        result = get_state_evolution(
            num_qubits=req.num_qubits,
            gates=[g.model_dump() for g in req.gates],
        )
        
        # The result is {"intermediateStates": [...]}.
        # We add the "status" field to match our EvolutionResponse model.
        return EvolutionResponse(status="success", **result)
    
    except Exception as e:
        # Re-use the existing error handling
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    # This line MUST be indented
    uvicorn.run(app, host=HOST, port=PORT)