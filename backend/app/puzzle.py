from typing import List, Literal, Dict, Optional, Any, Tuple
from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator

DifficultyLevel = Literal["Beginner", "Intermediate", "Advanced"]

# Gate definitions and per-gate limits.
# max_count: None means unlimited. aliases: other names that represent same gate from frontend.
GATE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "h": {"label": "H", "max_count": None, "aliases": []},
    "x": {"label": "X", "max_count": None, "aliases": []},
    "y": {"label": "Y", "max_count": None, "aliases": []},
    "z": {"label": "Z", "max_count": None, "aliases": []},
    "s": {"label": "S", "max_count": None, "aliases": []},
    "t": {"label": "T", "max_count": None, "aliases": []},
    "rx": {"label": "Rx", "max_count": None, "aliases": [], "params": ["angle"]},
    "ry": {"label": "Ry", "max_count": None, "aliases": [], "params": ["angle"]},
    "rz": {"label": "Rz", "max_count": None, "aliases": [], "params": ["angle"]},
    "p": {"label": "P", "max_count": None, "aliases": [], "params": ["angle"]},
    "cnot": {"label": "CNOT", "max_count": None, "aliases": ["cx"]},
    "cz": {"label": "CZ", "max_count": None, "aliases": []},
    "swap": {"label": "SWAP", "max_count": None, "aliases": []},
    "toffoli": {"label": "TOFFOLI", "max_count": None, "aliases": ["ccx"]},
}

# Add constraints to puzzles where required. Extra fields will be ignored by Pydantic models
# but are available to helper functions and can be returned by an endpoint if desired.
QUANTUM_PUZZLES: List[dict] = [
    {
        "id": 0,
        "description": "Replicate the effect of the Pauli-X (NOT) gate on a single qubit, but without using an X gate. Use two gates only.",
        "qubits": 1,
        "targetMatrix": "Pauli X",
        "difficulty": "Beginner",
        "constraints": {
            "avoid_gates": ["x"],           # cannot use the X gate
            "max_total_gates": 2,           # at most 2 gates
            "min_total_gates": 2,           # exactly 2 gates
        },
    },
    {
        "id": 1,
        "description": "Apply a gate that flips the phase of the angle state. The state angle should remain unchanged. Use one gate.",
        "qubits": 1,
        "targetMatrix": "Pauli Z",
        "difficulty": "Beginner",
        "constraints": {
            "max_total_gates": 1,
            "min_total_gates": 1,
        },
    },
    {
        "id": 2,
        "description": "Create the identity operation (do nothing) using exactly two different gates. The resulting matrix must be the Identity Matrix (I).",
        "qubits": 1,
        "targetMatrix": "Identity",
        "difficulty": "Beginner",
        "constraints": {
            "max_total_gates": 2,
            "min_total_gates": 2,
            "require_different_gates": True,
        },
    },
    {
        "id": 3,
        "description": "Build a circuit that swaps the states of two qubits (Qubit 0 and Qubit 1) using **three CNOT gates** and no other gates.",
        "qubits": 2,
        "targetMatrix": "Swap",
        "difficulty": "Intermediate",
        "constraints": {
            "exact_counts": {"cnot": 3, "cx": 3},  # accept either 'cnot' or 'cx'
            "no_other_gates": True,
        },
    },
    {
        "id": 4,
        "description": "Construct a circuit that rotates a qubit by an angle of pi/4 around the Z-axis, but only if the control qubit (Qubit 0) is in the angle state. This is a Controlled-pi/4 gate.",
        "qubits": 2,
        "targetMatrix": "Controlled Rz",
        "difficulty": "Advanced",
        "constraints": {
            # leave open; users may use multi-qubit constructions. Example placeholder:
            "max_total_gates": None,
        },
    },
    {
        "id": 5,
        "description": "Simulate a Toffoli (CCNOT) gate using only single-qubit gates and CNOT gates. This will require several steps and three qubits.",
        "qubits": 3,
        "targetMatrix": "Toffoli",
        "difficulty": "Advanced",
        "constraints": {
            "blacklist": ["toffoli", "ccx"],  # cannot use native Toffoli
            "allowed_gates": [k for k in GATE_DEFINITIONS.keys() if k not in ("toffoli", "ccx")],
        },
    },
]


def get_puzzles() -> List[dict]:
    """Retrieve all quantum puzzles."""
    return QUANTUM_PUZZLES


def get_puzzle_by_id(puzzle_id: int) -> dict:
    """Retrieve a specific puzzle by ID."""
    if puzzle_id < 0 or puzzle_id >= len(QUANTUM_PUZZLES):
        raise ValueError(f"Puzzle ID {puzzle_id} not found")
    return QUANTUM_PUZZLES[puzzle_id]


def get_gate_definitions() -> Dict[str, Dict[str, Any]]:
    """Return available gate metadata and limits."""
    return GATE_DEFINITIONS


def get_puzzle_constraints(puzzle_id: int) -> Dict[str, Any]:
    """Return the constraints dict for a given puzzle, or empty dict if none."""
    p = get_puzzle_by_id(puzzle_id)
    return p.get("constraints", {})


def validate_gate_usage(gates: List[dict], puzzle_id: int) -> Tuple[bool, Optional[str]]:
    """
    Validate a list of gate descriptors against puzzle constraints.

    gates: list of gate dictionaries from frontend, expected to include at least "type" keys.
    Returns (True, None) if valid, otherwise (False, reason).
    """
    constraints = get_puzzle_constraints(puzzle_id)
    # compute counts
    counts: Dict[str, int] = {}
    total_gates = 0
    unique_types = set()

    for g in gates:
        gtype = (g.get("type") or "").lower()
        if not gtype:
            continue
        total_gates += 1
        unique_types.add(gtype)
        counts[gtype] = counts.get(gtype, 0) + 1

    # enforce total gate counts
    max_total = constraints.get("max_total_gates")
    min_total = constraints.get("min_total_gates")
    if max_total is not None and total_gates > max_total:
        return False, f"Too many gates: {total_gates} > {max_total}"
    if min_total is not None and total_gates < min_total:
        return False, f"Not enough gates: {total_gates} < {min_total}"

    # enforce avoid/blacklist
    avoid = set((constraints.get("avoid_gates") or []) + (constraints.get("blacklist") or []))
    for forbidden in avoid:
        if counts.get(forbidden, 0) > 0:
            return False, f"Gate '{forbidden}' is not allowed for this puzzle."

    # enforce exact_counts
    exact_counts = constraints.get("exact_counts") or {}
    for key, required in exact_counts.items():
        # accept aliases by summing counts for alias keys
        key_lower = key.lower()
        actual = counts.get(key_lower, 0)
        # account for alias e.g., cx vs cnot
        for alias, meta in GATE_DEFINITIONS.items():
            if key_lower in (alias, *[a.lower() for a in meta.get("aliases", [])]):
                actual += 0  # alias counts are already stored under their own names in counts
        if actual != required:
            return False, f"Expected exactly {required} occurrences of '{key}', found {actual}."

    # enforce no_other_gates and allowed_gates
    if constraints.get("no_other_gates"):
        allowed = set(k.lower() for k in (constraints.get("allowed_gates") or []))
        # if allowed_gates is not specified, default to exact_counts keys
        if not allowed:
            allowed = set(k.lower() for k in exact_counts.keys())
        for t in unique_types:
            if t not in allowed:
                return False, f"Gate '{t}' is not permitted for this puzzle."

    if constraints.get("require_different_gates"):
        if len(unique_types) < total_gates:
            # means a gate type repeats
            if total_gates > len(unique_types):
                return False, "Puzzle requires exactly distinct gates; duplicates found."

    # enforce per-gate max_count from GATE_DEFINITIONS and any per-puzzle limits
    per_puzzle_limits = constraints.get("limits") or {}
    for gtype, cnt in counts.items():
        # check puzzle-specific limit first
        if gtype in per_puzzle_limits:
            limit = per_puzzle_limits[gtype]
            if limit is not None and cnt > limit:
                return False, f"Gate '{gtype}' exceeds puzzle limit ({cnt} > {limit})."
        # then check global definition
        meta = GATE_DEFINITIONS.get(gtype)
        if meta:
            limit = meta.get("max_count")
            if limit is not None and cnt > limit:
                return False, f"Gate '{gtype}' exceeds allowed global limit ({cnt} > {limit})."

    return True, None


def get_target_unitary(label: str, circuit_qubits: int) -> Operator:
    base_targets = {
        "Pauli X": Operator.from_label("X"),
        "Pauli Z": Operator.from_label("Z"),
        "Identity": Operator.from_label("I"),
    }

    if label in base_targets:
        base_op = base_targets[label]
        if circuit_qubits == base_op.num_qubits:
            return base_op
        if circuit_qubits > base_op.num_qubits:
            remaining_qubits = circuit_qubits - base_op.num_qubits
            identity_qc = QuantumCircuit(remaining_qubits)
            identity_op = Operator(identity_qc)
            return base_op.expand(identity_op)
        raise ValueError(f"Circuit has fewer qubits than required")

    if label == "Swap":
        if circuit_qubits < 2:
            raise ValueError(f"Swap requires at least 2 qubits")
        swap_op = Operator([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]])
        if circuit_qubits > 2:
            remaining_qubits = circuit_qubits - 2
            identity_qc = QuantumCircuit(remaining_qubits)
            identity_op = Operator(identity_qc)
            return swap_op.expand(identity_op)
        return swap_op

    if label == "Toffoli":
        if circuit_qubits < 3:
            raise ValueError(f"Toffoli requires at least 3 qubits")
        toffoli_op = Operator(
            [
                [1, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 0, 0, 1, 0],
            ]
        )
        if circuit_qubits > 3:
            remaining_qubits = circuit_qubits - 3
            identity_qc = QuantumCircuit(remaining_qubits)
            identity_op = Operator(identity_qc)
            return toffoli_op.expand(identity_op)
        return toffoli_op

    raise ValueError(f"Unknown target label: {label}")


def check_solution(user_circuit: QuantumCircuit, target_matrix_label: str) -> bool:
    clean_circuit = user_circuit.copy()
    clean_circuit.remove_final_measurements()
    target_op = get_target_unitary(target_matrix_label, user_circuit.num_qubits)
    if clean_circuit.num_qubits != target_op.num_qubits:
        return False
    circuit_unitary = Operator(clean_circuit)
    return circuit_unitary.equiv(target_op)
