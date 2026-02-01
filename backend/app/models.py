from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class GateModel(BaseModel):
    id: Optional[str] = None
    type: str
    qubit: Optional[int] = None
    position: Optional[int] = None
    params: Optional[Dict[str, Any]] = None
    targets: Optional[List[int]] = None
    controls: Optional[List[int]] = None


class MeasurementConfig(BaseModel):
    basis: str = Field(default="z", description="Measurement basis: 'z', 'x', 'y'")
    qubits: Optional[List[int]] = Field(default=None, description="Qubits to measure")
    classical_bits: Optional[List[int]] = Field(default=None, description="Classical bits to store results")
    reset_after: bool = Field(default=False, description="Reset qubits after measurement")
    mid_circuit: bool = Field(default=False, description="Apply measurement mid-circuit if supported")


class ExecuteRequest(BaseModel):
    num_qubits: int = Field(..., ge=1, description="Number of qubits in the circuit")
    gates: List[GateModel]
    method: str = Field(
        default="qasm",
        description="Simulation method: 'qasm' (shot-based), 'statevector' (exact), or 'noisy' (shot-based with noise)",
    )
    shots: int = Field(1024, ge=1, le=1_000_000)
    memory: bool = Field(default=False)
    backend: Optional[str] = Field(default=None, description="Override backend name")
    include_metrics: bool = Field(default=False, description="Include COSMIC + hardware metrics")
    cosmic_approach: Optional[str] = Field(
        default=None,
        description="COSMIC approach: 'occurrences', 'types', or 'q-cosmic'",
    )
    measurement_config: Optional[MeasurementConfig] = None


class MetricsRequest(BaseModel):
    num_qubits: int = Field(..., ge=1, description="Number of qubits in the circuit")
    gates: List[GateModel]
    cosmic_approach: Optional[str] = Field(
        default=None,
        description="COSMIC approach: 'occurrences', 'types', or 'q-cosmic'",
    )


class FunctionalProcess(BaseModel):
    name: str
    gate_type: str
    entries: int
    exits: int
    reads: int
    writes: int
    cfp: int


class COSMICMetrics(BaseModel):
    approach: str
    entries: int
    exits: int
    reads: int
    writes: int
    total_cfp: int
    functional_processes: List[FunctionalProcess]


class HardwareMetrics(BaseModel):
    circuit_depth: int
    circuit_width: int
    gate_count: Dict[str, int]
    t_count: int
    t_depth: int
    cnot_count: int
    single_qubit_gates: int
    two_qubit_gates: int
    multi_qubit_gates: int
    measurement_count: int
    entanglement_ratio: Optional[float] = None
    entanglement_depth: Optional[int] = None
    quantum_volume: Optional[int] = None
    estimated_fidelity: Optional[float] = None


class ExecuteResponse(BaseModel):
    backend: str
    method: Optional[str] = None
    shots: int
    counts: Dict[str, int]
    probabilities: Dict[str, float]
    statevector: Optional[Dict[str, List[float]]] = None
    warnings: Optional[List[str]] = None
    memory: Optional[List[str]] = None
    measurement_basis: Optional[Dict[int, str]] = None
    per_qubit_probabilities: Optional[Dict[int, Dict[str, float]]] = None
    cosmic_metrics: Optional[COSMICMetrics] = None
    hardware_metrics: Optional[HardwareMetrics] = None
    confidence_intervals: Optional[Dict[str, List[float]]] = None
    status: str = "success"
