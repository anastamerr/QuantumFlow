from typing import Any, Dict, List


def _gate_qubit_count(gate: Dict[str, Any]) -> int:
    qubits = set()
    if gate.get("qubit") is not None:
        qubits.add(gate["qubit"])
    for t in gate.get("targets") or []:
        qubits.add(t)
    for c in gate.get("controls") or []:
        qubits.add(c)
    return len(qubits)


def calculate_hardware_metrics(num_qubits: int, gates: List[Dict[str, Any]]) -> Dict[str, Any]:
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
        gtype = str(gate.get("type") or "unknown")
        gate_count[gtype] = gate_count.get(gtype, 0) + 1

        if gtype in {"cnot", "cx"}:
            cnot_count += 1
        if gtype == "measure":
            measurement_count += 1
        if gtype == "t":
            pos = gate.get("position")
            if isinstance(pos, int):
                t_positions.add(pos)

        pos = gate.get("position")
        if isinstance(pos, int):
            max_position = max(max_position, pos)

        if gtype != "measure":
            qubit_count = _gate_qubit_count(gate)
            if qubit_count <= 1:
                single_qubit += 1
            elif qubit_count == 2:
                two_qubit += 1
                entangling_gate_count += 1
                if isinstance(pos, int):
                    entangling_positions.add(pos)
            else:
                multi_qubit += 1
                entangling_gate_count += 1
                if isinstance(pos, int):
                    entangling_positions.add(pos)

    circuit_depth = max_position + 1 if max_position >= 0 else 0
    t_count = gate_count.get("t", 0)
    non_measure_gate_count = max((single_qubit + two_qubit + multi_qubit), 1)
    entanglement_ratio = entangling_gate_count / non_measure_gate_count
    entanglement_depth = len(entangling_positions)
    qv_qubits = min(int(num_qubits), int(circuit_depth)) if num_qubits and circuit_depth else 0
    quantum_volume = 2 ** qv_qubits if qv_qubits > 0 else 0

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
    }
