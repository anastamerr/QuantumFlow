from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from qiskit import QuantumCircuit
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import json

from .models import (
    ExecuteRequest,
    ExecuteResponse,
    PuzzleValidationRequest,
    PuzzleValidationResponse,
    PuzzlesResponse,
)
from .qiskit_runner import run_circuit
from .puzzle import check_solution, get_puzzles, validate_gate_usage
from typing import Any, Dict, List

load_dotenv()

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Request/Response models for AI chatbot
class Question(BaseModel):
    question: str


class Answer(BaseModel):
    answer: str


class InterpretRequest(BaseModel):
    question: str


class InterpretResponse(BaseModel):
    actions: List[Dict[str, Any]]


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


@app.post("/ask", response_model=Answer)
async def ask_question(data: Question):
    """
    AI chatbot endpoint - answers quantum computing questions using Gemini
    """
    try:
        if not data.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        # Check if Gemini API key is configured
        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(
                status_code=500,
                detail="Gemini API key not configured. Please set GEMINI_API_KEY environment variable.",
            )

        # Import and use LangChain with Gemini
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        # Initialize Gemini
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY"),
        )

        # System prompt
        system_prompt = """You are an expert quantum computing assistant with deep knowledge of:
                    - Quantum mechanics fundamentals (superposition, entanglement, measurement)
                    - Quantum gates (Hadamard, CNOT, Pauli gates, rotation gates)
                    - Quantum algorithms (Shor's, Grover's, VQE, QAOA)
                    - Qiskit programming and circuit design
                    - Quantum error correction and noise
                    - Current quantum hardware and limitations

                    Provide clear, accurate, and educational explanations. Use analogies when helpful.
                    Keep responses concise but comprehensive. Use mathematical notation when appropriate.
                    If asked about code, provide Qiskit examples."""

        # Create chain
        prompt_template = ChatPromptTemplate.from_messages(
            [("system", system_prompt), ("human", "{question}")]
        )
        chain = prompt_template | llm | StrOutputParser()

        # Get response
        answer = await chain.ainvoke({"question": data.question})

        return Answer(answer=answer)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")


@app.post("/api/v1/interpret-actions", response_model=InterpretResponse)
async def interpret_actions(req: InterpretRequest):
    """
    Ask the LLM to convert a natural language instruction into a strict JSON array
    of actions. The model MUST return only JSON array. Example:
    [
      {"type":"addGate","payload":{"type":"h","qubit":0,"position":0}},
      {"type":"removeQubit","payload":{"index":2}}
    ]
    """
    try:
        if not req.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(status_code=500, detail="Gemini API key not configured.")

        # Build a strict system prompt asking for JSON only
        system_prompt = """
You are a strict assistant that converts user instructions into a JSON array of actions.
Return only valid JSON — nothing else. Each array element must be an object with:
 - type: one of addQubit, removeQubit, addGate, addGates, updateGate, removeGate, clearCircuit
 - payload: an object containing parameters for the action

Example:
[
  {"type":"addGate","payload":{"type":"h","qubit":0,"position":0}},
  {"type":"removeQubit","payload":{"index":2}}
]

If the instruction does not map to any allowed action, return an empty array [].
"""

        # Use the same LLM path as /ask but ensure instruction to output JSON only
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.0,
            google_api_key=os.getenv("GEMINI_API_KEY"),
        )

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{question}")
        ])
        chain = prompt_template | llm | StrOutputParser()

        answer = await chain.ainvoke({"question": req.question})

        # Parse JSON from the model output
        try:
            parsed = json.loads(answer)
            if not isinstance(parsed, list):
                raise ValueError("Parsed JSON is not an array")
        except Exception as e:
            # Attempt to extract JSON substring as a safety-net
            import re
            m = re.search(r"(\[.*\])", answer, flags=re.S)
            if m:
                parsed = json.loads(m.group(1))
            else:
                raise HTTPException(status_code=500, detail=f"Failed to parse model JSON output: {str(e)}")

        # Basic validation: ensure each item is an object with 'type'
        filtered: List[Dict[str, Any]] = []
        allowed_types = {"addQubit","removeQubit","addGate","addGates","updateGate","removeGate","clearCircuit"}
        for item in parsed:
            if isinstance(item, dict) and "type" in item and item["type"] in allowed_types:
                filtered.append(item)

        return InterpretResponse(actions=filtered)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interpretation error: {str(e)}")


@app.get("/api/v1/puzzles", response_model=PuzzlesResponse)
def get_all_puzzles() -> PuzzlesResponse:
    """
    Retrieve all quantum puzzles
    """
    try:
        puzzles = get_puzzles()
        return PuzzlesResponse(puzzles=puzzles, total=len(puzzles))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving puzzles: {str(e)}")


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
        # Try to find the puzzle by target_label so constraints can be applied
        puzzle_id = None
        for p in get_puzzles():
            if p.get("targetMatrix") == req.target_label:
                puzzle_id = p.get("id")
                break

        # Validate gate usage against puzzle constraints if we found a matching puzzle
        if puzzle_id is not None:
            # req.gates are pydantic GateModel instances; convert to dicts for validation
            gate_dicts = [g.model_dump() for g in req.gates]
            valid, reason = validate_gate_usage(gate_dicts, puzzle_id)
            if not valid:
                raise HTTPException(status_code=400, detail=f"Gate constraints violated: {reason}")

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
            status="success",
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
