import os
from typing import Dict, Optional, List, Any

from dotenv import load_dotenv


def _get_angle(value: Any) -> float:
    try:
        angle = float(value)
    except Exception:
        raise ValueError(f"Invalid angle value: {value}")
    import math
    # UI uses degrees (often integer slider values); algorithm templates may provide radians.
    # Heuristic:
    # - near-integers within [-360, 360] are treated as degrees
    # - otherwise treat values within [-2π, 2π] as radians, else degrees
    if abs(angle - round(angle)) < 1e-9 and abs(angle) <= 360:
        return angle * math.pi / 180.0
    if abs(angle) <= 2 * math.pi:
        return angle
    return angle * math.pi / 180.0


def _probabilities_to_counts(probabilities: Dict[str, float], shots: int) -> Dict[str, int]:
    if shots <= 0:
        return {k: 0 for k in probabilities.keys()}

    # Normalize to avoid rounding drift
    total_p = sum(probabilities.values())
    if total_p <= 0:
        return {}
    probs = {k: max(0.0, float(v) / total_p) for k, v in probabilities.items()}

    # Largest remainder method to ensure sum == shots
    raw = {k: probs[k] * shots for k in probs.keys()}
    floored = {k: int(raw[k]) for k in raw.keys()}
    remainder = shots - sum(floored.values())

    if remainder > 0:
        frac = sorted(((raw[k] - floored[k], k) for k in raw.keys()), reverse=True)
        for _, k in frac[:remainder]:
            floored[k] += 1

    # Drop zeros to keep payload smaller
    return {k: v for k, v in floored.items() if v > 0}


def _default_noise_model():
    # Lightweight default noise model for educational "noisy" simulations
    try:
        from qiskit_aer.noise import NoiseModel, depolarizing_error
    except Exception as e:
        raise RuntimeError(f"Qiskit Aer noise module not available: {e}")

    noise_model = NoiseModel()
    error_1q = depolarizing_error(0.001, 1)  # 0.1% 1q depolarizing
    error_2q = depolarizing_error(0.01, 2)   # 1%  2q depolarizing

    noise_model.add_all_qubit_quantum_error(error_1q, ['h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'p'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx', 'cz', 'swap', 'ccx', 'cp'])
    return noise_model


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
    elif gtype == "p":  # phase gate (optionally controlled via controls[])
        angle = _get_angle(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
        if controls:
            target = qubit if qubit is not None else (targets[0] if targets else None)
            if target is None:
                raise ValueError("Controlled-P requires a target (qubit or targets[0])")
            if len(controls) == 1:
                qc.cp(angle, controls[0], target)
            else:
                # Multi-controlled phase if available
                if hasattr(qc, "mcp"):
                    qc.mcp(angle, controls, target)
                else:
                    import math
                    # Fallback for pi-phase: implement MCZ via H + MCX + H if available
                    if abs(angle - math.pi) < 1e-8 and hasattr(qc, "mcx"):
                        qc.h(target)
                        qc.mcx(controls, target)
                        qc.h(target)
                    else:
                        raise ValueError("Multi-controlled phase not supported by this Qiskit version")
        else:
            qc.p(angle, qubit)
    elif gtype == "cp":  # explicit controlled-phase gate
        angle = _get_angle(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
        control = controls[0] if controls else qubit
        target = targets[0] if targets else None
        if control is None or target is None:
            raise ValueError("CP requires control (qubit/controls[0]) and targets[0]")
        qc.cp(angle, control, target)
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
        if qubit is not None:
            q1 = qubit
            q2 = targets[0] if targets else (controls[0] if controls else None)
        else:
            q1 = targets[0] if len(targets) > 0 else None
            q2 = targets[1] if len(targets) > 1 else (controls[0] if controls else None)
        if q1 is None or q2 is None:
            raise ValueError("SWAP requires two qubits (qubit & targets[0] or targets[0] & controls[0])")
        qc.swap(q1, q2)
    # Three-qubit gate
    elif gtype == "toffoli" or gtype == "ccx":
        if len(controls) < 2 or len(targets) < 1:
            raise ValueError("Toffoli requires controls[0], controls[1], targets[0]")
        qc.ccx(controls[0], controls[1], targets[0])
    elif gtype == "measure":
        if qubit is None:
            raise ValueError("Measure requires 'qubit'")
        qc.measure(qubit, qubit)
    else:
        raise ValueError(f"Unsupported gate type: {gtype}")


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


def run_circuit(
    num_qubits: int,
    gates: List[Dict[str, Any]],
    method: str = "qasm",
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

    method_norm = (method or "qasm").strip().lower()
    if method_norm not in {"qasm", "statevector", "noisy"}:
        raise ValueError(f"Unsupported simulation method: {method}")

    # Apply gates sorted by position, stable order
    def sort_key(g):
        p = g.get("position")
        return p if isinstance(p, int) else 0

    if method_norm == "statevector":
        max_qubits = int(os.getenv("STATEVECTOR_MAX_QUBITS", "10"))
        if num_qubits > max_qubits:
            raise ValueError(
                f"Statevector simulation is limited to {max_qubits} qubits (requested {num_qubits}). "
                f"Use method='qasm' or 'noisy' for larger circuits."
            )

        qc_sv = QuantumCircuit(num_qubits)
        for g in sorted(gates, key=sort_key):
            if g.get("type") == "measure":
                continue
            _apply_gate(qc_sv, g)

        try:
            from qiskit.quantum_info import Statevector
        except Exception as e:
            raise RuntimeError(f"Failed to import Qiskit Statevector: {e}")

        try:
            sv = Statevector.from_instruction(qc_sv).data
        except Exception as e:
            raise RuntimeError(f"Statevector simulation failed: {e}")

        statevector = {
            format(i, f"0{num_qubits}b"): [float(sv[i].real), float(sv[i].imag)]
            for i in range(len(sv))
        }
        probabilities = {
            k: float(v[0] * v[0] + v[1] * v[1])
            for k, v in statevector.items()
        }
        counts = _probabilities_to_counts(probabilities, int(shots))

        return {
            "backend": "statevector",
            "method": "statevector",
            "shots": int(shots),
            "counts": counts,
            "probabilities": probabilities,
            "statevector": statevector,
            "memory": None,
        }

    # Build circuit for shot-based simulation
    qc = QuantumCircuit(num_qubits, num_qubits)
    has_explicit_measure = any((g.get("type") == "measure") for g in gates)

    for g in sorted(gates, key=sort_key):
        _apply_gate(qc, g)

    # Measure all qubits into classical bits unless user added explicit measurements
    if not has_explicit_measure:
        qc.measure(range(num_qubits), range(num_qubits))

    # Execute
    if method_norm == "noisy":
        from qiskit_aer import AerSimulator

        noise_model = _default_noise_model()
        backend = AerSimulator(noise_model=noise_model)
        backend_used = "aer_simulator_noisy"
        tcirc = transpile(qc, backend)
        run_kwargs = {"shots": int(shots), "memory": bool(memory)}
    else:
        backend = _get_aer_backend(backend_name)
        backend_used = backend_name
        tcirc = transpile(qc, backend)
        run_kwargs = {"shots": int(shots), "memory": bool(memory)}

    try:
        job = backend.run(tcirc, **run_kwargs)
        result = job.result()
    except Exception as e:
        raise RuntimeError(f"Execution failed: {e}")

    counts = result.get_counts()
    if not isinstance(counts, dict):
        if isinstance(counts, list) and counts:
            counts = counts[0]
        else:
            raise RuntimeError("Unexpected counts format from Qiskit result")

    total = float(shots) if shots else float(sum(counts.values()))
    probabilities = {str(k): (int(v) / total) for k, v in counts.items()}

    memory_out = None
    if memory:
        try:
            mem = result.get_memory()
            # Single experiment returns List[str], multi-experiment returns List[List[str]]
            if isinstance(mem, list) and mem and isinstance(mem[0], list):
                memory_out = mem[0]
            else:
                memory_out = mem
        except Exception:
            memory_out = None

    return {
        "backend": backend_used,
        "method": method_norm,
        "shots": int(shots),
        "counts": {str(k): int(v) for k, v in counts.items()},
        "probabilities": {str(k): float(v) for k, v in probabilities.items()},
        "memory": memory_out,
    }
