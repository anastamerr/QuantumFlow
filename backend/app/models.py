from typing import Dict, List, Optional, Union
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


class OptimizeRequest(BaseModel):
    num_qubits: int = Field(..., ge=1, description="Number of qubits in the circuit")
    gates: List[GateModel]


class OptimizeResponse(BaseModel):
    num_qubits: int
    gates: List[GateModel]
