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


# Added By Entropix ;)
class SnapshotModel(BaseModel):
    step: int
    probabilities: Dict[str, float]
    entanglement: Optional[List[List[float]]] = None
    impact: Optional[float] = None

class SnapshotsRequest(BaseModel):
    num_qubits: int
    gates: List[GateModel]           
    mode: Optional[str] = "statevector"
    shots: Optional[int] = 1024
    computeEntanglement: Optional[bool] = True
    computeImpacts: Optional[bool] = True

class SnapshotsResponse(BaseModel):
    snapshots: List[SnapshotModel]