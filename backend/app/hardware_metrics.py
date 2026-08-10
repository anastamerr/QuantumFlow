import os
from typing import Any, Dict, List

try:
    from ._native import analyze_hardware_metrics as _native_analyze_hardware_metrics
except (ImportError, OSError):
    _native_analyze_hardware_metrics = None


def native_analyzer_available() -> bool:
    """Return whether the optional C++ analyzer was built for this platform."""
    return _native_analyze_hardware_metrics is not None


def _gate_qubit_count(gate: Dict[str, Any]) -> int:
    qubits = set()
    if gate.get("qubit") is not None:
        qubits.add(gate["qubit"])
    for target in gate.get("targets") or []:
        qubits.add(target)
    for control in gate.get("controls") or []:
        qubits.add(control)
    return len(qubits)


def _calculate_hardware_metrics_python(
    num_qubits: int, gates: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Reference implementation and fallback for unsupported native platforms."""
    gate_count: Dict[str, int] = {}
    t_positions = set()
    cnot_count = 0
    measurement_count = 0
    single_qubit = 0
    two_qubit = 0
    multi_qubit = 0
    entangling_positions = set()
    entangling_gate_count = 0

    max_position = -1
    for gate in gates:
        gate_type = str(gate.get("type") or "unknown")
        gate_count[gate_type] = gate_count.get(gate_type, 0) + 1

        if gate_type in {"cnot", "cx"}:
            cnot_count += 1
        if gate_type == "measure":
            measurement_count += 1
        if gate_type == "t":
            position = gate.get("position")
            if isinstance(position, int):
                t_positions.add(position)

        position = gate.get("position")
        if isinstance(position, int):
            max_position = max(max_position, position)

        if gate_type != "measure":
            qubit_count = _gate_qubit_count(gate)
            if qubit_count <= 1:
                single_qubit += 1
            elif qubit_count == 2:
                two_qubit += 1
                entangling_gate_count += 1
                if isinstance(position, int):
                    entangling_positions.add(position)
            else:
                multi_qubit += 1
                entangling_gate_count += 1
                if isinstance(position, int):
                    entangling_positions.add(position)

    circuit_depth = max_position + 1 if max_position >= 0 else 0
    t_count = gate_count.get("t", 0)
    non_measure_gate_count = max(single_qubit + two_qubit + multi_qubit, 1)
    entanglement_ratio = entangling_gate_count / non_measure_gate_count
    entanglement_depth = len(entangling_positions)
    qv_qubits = min(int(num_qubits), int(circuit_depth)) if num_qubits and circuit_depth else 0
    quantum_volume = 2**qv_qubits if qv_qubits > 0 else 0

    return {
        "circuit_depth": circuit_depth,
        "circuit_width": int(num_qubits),
        "gate_count": gate_count,
        "t_count": t_count,
        "t_depth": len(t_positions),
        "cnot_count": cnot_count,
        "single_qubit_gates": single_qubit,
        "two_qubit_gates": two_qubit,
        "multi_qubit_gates": multi_qubit,
        "measurement_count": measurement_count,
        "entanglement_ratio": entanglement_ratio,
        "entanglement_depth": entanglement_depth,
        "quantum_volume": quantum_volume,
        "estimated_fidelity": None,
        "analyzer_engine": "python",
    }


def calculate_hardware_metrics(
    num_qubits: int, gates: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Analyze a circuit with the C++ engine when available, otherwise use Python."""
    engine = os.getenv("QUANTUMFLOW_METRICS_ENGINE", "auto").strip().lower()
    if engine not in {"auto", "cpp", "python"}:
        raise ValueError("QUANTUMFLOW_METRICS_ENGINE must be auto, cpp, or python")

    if engine != "python" and _native_analyze_hardware_metrics is not None:
        return _native_analyze_hardware_metrics(int(num_qubits), gates)

    if engine == "cpp" and _native_analyze_hardware_metrics is None:
        raise RuntimeError(
            "C++ hardware-metrics analyzer is unavailable; build backend/native first"
        )

    return _calculate_hardware_metrics_python(num_qubits, gates)
