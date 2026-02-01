from typing import Any, Dict, List, Optional, Tuple


def _has_classical_read(gate: Dict[str, Any]) -> bool:
    params = gate.get("params") or {}
    if isinstance(params, dict):
        if params.get("condition") is not None:
            return True
        if params.get("reads_classical"):
            return True
    return False


def calculate_cosmic_metrics(
    gates: List[Dict[str, Any]],
    approach: str = "occurrences",
    num_qubits: Optional[int] = None,
) -> Dict[str, Any]:
    approach_norm = (approach or "occurrences").strip().lower()
    if approach_norm not in {"occurrences", "types", "q-cosmic"}:
        raise ValueError(f"Unsupported COSMIC approach: {approach}")
    if approach_norm == "types":
        return _calculate_types_metrics(gates, num_qubits)
    if approach_norm == "q-cosmic":
        return _calculate_q_cosmic_metrics(gates, num_qubits)

    functional_processes: List[Dict[str, Any]] = []
    entries = exits = reads = writes = 0

    for idx, gate in enumerate(gates):
        gate_type = str(gate.get("type") or "unknown")
        fp_entries = 1
        fp_exits = 1
        fp_reads = 1 if _has_classical_read(gate) else 0
        fp_writes = 1 if gate_type == "measure" else 0
        fp_cfp = fp_entries + fp_exits + fp_reads + fp_writes

        entries += fp_entries
        exits += fp_exits
        reads += fp_reads
        writes += fp_writes

        functional_processes.append(
            {
                "name": f"{gate_type}-{idx}",
                "gate_type": gate_type,
                "entries": fp_entries,
                "exits": fp_exits,
                "reads": fp_reads,
                "writes": fp_writes,
                "cfp": fp_cfp,
            }
        )

    total_cfp = entries + exits + reads + writes
    return {
        "approach": approach_norm,
        "entries": entries,
        "exits": exits,
        "reads": reads,
        "writes": writes,
        "total_cfp": total_cfp,
        "functional_processes": functional_processes,
    }


def _gate_qubit_count(gate: Dict[str, Any]) -> int:
    qubits = set()
    if gate.get("qubit") is not None:
        qubits.add(gate["qubit"])
    for t in gate.get("targets") or []:
        qubits.add(t)
    for c in gate.get("controls") or []:
        qubits.add(c)
    return len(qubits) if qubits else 1


def _calculate_types_metrics(gates: List[Dict[str, Any]], num_qubits: Optional[int]) -> Dict[str, Any]:
    functional_processes: List[Dict[str, Any]] = []
    entries = exits = reads = writes = 0

    input_fp_count = sum(1 for gate in gates if gate.get("type") == "input")
    if input_fp_count == 0 and num_qubits and num_qubits > 0:
        input_fp_count = 1

    if input_fp_count > 0:
        fp = {
            "name": "input",
            "gate_type": "input",
            "entries": input_fp_count,
            "exits": 0,
            "reads": 0,
            "writes": input_fp_count,
            "cfp": 2 * input_fp_count,
        }
        functional_processes.append(fp)
        entries += fp["entries"]
        writes += fp["writes"]

    gate_groups: Dict[Tuple[str, int], int] = {}
    measurement_count = 0
    for gate in gates:
        gtype = str(gate.get("type") or "unknown")
        if gtype == "input":
            continue
        if gtype == "measure":
            measurement_count += 1
            continue
        arity = _gate_qubit_count(gate)
        gate_groups[(gtype, arity)] = gate_groups.get((gtype, arity), 0) + 1

    for (gtype, arity), _count in gate_groups.items():
        fp_entries = 1
        fp_reads = arity
        fp_writes = arity
        fp_exits = 0
        fp_cfp = fp_entries + fp_reads + fp_writes + fp_exits
        functional_processes.append(
            {
                "name": f"{gtype}:{arity}",
                "gate_type": gtype,
                "entries": fp_entries,
                "exits": fp_exits,
                "reads": fp_reads,
                "writes": fp_writes,
                "cfp": fp_cfp,
            }
        )
        entries += fp_entries
        reads += fp_reads
        writes += fp_writes

    if measurement_count > 0:
        fp_entries = 1
        fp_reads = 1
        fp_writes = 1
        fp_exits = 0
        fp_cfp = fp_entries + fp_reads + fp_writes + fp_exits
        functional_processes.append(
            {
                "name": "measurement",
                "gate_type": "measure",
                "entries": fp_entries,
                "exits": fp_exits,
                "reads": fp_reads,
                "writes": fp_writes,
                "cfp": fp_cfp,
            }
        )
        entries += fp_entries
        reads += fp_reads
        writes += fp_writes

    total_cfp = entries + exits + reads + writes
    return {
        "approach": "types",
        "entries": entries,
        "exits": exits,
        "reads": reads,
        "writes": writes,
        "total_cfp": total_cfp,
        "functional_processes": functional_processes,
    }


def _calculate_q_cosmic_metrics(gates: List[Dict[str, Any]], num_qubits: Optional[int]) -> Dict[str, Any]:
    measurement_count = sum(1 for g in gates if g.get("type") == "measure")
    entries = int(num_qubits or 0)
    exits = measurement_count
    reads = 0
    writes = 0
    total_cfp = entries + exits
    functional_processes = [
        {
            "name": "quantum-system",
            "gate_type": "q-cosmic",
            "entries": entries,
            "exits": exits,
            "reads": reads,
            "writes": writes,
            "cfp": total_cfp,
        }
    ]
    return {
        "approach": "q-cosmic",
        "entries": entries,
        "exits": exits,
        "reads": reads,
        "writes": writes,
        "total_cfp": total_cfp,
        "functional_processes": functional_processes,
    }
