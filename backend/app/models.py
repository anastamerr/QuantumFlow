from typing import Dict, List, Optional, Union, Literal
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


# AI assistant action models
class AddGateAction(BaseModel):
    type: Literal["add_gate"] = "add_gate"
    gate: GateModel


class RemoveGateAction(BaseModel):
    type: Literal["remove_gate"] = "remove_gate"
    id: str


class UpdateGateAction(BaseModel):
    type: Literal["update_gate"] = "update_gate"
    id: str
    updates: Dict[str, Union[int, float, str, list, dict]]


class AddQubitAction(BaseModel):
    type: Literal["add_qubit"] = "add_qubit"


class RemoveQubitAction(BaseModel):
    type: Literal["remove_qubit"] = "remove_qubit"
    id: int


class ImportCircuitAction(BaseModel):
    type: Literal["import_circuit"] = "import_circuit"
    circuit: Dict


class AddGatesAction(BaseModel):
    type: Literal["add_gates"] = "add_gates"
    gates: List[GateModel]


AIAction = Union[
    AddGateAction,
    RemoveGateAction,
    UpdateGateAction,
    AddQubitAction,
    RemoveQubitAction,
    ImportCircuitAction,
    AddGatesAction,
]


class AIResponse(BaseModel):
    assistant_text: str
    actions: List[AIAction] = []
    # Optionally include a suggested circuit state (qubits/gates) the assistant recommends
    qubits: Optional[List[Dict]] = None
    gates: Optional[List[GateModel]] = None
