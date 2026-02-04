from typing import Any, Dict, List, Optional, Tuple, Iterable


def _classical_read_count(gate: Dict[str, Any]) -> int:
    params = gate.get("params") or {}
    if not isinstance(params, dict):
        return 0

    count = 0
    condition = params.get("condition") if "condition" in params else params.get("c_if")
    if condition is not None:
        bits = None
        if isinstance(condition, dict):
            bits = condition.get("bits")
        if isinstance(bits, int):
            count += 1
        elif isinstance(bits, (list, tuple, set)):
            count += len(bits)
        else:
            # Condition on full register counts as a single read
            count += 1

    extra_reads = params.get("reads_classical")
    if extra_reads:
        if isinstance(extra_reads, int):
            count += extra_reads
        elif isinstance(extra_reads, (list, tuple, set)):
            count += len(extra_reads)
        else:
            # Avoid double counting when condition already accounted for
            if count == 0:
                count += 1

    return count


def _gate_qubits(gate: Dict[str, Any]) -> List[int]:
    qubits: List[int] = []
    if gate.get("qubit") is not None:
        qubits.append(int(gate["qubit"]))
    for target in gate.get("targets") or []:
        qubits.append(int(target))
    for control in gate.get("controls") or []:
        qubits.append(int(control))
    # Preserve stable ordering by sorting unique values
    return sorted({q for q in qubits if q is not None})


def _gate_qubit_count(gate: Dict[str, Any]) -> int:
    qubits = _gate_qubits(gate)
    return len(qubits) if qubits else 1


def _normalize_vector(values: Iterable[Any]) -> List[int]:
    normalized: List[int] = []
    for value in values:
        try:
            normalized.append(int(value))
        except Exception:
            continue
    return sorted(set(q for q in normalized if q >= 0))


def _dedupe_vectors(vectors: List[List[int]]) -> List[List[int]]:
    seen = set()
    deduped: List[List[int]] = []
    for vec in vectors:
        key = tuple(vec)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(vec)
    return deduped


def _infer_qubits_from_gates(gates: List[Dict[str, Any]], num_qubits: Optional[int]) -> List[int]:
    if num_qubits is not None and num_qubits > 0:
        return list(range(int(num_qubits)))
    qubits: List[int] = []
    for gate in gates:
        qubits.extend(_gate_qubits(gate))
    return sorted(set(qubits))


def _resolve_input_vectors(
    gates: List[Dict[str, Any]],
    num_qubits: Optional[int],
    input_vectors: Optional[List[List[int]]],
) -> Tuple[List[List[int]], int]:
    if input_vectors is not None:
        normalized = [_normalize_vector(v) for v in input_vectors]
        normalized = [v for v in normalized if v]
        return _dedupe_vectors(normalized), 0

    vectors: List[List[int]] = []
    placeholder_count = 0
    for gate in gates:
        if str(gate.get("type") or "").lower() != "input":
            continue
        params = gate.get("params") or {}
        vec = None
        if isinstance(params, dict):
            vec = params.get("qubits") or params.get("vector") or params.get("register")
        if vec is None:
            placeholder_count += 1
            continue
        if isinstance(vec, (list, tuple, set)):
            normalized = _normalize_vector(vec)
            if normalized:
                vectors.append(normalized)
        elif isinstance(vec, int):
            vectors.append([int(vec)])

    if vectors or placeholder_count:
        return _dedupe_vectors(vectors), placeholder_count

    inferred = _infer_qubits_from_gates(gates, num_qubits)
    if inferred:
        return [inferred], 0
    return [], 0


def _resolve_measurement_vectors(
    gates: List[Dict[str, Any]],
    input_vectors: List[List[int]],
    measurement_vectors: Optional[List[List[int]]],
) -> List[List[int]]:
    if measurement_vectors is not None:
        normalized = [_normalize_vector(v) for v in measurement_vectors]
        normalized = [v for v in normalized if v]
        return _dedupe_vectors(normalized)

    has_measure = any(str(g.get("type") or "").lower() == "measure" for g in gates)
    if not has_measure:
        return []

    if input_vectors:
        return input_vectors

    # Fallback: count a single measurement functional process
    return [[]]


def calculate_cosmic_metrics(
    gates: List[Dict[str, Any]],
    approach: str = "occurrences",
    num_qubits: Optional[int] = None,
    input_vectors: Optional[List[List[int]]] = None,
    measurement_vectors: Optional[List[List[int]]] = None,
) -> Dict[str, Any]:
    approach_norm = (approach or "occurrences").strip().lower()
    if approach_norm not in {"occurrences", "types", "q-cosmic"}:
        raise ValueError(f"Unsupported COSMIC approach: {approach}")
    if approach_norm == "types":
        return _calculate_types_metrics(gates, num_qubits, input_vectors, measurement_vectors)
    if approach_norm == "q-cosmic":
        return _calculate_q_cosmic_metrics(gates, num_qubits, input_vectors, measurement_vectors)

    functional_processes: List[Dict[str, Any]] = []
    entries = exits = reads = writes = 0

    for idx, gate in enumerate(gates):
        gate_type = str(gate.get("type") or "unknown")
        fp_entries = 1
        fp_exits = 1
        fp_reads = _classical_read_count(gate)
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

def _gate_reads_writes_for_types(gate_type: str, arity: int) -> Tuple[int, int]:
    gate_type = gate_type.lower()
    if gate_type in {"cnot", "cx", "swap"}:
        return 1, 1
    return arity, arity


def _calculate_types_metrics(
    gates: List[Dict[str, Any]],
    num_qubits: Optional[int],
    input_vectors: Optional[List[List[int]]],
    measurement_vectors: Optional[List[List[int]]],
) -> Dict[str, Any]:
    functional_processes: List[Dict[str, Any]] = []
    entries = exits = reads = writes = 0

    explicit_inputs = input_vectors is not None
    vectors, placeholder_inputs = _resolve_input_vectors(gates, num_qubits, input_vectors)
    input_fp_count = len(vectors) + placeholder_inputs
    if input_fp_count == 0 and not explicit_inputs and num_qubits and num_qubits > 0:
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

    vector_map: Dict[int, int] = {}
    for idx, vec in enumerate(vectors):
        for q in vec:
            if q not in vector_map:
                vector_map[q] = idx

    gate_groups: Dict[Tuple[str, int, Tuple[int, ...]], int] = {}
    measurement_vectors_resolved = _resolve_measurement_vectors(gates, vectors, measurement_vectors)
    for gate in gates:
        gtype = str(gate.get("type") or "unknown").lower()
        if gtype == "input":
            continue
        if gtype == "measure":
            continue
        arity = _gate_qubit_count(gate)
        qubits = _gate_qubits(gate)
        vector_ids = sorted({vector_map.get(q, -1) for q in qubits})
        vector_key = tuple(vector_ids) if vector_ids else (-1,)
        gate_groups[(gtype, arity, vector_key)] = gate_groups.get((gtype, arity, vector_key), 0) + 1

    for (gtype, arity, _vector_key), _count in gate_groups.items():
        fp_entries = 1
        fp_reads, fp_writes = _gate_reads_writes_for_types(gtype, arity)
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

    measurement_fp_count = len(measurement_vectors_resolved)
    if measurement_fp_count > 0:
        fp_entries = measurement_fp_count
        fp_reads = measurement_fp_count
        fp_writes = measurement_fp_count
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


def _calculate_q_cosmic_metrics(
    gates: List[Dict[str, Any]],
    num_qubits: Optional[int],
    input_vectors: Optional[List[List[int]]],
    measurement_vectors: Optional[List[List[int]]],
) -> Dict[str, Any]:
    vectors, _placeholder_inputs = _resolve_input_vectors(gates, num_qubits, input_vectors)
    measurement_vectors_resolved = _resolve_measurement_vectors(gates, vectors, measurement_vectors)

    entries = len(vectors) if vectors else 0
    exits = len(measurement_vectors_resolved) if measurement_vectors_resolved else 0
    reads = 0
    writes = 0

    qubits_present = num_qubits or len(_infer_qubits_from_gates(gates, num_qubits))
    q_entries = 1 if qubits_present else 0
    q_exits = 1 if qubits_present else 0

    total_cfp = entries + exits + reads + writes + q_entries + q_exits
    functional_processes = [
        {
            "name": "quantum-system",
            "gate_type": "q-cosmic",
            "entries": entries,
            "exits": exits,
            "reads": reads,
            "writes": writes,
            "q_entries": q_entries,
            "q_exits": q_exits,
            "cfp": total_cfp,
        }
    ]
    return {
        "approach": "q-cosmic",
        "entries": entries,
        "exits": exits,
        "reads": reads,
        "writes": writes,
        "q_entries": q_entries,
        "q_exits": q_exits,
        "total_cfp": total_cfp,
        "functional_processes": functional_processes,
    }
