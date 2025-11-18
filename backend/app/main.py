from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .models import (
    ExecuteRequest, ExecuteResponse,
    ChatRequest, ChatResponse,
    QMLTrainRequest, QMLTrainResponse,
    QMLEvaluateRequest, QMLEvaluateResponse,
    QMLTemplatesResponse, DataEncodingRequest, DataEncodingResponse,
    GateModel
)
from .qiskit_runner import run_circuit
from .gemini_service import get_gemini_service
from .qml_runner import train_qnn, evaluate_qnn
from .qml_templates import (
    get_qml_templates,
    create_angle_encoding_circuit,
    create_amplitude_encoding_circuit
)


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


@app.post("/api/v1/chat/generate-circuit", response_model=ChatResponse)
def generate_circuit_from_chat(req: ChatRequest) -> ChatResponse:
    """Generate quantum circuit from natural language with educational guidance."""
    try:
        gemini = get_gemini_service()
        if not gemini.available:
            # Use fallback educational responses
            from .gemini_service_v2 import EducationalGeminiService
            fallback = EducationalGeminiService()
            result = fallback.chat_with_circuit_context(
                req.message,
                req.current_circuit,
                req.conversation_history
            )
        else:
            # Use full Gemini service with circuit awareness
            from .gemini_service_v2 import EducationalGeminiService
            edu_service = EducationalGeminiService()
            result = edu_service.chat_with_circuit_context(
                req.message,
                req.current_circuit,
                req.conversation_history
            )
        
        return ChatResponse(
            response=result.get("response", "Let me help you!"),
            gates=[GateModel(**g) for g in result.get("gates", [])],
            explanation=result.get("explanation", ""),
            teaching_note=result.get("teaching_note"),
            next_suggestions=result.get("next_suggestions", []),
            warnings=result.get("warnings"),
            praise=result.get("praise"),
            num_qubits=req.num_qubits,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/qml/train", response_model=QMLTrainResponse)
def train_qml_model(req: QMLTrainRequest) -> QMLTrainResponse:
    """Train a quantum machine learning model."""
    try:
        result = train_qnn(
            train_data=req.train_data,
            train_labels=req.train_labels,
            num_qubits=req.num_qubits,
            num_layers=req.num_layers,
            encoding=req.encoding,
            learning_rate=req.learning_rate,
            epochs=req.epochs,
            shots=req.shots,
            cost_fn=req.cost_function
        )
        return QMLTrainResponse(**result, status="success")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/qml/evaluate", response_model=QMLEvaluateResponse)
def evaluate_qml_model(req: QMLEvaluateRequest) -> QMLEvaluateResponse:
    """Evaluate a trained QML model on test data."""
    try:
        result = evaluate_qnn(
            test_data=req.test_data,
            test_labels=req.test_labels,
            parameters=req.parameters,
            num_qubits=req.num_qubits,
            num_layers=req.num_layers,
            encoding=req.encoding,
            shots=req.shots
        )
        return QMLEvaluateResponse(**result, status="success")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/qml/templates", response_model=QMLTemplatesResponse)
def get_qml_template_list() -> QMLTemplatesResponse:
    """Get list of available QML circuit templates."""
    try:
        templates = get_qml_templates()
        return QMLTemplatesResponse(**templates, status="success")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/qml/encode-data", response_model=DataEncodingResponse)
def encode_data_to_circuit(req: DataEncodingRequest) -> DataEncodingResponse:
    """Encode classical data into quantum circuit."""
    try:
        if req.encoding == "angle":
            gates = create_angle_encoding_circuit(req.data_point, req.num_qubits)
        else:
            gates = create_amplitude_encoding_circuit(req.data_point, req.num_qubits)
        
        return DataEncodingResponse(
            gates=[GateModel(**g) for g in gates],
            encoding_method=req.encoding,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
