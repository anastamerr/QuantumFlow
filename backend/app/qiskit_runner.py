import os
from typing import Dict, Optional, List, Any
from dotenv import load_dotenv
from collections import defaultdict

# --- Fixed Imports ---
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.quantum_info import Statevector
# ---------------------


def _get_angle(value: Any) -> float:
    try:
        angle = float(value)
    except Exception:
        raise ValueError(f"Invalid angle value: {value}")
    import math
    # Heuristic: treat as radians if within [-2pi, 2pi], else assume degrees
    if abs(angle) <= 2 * math.pi:
        return angle
    return angle * math.pi / 180.0


def _apply_gate(qc, gate: Dict[str, Any]):
    gtype = gate.get("type")
    qubit = gate.get("qubit")
    params = gate.get("params") or {}
    targets: List[int] = list(gate.get("targets") or [])
    controls: List[int] = list(gate.get("controls") or [])

    # Single-qubit gates
    if gtype == "h":
        qc.h(qubit)
    elif gtype == "x":
        qc.x(qubit)
    elif gtype == "y":
        qc.y(qubit)
    elif gtype == "z":
        qc.z(qubit)
    elif gtype == "s":
        qc.s(qubit)
    elif gtype == "t":
        qc.t(qubit)
    elif gtype == "rx":
        angle = _get_angle(params.get("theta") or params.get("angle") or 0)
        qc.rx(angle, qubit)
    elif gtype == "ry":
        angle = _get_angle(params.get("theta") or params.get("angle") or 0)
        qc.ry(angle, qubit)
    elif gtype == "rz":
        angle = _get_angle(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
        qc.rz(angle, qubit)
    elif gtype == "p":  # general U1/phase gate
        angle = _get_angle(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
        qc.p(angle, qubit)
    # Two-qubit gates
    elif gtype == "cnot" or gtype == "cx":
        control = qubit if qubit is not None else (controls[0] if controls else None)
        target = targets[0] if targets else None
        if control is None or target is None:
            raise ValueError("CNOT requires control (qubit/controls[0]) and targets[0]")
        qc.cx(control, target)
    elif gtype == "cz":
        control = qubit if qubit is not None else (controls[0] if controls else None)
        target = targets[0] if targets else None
        if control is None or target is None:
            raise ValueError("CZ requires control and target")
        qc.cz(control, target)
    elif gtype == "swap":
        q1 = qubit if qubit is not None else (targets[0] if targets else None)
        q2 = targets[0] if targets else (controls[0] if controls else None)
        if q1 is None or q2 is None:
            raise ValueError("SWAP requires two qubits (qubit & targets[0] or targets[0] & controls[0])")
        qc.swap(q1, q2)
    # Three-qubit gate
    elif gtype == "toffoli" or gtype == "ccx":
        if len(controls) < 2 or len(targets) < 1:
            raise ValueError("Toffoli requires controls[0], controls[1], targets[0]")
        qc.ccx(controls[0], controls[1], targets[0])
    else:
        pass


def _get_aer_backend(backend_name: str):
    # Prefer modern AerSimulator
    try:
        from qiskit_aer import AerSimulator
        if backend_name == "aer_simulator":
            return AerSimulator()
    except Exception:
        pass

    # Fallback to Aer.get_backend
    try:
        return Aer.get_backend(backend_name)
    except Exception:
        # Legacy fallback
        try:
            return Aer.get_backend("qasm_simulator")
        except Exception as e:
            raise RuntimeError(f"Unable to get backend '{backend_name}': {e}")


def run_circuit(
    num_qubits: int,
    gates: List[Dict[str, Any]],
    shots: int = 1024,
    memory: bool = False,
    override_backend: Optional[str] = None,
) -> Dict:
    load_dotenv()

    backend_name = override_backend or os.getenv("QISKIT_BACKEND", "aer_simulator")

    # Build circuit
    qc = QuantumCircuit(num_qubits, num_qubits)

    # Apply gates sorted by position, stable order
    def sort_key(g):
        p = g.get("position")
        return p if isinstance(p, int) else 0

    for g in sorted(gates, key=sort_key):
        _apply_gate(qc, g)

    # Measure all qubits into classical bits
    qc.measure(range(num_qubits), range(num_qubits))

    # Execute
    backend = _get_aer_backend(backend_name)
    tcirc = transpile(qc, backend)

    try:
        job = backend.run(tcirc, shots=int(shots), memory=bool(memory))
        result = job.result()
    except Exception as e:
        raise RuntimeError(f"Execution failed: {e}")

    counts = result.get_counts()
    if not isinstance(counts, dict):
        if isinstance(counts, list) and counts:
            counts = counts[0]
        else:
            raise RuntimeError("Unexpected counts format from Qiskit result")

    total = float(shots) if shots else sum(counts.values())
    probabilities = {str(k): (int(v) / total) for k, v in counts.items()}

    memory_out = None
    try:
        if memory:
            mem = result.get_memory()
            memory_out = mem[0] if isinstance(mem, list) else mem
    except Exception:
        memory_out = None

    return {
        "backend": backend_name,
        "shots": int(shots),
        "counts": {str(k): int(v) for k, v in counts.items()},
        "probabilities": {str(k): float(v) for k, v in probabilities.items()},
        "memory": memory_out,
    }

#
# --- THIS IS THE NEW, CORRECTED HACKATHON FUNCTION ---
#
def get_state_evolution(
    num_qubits: int,
    gates: List[Dict[str, Any]],
) -> Dict:
    """
    Computes the statevector after each column of gates.
    This fulfills Task (a) of the hackathon.
    """
    
    # 1. Group gates by their column "position"
    columns = defaultdict(list)
    for g in gates:
        pos = g.get("position")
        if pos is None:
            pos = 0  # Default to column 0 if not specified
        columns[pos].append(g)

    # 2. Initialize the circuit and state
    qc = QuantumCircuit(num_qubits)
    snapshots = []

    # 3. Get the initial state |0...0>
    try:
        # Calculate the initial statevector directly
        initial_sv = Statevector(qc)
        initial_state_vec = [f"{c.real:.5f}{c.imag:+.5f}j" for c in initial_sv.data]
        snapshots.append(initial_state_vec)
        
    except Exception as e:
        raise RuntimeError(f"Failed to get initial statevector: {e}")

    # 4. Loop through each column, apply gates, and save snapshot
    # We sort the columns to ensure correct order
    for col_index in sorted(columns.keys()):
        
        # Apply all gates in this specific column
        for gate in columns[col_index]:
            try:
                # Use the existing helper function to apply the gate
                _apply_gate(qc, gate)
            except Exception as e:
                # Ignore gates that fail, for robustness
                print(f"Skipping gate {gate.get('type')}: {e}")

        # 5. Get the statevector *directly from the circuit*
        try:
            current_statevector = Statevector(qc)
            
            # Convert statevector to the JSON-friendly list of strings
            state_list = [f"{c.real:.5f}{c.imag:+.5f}j" for c in current_statevector.data]
            snapshots.append(state_list)
            
        except Exception as e:
            raise RuntimeError(f"Failed to get statevector at column {col_index}: {e}")

    # 6. Return the final dictionary as required
    return {
        "intermediateStates": snapshots
    }