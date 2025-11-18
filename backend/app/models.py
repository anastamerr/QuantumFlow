from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field


class GateModel(BaseModel):
    id: Optional[str] = None
    type: str
    qubit: Optional[int] = None
    position: Optional[int] = None
    params: Optional[Dict[str, Union[float, int, str]]] = None
    targets: Optional[List[int]] = None
    controls: Optional[List[int]] = None


class ExecuteRequest(BaseModel):
    num_qubits: int = Field(..., ge=1, description="Number of qubits in the circuit")
    gates: List[GateModel]
    shots: int = Field(1024, ge=1, le=1_000_000)
    memory: bool = Field(default=False)
    backend: Optional[str] = Field(default=None, description="Override backend name")


class ExecuteResponse(BaseModel):
    backend: str
    shots: int
    counts: Dict[str, int]
    probabilities: Dict[str, float]
    memory: Optional[List[str]] = None
    status: str = "success"


# AI Chat models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's message")
    num_qubits: int = Field(2, ge=1, le=10, description="Number of qubits for circuit")
    current_circuit: Optional[Dict[str, Any]] = Field(None, description="Current circuit state for context")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous messages")


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI's friendly response")
    gates: List[GateModel] = Field(default=[], description="Gates to add (if any)")
    explanation: str = Field(..., description="Educational explanation")
    teaching_note: Optional[str] = Field(None, description="Fun fact or learning moment")
    next_suggestions: List[str] = Field(default=[], description="What to try next")
    warnings: Optional[List[str]] = Field(None, description="Validation warnings")
    praise: Optional[str] = Field(None, description="Encouraging feedback")
    num_qubits: int = Field(default=2)
    status: str = "success"


# QML models
class QMLTrainRequest(BaseModel):
    train_data: List[List[float]] = Field(..., description="Training data points")
    train_labels: List[float] = Field(..., description="Training labels")
    num_qubits: int = Field(2, ge=1, le=10)
    num_layers: int = Field(2, ge=1, le=5)
    encoding: str = Field("angle", pattern="^(angle|amplitude)$")
    learning_rate: float = Field(0.01, gt=0, le=1)
    epochs: int = Field(10, ge=1, le=100)
    shots: int = Field(1024, ge=1, le=10000)
    cost_function: str = Field("mse", pattern="^(mse|cross_entropy)$")


class QMLTrainResponse(BaseModel):
    parameters: List[float]
    final_loss: float
    history: Dict[str, List]
    num_params: int
    epochs_completed: int
    status: str = "success"


class QMLEvaluateRequest(BaseModel):
    test_data: List[List[float]]
    test_labels: List[float]
    parameters: List[float]
    num_qubits: int = Field(2, ge=1, le=10)
    num_layers: int = Field(2, ge=1, le=5)
    encoding: str = Field("angle", pattern="^(angle|amplitude)$")
    shots: int = Field(1024, ge=1, le=10000)


class QMLEvaluateResponse(BaseModel):
    accuracy: float
    mse: float
    predictions: List[float]
    confusion_matrix: Dict[str, int]
    status: str = "success"


class QMLTemplatesResponse(BaseModel):
    templates: List[Dict[str, Any]]
    status: str = "success"


class DataEncodingRequest(BaseModel):
    data_point: List[float]
    num_qubits: int = Field(2, ge=1, le=10)
    encoding: str = Field("angle", pattern="^(angle|amplitude)$")


class DataEncodingResponse(BaseModel):
    gates: List[GateModel]
    encoding_method: str
    status: str = "success"
