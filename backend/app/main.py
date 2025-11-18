from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from qiskit import QuantumCircuit

from .models import ExecuteRequest, ExecuteResponse, PuzzleValidationRequest, PuzzleValidationResponse
from .qiskit_runner import run_circuit
from .puzzle import check_solution

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
    qiskit_ok = True
    try:
        import qiskit
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

@app.post("/api/v1/validate-puzzle", response_model=PuzzleValidationResponse)
def validate_puzzle(req: PuzzleValidationRequest) -> PuzzleValidationResponse:
    try:
        qc = QuantumCircuit(req.num_qubits)
        sorted_gates = sorted(req.gates, key=lambda g: g.position if g.position is not None else 0)
        
        for gate in sorted_gates:
            gate_dict = gate.model_dump()
            gtype = gate_dict.get("type")
            qubit = gate_dict.get("qubit")
            params = gate_dict.get("params") or {}
            targets = list(gate_dict.get("targets") or [])
            controls = list(gate_dict.get("controls") or [])
            
            if gtype == "h":
                qc.h(qubit)
            elif gtype == "x":
                qc.x(qubit)
            elif gtype == "y":
                qc.y(qubit)
            elif gtype == "z":
                qc.z(qubit)
            elif gtype == "s":
                qc.s(qubit)
            elif gtype == "t":
                qc.t(qubit)
            elif gtype == "rx":
                angle = float(params.get("theta") or params.get("angle") or 0)
                qc.rx(angle, qubit)
            elif gtype == "ry":
                angle = float(params.get("theta") or params.get("angle") or 0)
                qc.ry(angle, qubit)
            elif gtype == "rz":
                angle = float(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
                qc.rz(angle, qubit)
            elif gtype == "p":
                angle = float(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
                qc.p(angle, qubit)
            elif gtype in ("cnot", "cx"):
                control = qubit if qubit is not None else (controls[0] if controls else None)
                target = targets[0] if targets else None
                if control is not None and target is not None:
                    qc.cx(control, target)
            elif gtype == "cz":
                control = qubit if qubit is not None else (controls[0] if controls else None)
                target = targets[0] if targets else None
                if control is not None and target is not None:
                    qc.cz(control, target)
            elif gtype == "swap":
                q1 = qubit if qubit is not None else (targets[0] if targets else None)
                q2 = targets[0] if targets else (controls[0] if controls else None)
                if q1 is not None and q2 is not None:
                    qc.swap(q1, q2)
            elif gtype in ("toffoli", "ccx"):
                if len(controls) >= 2 and len(targets) >= 1:
                    qc.ccx(controls[0], controls[1], targets[0])
        
        is_correct = check_solution(qc, req.target_label)
        return PuzzleValidationResponse(
            is_correct=is_correct,
            message="Your circuit matches the target!" if is_correct else "Your circuit does not match the target.",
            status="success"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
