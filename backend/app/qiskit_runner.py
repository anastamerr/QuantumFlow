import os
import hashlib
import json
from typing import Dict, Optional, List, Any
from io import BytesIO

from dotenv import load_dotenv


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
        # Unsupported gate types are ignored to keep execution robust
        # Alternatively, raise to notify client: raise ValueError(f"Unsupported gate type: {gtype}")
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
        from qiskit_aer import Aer
    except Exception:
        try:
            from qiskit import Aer  # older import path
        except Exception as e:  # pragma: no cover
            raise RuntimeError(f"Qiskit Aer not available: {e}")

    try:
        return Aer.get_backend(backend_name)
    except Exception:
        # Legacy fallback
        try:
            return Aer.get_backend("qasm_simulator")
        except Exception as e:
            raise RuntimeError(f"Unable to get backend '{backend_name}': {e}")


DEFAULT_BASIS_GATES = [
    "h",
    "x",
    "y",
    "z",
    "cx",
    "cz",
    "swap",
    "s",
    "t",
    "rx",
    "ry",
    "rz",
    "id",
]


def _qubit_index(qubit) -> int:
    # Qiskit Qubit exposes .index referencing its register index
    return getattr(qubit, "index", getattr(qubit, "_index", 0))


def _qc_to_gate_models(qc) -> List[Dict[str, Any]]:
    supported = set(DEFAULT_BASIS_GATES)
    gate_models: List[Dict[str, Any]] = []

    for position, (instruction, qargs, _) in enumerate(qc.data):
        name = instruction.name.lower()
        if name in {"measure", "barrier", "reset"}:
            continue
        if name not in supported:
            # Skip gates outside of the supported frontend set
            continue

        gate: Dict[str, Any] = {
            "id": f"opt_gate_{position}",
            "type": name,
            "position": position,
        }

        if qargs:
            gate["qubit"] = _qubit_index(qargs[0])

        if name in {"cx", "cz"}:
            if len(qargs) < 2:
                continue
            gate["targets"] = [_qubit_index(qargs[1])]
        elif name == "swap":
            if len(qargs) < 2:
                continue
            gate["targets"] = [_qubit_index(qargs[1])]
        elif name == "rx":
            gate["params"] = {"theta": float(instruction.params[0]) if instruction.params else 0.0}
        elif name == "ry":
            gate["params"] = {"theta": float(instruction.params[0]) if instruction.params else 0.0}
        elif name == "rz":
            gate["params"] = {"phi": float(instruction.params[0]) if instruction.params else 0.0}

        gate_models.append(gate)

    return gate_models


def optimize_circuit(
    num_qubits: int,
    gates: List[Dict[str, Any]],
    basis_gates: Optional[List[str]] = None,
    optimization_level: int = 3,
) -> List[Dict[str, Any]]:
    from qiskit import QuantumCircuit, transpile

    qc = QuantumCircuit(num_qubits)

    def sort_key(g):
        p = g.get("position")
        return p if isinstance(p, int) else 0

    for g in sorted(gates, key=sort_key):
        _apply_gate(qc, g)

    optimized_qc = transpile(
        qc,
        basis_gates=basis_gates or DEFAULT_BASIS_GATES,
        optimization_level=optimization_level,
    )

    return _qc_to_gate_models(optimized_qc)


def get_state_matrix_with_probabilities(statevector) -> List[Dict[str, Any]]:
    """
    Extract state matrix with basis states, amplitudes, and probabilities from statevector.
    Returns list of dictionaries with state, amplitude, and probability.
    """
    from qiskit.quantum_info import Statevector
    import numpy as np
    
    sv = Statevector(statevector)
    amps = sv.data
    
    states = []
    for i, amp in enumerate(amps):
        prob = np.abs(amp)**2
        if prob > 1e-6:  # ignore negligible noise
            binary = format(i, f'0{sv.num_qubits}b')
            # Format amplitude as real number if imaginary part is negligible, otherwise as complex
            if abs(amp.imag) < 1e-6:
                amp_value = float(amp.real)
            else:
                # Format complex number as string
                amp_value = f"{amp.real:.6f}{'+' if amp.imag >= 0 else ''}{amp.imag:.6f}i"
            
            states.append({
                "state": f"|{binary}⟩",
                "amplitude": amp_value,
                "probability": float(prob)
            })
    
    return states


def _statevector_probabilities(statevector, num_qubits: int) -> Dict[str, float]:
    from qiskit.quantum_info import Statevector

    sv = Statevector(statevector)
    probs_dict: Dict[str, float] = {}
    total_states = 2 ** num_qubits
    for idx in range(total_states):
        bitstring = format(idx, f"0{num_qubits}b")
        amplitude = sv.data[idx] if idx < len(sv.data) else 0
        probability = abs(amplitude) ** 2
        probs_dict[bitstring] = float(probability)
    return probs_dict


def _compute_evolution(num_qubits: int, gates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector

    evolution_data: List[Dict[str, Any]] = []

    if num_qubits <= 0:
        return evolution_data

    try:
        current_state = Statevector.from_label('0' * num_qubits)
        evolution_data.append({
            "step": "Initial",
            **_statevector_probabilities(current_state, num_qubits),
        })

        sorted_gates = sorted(gates, key=lambda g: g.get('position') if isinstance(g.get('position'), int) else 0)

        for idx, gate in enumerate(sorted_gates):
            cumulative_qc = QuantumCircuit(num_qubits)
            for prev_gate in sorted_gates[: idx + 1]:
                _apply_gate(cumulative_qc, prev_gate)

            try:
                cumulative_qc = cumulative_qc.remove_final_measurements()
            except Exception:
                pass

            current_state = Statevector.from_label('0' * num_qubits).evolve(cumulative_qc)

            step_label = gate.get("name") or gate.get("type") or f"Step {idx + 1}"

            evolution_data.append({
                "step": step_label,
                **_statevector_probabilities(current_state, num_qubits),
            })
    except Exception:
        return []

    return evolution_data


# In-memory cache for circuit images (hash -> image bytes)
_circuit_image_cache: Dict[str, bytes] = {}


def _compute_circuit_hash(num_qubits: int, gates: List[Dict[str, Any]]) -> str:
    """Compute a stable hash of the circuit definition."""
    # Sort gates by position for consistent hashing
    sorted_gates = sorted(gates, key=lambda g: g.get('position', 0))
    circuit_data = {
        'num_qubits': num_qubits,
        'gates': sorted_gates
    }
    circuit_json = json.dumps(circuit_data, sort_keys=True)
    return hashlib.sha256(circuit_json.encode()).hexdigest()


def _build_quantum_circuit(num_qubits: int, gates: List[Dict[str, Any]]) -> 'QuantumCircuit':
    """Build a QuantumCircuit from gates."""
    from qiskit import QuantumCircuit
    
    if num_qubits <= 0:
        raise ValueError("Number of qubits must be greater than 0")
    
    qc = QuantumCircuit(num_qubits)
    
    # Apply gates sorted by position, stable order
    def sort_key(g):
        p = g.get('position')
        return p if isinstance(p, int) else 0
    
    for g in sorted(gates, key=sort_key):
        _apply_gate(qc, g)
    
    return qc


def generate_text_circuit(
    num_qubits: int,
    gates: List[Dict[str, Any]],
) -> str:
    """
    Generate a text (ASCII) visualization of the quantum circuit.
    Returns text string.
    """
    load_dotenv()

    try:
        from qiskit import QuantumCircuit
    except Exception as e:
        raise RuntimeError(f"Failed to import Qiskit: {e}")

    try:
        qc = _build_quantum_circuit(num_qubits, gates)
        text_output = qc.draw("text")
        return text_output
    except Exception as e:
        raise RuntimeError(f"Failed to generate text circuit: {e}")


def generate_mpl_circuit_image(
    num_qubits: int,
    gates: List[Dict[str, Any]],
) -> bytes:
    """
    Generate an optimized matplotlib visualization of the quantum circuit.
    Uses caching to avoid regenerating the same circuit.
    Returns PNG image bytes.
    """
    load_dotenv()

    # Check cache first
    circuit_hash = _compute_circuit_hash(num_qubits, gates)
    if circuit_hash in _circuit_image_cache:
        return _circuit_image_cache[circuit_hash]

    try:
        from qiskit import QuantumCircuit
        from qiskit.visualization import circuit_drawer
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        import matplotlib.pyplot as plt
    except Exception as e:
        raise RuntimeError(f"Failed to import Qiskit or Matplotlib: {e}")

    try:
        qc = _build_quantum_circuit(num_qubits, gates)

        # Generate matplotlib figure with optimized settings
        try:
            fig = circuit_drawer(
                qc,
                output="mpl",
                style={
                    "usepylatex": False,  # MANDATORY: no LaTeX, 10x faster
                    "dpi": 120,  # Max 150, using 120 for balance
                    "fontsize": 10
                }
            )
        except Exception:
            # Fallback to text drawer if MPL fails
            text_output = qc.draw("text")
            raise RuntimeError(f"MPL drawer failed, text output: {text_output}")
        
        # Save to BytesIO buffer
        buf = BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
        buf.seek(0)
        image_bytes = buf.getvalue()
        buf.close()
        
        # Close the figure to free memory
        plt.close(fig)
        
        # Cache the result
        _circuit_image_cache[circuit_hash] = image_bytes
        
        # Limit cache size to prevent memory issues (keep last 50 circuits)
        if len(_circuit_image_cache) > 50:
            # Remove oldest entry (simple FIFO, hash-based)
            oldest_key = next(iter(_circuit_image_cache))
            del _circuit_image_cache[oldest_key]
        
        return image_bytes
    except Exception as e:
        raise RuntimeError(f"Failed to generate circuit image: {e}")


def run_circuit(
    num_qubits: int,
    gates: List[Dict[str, Any]],
    shots: int = 1024,
    memory: bool = False,
    override_backend: Optional[str] = None,
) -> Dict:
    load_dotenv()

    backend_name = override_backend or os.getenv("QISKIT_BACKEND", "aer_simulator")

    try:
        from qiskit import QuantumCircuit, transpile
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Failed to import Qiskit: {e}")

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

    result_payload = {
        "backend": backend_name,
        "shots": int(shots),
        "counts": {str(k): int(v) for k, v in counts.items()},
        "probabilities": {str(k): float(v) for k, v in probabilities.items()},
        "memory": memory_out,
    }

    try:
        result_payload["evolution"] = _compute_evolution(num_qubits, gates)
    except Exception:
        result_payload["evolution"] = []

    # Compute state matrix from statevector
    try:
        from qiskit.quantum_info import Statevector
        import numpy as np
        
        # Build circuit without measurements to get statevector
        qc_state = QuantumCircuit(num_qubits)
        for g in sorted(gates, key=sort_key):
            _apply_gate(qc_state, g)
        
        # Get statevector
        statevector = Statevector.from_instruction(qc_state)
        result_payload["state_matrix"] = get_state_matrix_with_probabilities(statevector)
    except Exception as e:
        # If statevector computation fails, return empty list
        result_payload["state_matrix"] = []

    result_payload["status"] = "success"

    return result_payload

