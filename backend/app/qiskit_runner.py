import os
from typing import Dict, Optional, List, Any, Tuple

from dotenv import load_dotenv

from .cosmic_metrics import calculate_cosmic_metrics
from .hardware_metrics import calculate_hardware_metrics

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


def _as_int(value: Any, default: Optional[int] = None) -> Optional[int]:
    if value is None:
        return default
    try:
        return int(value)
    except Exception:
        return default


def _as_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}
    return default


def _normalize_basis(value: Any) -> str:
    if value is None:
        return "z"
    return str(value).strip().lower()


def _apply_basis_rotation(qc, basis: str, qubit: int) -> None:
    if basis == "z":
        return
    if basis == "x":
        qc.h(qubit)
        return
    if basis == "y":
        if hasattr(qc, "sdg"):
            qc.sdg(qubit)
        else:
            qc.s(qubit)
            qc.z(qubit)
        qc.h(qubit)
        return
    raise ValueError(f"Unsupported measurement basis: {basis}")


def _extract_measurement_basis(gates: List[Dict[str, Any]], num_qubits: int) -> Dict[int, str]:
    basis_map: Dict[int, str] = {}
    for gate in gates:
        if gate.get("type") != "measure":
            continue
        params = gate.get("params") or {}
        target = gate.get("qubit")
        if target is None:
            targets = gate.get("targets") or []
            if targets:
                target = targets[0]
        if target is None:
            continue
        basis_map[int(target)] = _normalize_basis(params.get("basis"))
    if not basis_map:
        return {i: "z" for i in range(num_qubits)}
    return basis_map


def _per_qubit_probabilities(counts: Dict[str, int], num_qubits: int) -> Dict[int, Dict[str, float]]:
    total = sum(counts.values())
    if total <= 0:
        return {}
    probs: Dict[int, Dict[str, float]] = {
        i: {"0": 0.0, "1": 0.0} for i in range(num_qubits)
    }
    for bitstring, count in counts.items():
        bits = str(bitstring).replace(" ", "")
        bits = bits.zfill(num_qubits)
        for i in range(num_qubits):
            bit = bits[-1 - i]
            if bit in ("0", "1"):
                probs[i][bit] += count / total
    return probs


def _confidence_intervals(counts: Dict[str, int], shots: int, z_value: float = 1.96) -> Dict[str, List[float]]:
    if shots <= 0:
        return {}
    intervals: Dict[str, List[float]] = {}
    z2 = z_value * z_value
    for state, count in counts.items():
        p = count / shots
        denom = 1.0 + z2 / shots
        center = (p + z2 / (2 * shots)) / denom
        margin = (z_value * ((p * (1 - p) + z2 / (4 * shots)) / shots) ** 0.5) / denom
        lower = max(0.0, center - margin)
        upper = min(1.0, center + margin)
        intervals[str(state)] = [lower, upper]
    return intervals


def _apply_condition(instruction, qc, gate: Dict[str, Any]) -> None:
    params = gate.get("params") or {}
    condition = None
    if isinstance(params, dict):
        condition = params.get("condition") if "condition" in params else params.get("c_if")
    if not condition:
        return

    bits = None
    value = None
    if isinstance(condition, dict):
        bits = condition.get("bits")
        value = condition.get("value")
    else:
        value = condition

    if value is None:
        return

    try:
        value = int(value)
    except Exception as exc:
        raise ValueError(f"Invalid condition value: {value}") from exc

    if bits is None:
        if not qc.cregs:
            raise ValueError("Conditional gate requires a classical register")
        instruction.c_if(qc.cregs[0], value)
        return

    if isinstance(bits, int):
        bits = [bits]
    if isinstance(bits, list) and len(bits) == 1:
        bit = int(bits[0])
        if bit < 0 or bit >= qc.num_clbits:
            raise ValueError("Conditional gate bit index out of range")
        instruction.c_if(qc.clbits[bit], value)
        return

    if not qc.cregs:
        raise ValueError("Conditional gate requires a classical register")
    instruction.c_if(qc.cregs[0], value)


def _condition_from_params(params: Any) -> Optional[Any]:
    if not isinstance(params, dict):
        return None
    if "condition" in params:
        return params.get("condition")
    if "c_if" in params:
        return params.get("c_if")
    return None


def _gate_has_condition(gate: Dict[str, Any]) -> bool:
    condition = _condition_from_params(gate.get("params"))
    return bool(condition)


def _strip_condition_params(params: Any) -> Any:
    if not isinstance(params, dict):
        return params
    return {k: v for k, v in params.items() if k not in {"condition", "c_if"}}


def _condition_is_met(condition: Any, classical_bits: List[int]) -> bool:
    if not condition:
        return True

    bits = None
    value = None
    if isinstance(condition, dict):
        bits = condition.get("bits")
        value = condition.get("value")
    else:
        value = condition

    if value is None:
        return True

    try:
        value_int = int(value)
    except Exception as exc:
        raise ValueError(f"Invalid condition value: {value}") from exc

    if bits is None:
        reg_value = 0
        for idx, bit in enumerate(classical_bits):
            if bit:
                reg_value |= 1 << idx
        return reg_value == value_int

    if isinstance(bits, int):
        bits = [bits]
    if not isinstance(bits, list) or len(bits) == 0:
        return False

    reg_value = 0
    for idx, bit_index in enumerate(bits):
        bit_index = int(bit_index)
        if bit_index < 0 or bit_index >= len(classical_bits):
            raise ValueError("Conditional gate bit index out of range")
        if classical_bits[bit_index]:
            reg_value |= 1 << idx
    return reg_value == value_int


def _apply_gate_unitary(statevector, gate: Dict[str, Any], num_qubits: int):
    try:
        from qiskit import QuantumCircuit
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Failed to import Qiskit: {e}")

    params = _strip_condition_params(gate.get("params"))
    gate_clean = dict(gate)
    gate_clean["params"] = params

    qc_tmp = QuantumCircuit(num_qubits)
    _apply_gate(qc_tmp, gate_clean)
    return statevector.evolve(qc_tmp)


def _apply_basis_rotation_statevector(statevector, basis: str, qubit: int, num_qubits: int):
    try:
        from qiskit import QuantumCircuit
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Failed to import Qiskit: {e}")

    qc_tmp = QuantumCircuit(num_qubits)
    _apply_basis_rotation(qc_tmp, basis, qubit)
    return statevector.evolve(qc_tmp)


def _measurement_probabilities(statevector, target: int) -> Tuple[float, float]:
    data = statevector.data
    p0 = 0.0
    p1 = 0.0
    for idx, amp in enumerate(data):
        prob = (amp.real * amp.real) + (amp.imag * amp.imag)
        if (idx >> target) & 1:
            p1 += prob
        else:
            p0 += prob
    return p0, p1


def _collapse_statevector(statevector, target: int, outcome: int):
    import math
    from qiskit.quantum_info import Statevector

    data = statevector.data.copy()
    for idx in range(len(data)):
        if ((idx >> target) & 1) != outcome:
            data[idx] = 0.0

    norm = math.sqrt(sum((amp.real * amp.real + amp.imag * amp.imag) for amp in data))
    if norm > 0:
        data = data / norm
    return Statevector(data)


def _measurement_target_and_cbit(gate: Dict[str, Any], num_clbits: int) -> Tuple[int, int]:
    target = gate.get("qubit")
    if target is None:
        targets = gate.get("targets") or []
        if targets:
            target = targets[0]
    if target is None:
        raise ValueError("Measure requires 'qubit' or targets[0]")

    params = gate.get("params") or {}
    cbit = _as_int(params.get("cbit") or params.get("classical_bit"), target)
    if cbit is None or cbit < 0 or cbit >= num_clbits:
        raise ValueError("Measure requires a valid classical bit index")
    return int(target), int(cbit)


def _apply_reset_statevector(statevector, target: int, num_qubits: int):
    try:
        from qiskit import QuantumCircuit
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Failed to import Qiskit: {e}")

    qc_tmp = QuantumCircuit(num_qubits)
    qc_tmp.x(target)
    return statevector.evolve(qc_tmp)


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
    error_3q = depolarizing_error(0.02, 3)   # 2%  3q depolarizing

    noise_model.add_all_qubit_quantum_error(error_1q, ['h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'p'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx', 'cz', 'swap', 'cp'])
    noise_model.add_all_qubit_quantum_error(error_3q, ['ccx'])
    return noise_model


def _apply_gate(qc, gate: Dict[str, Any]):
    gtype = gate.get("type")
    qubit = gate.get("qubit")
    params = gate.get("params") or {}
    targets: List[int] = list(gate.get("targets") or [])
    controls: List[int] = list(gate.get("controls") or [])

    # Single-qubit gates
    if gtype == "h":
        inst = qc.h(qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "x":
        inst = qc.x(qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "y":
        inst = qc.y(qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "z":
        inst = qc.z(qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "s":
        inst = qc.s(qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "t":
        inst = qc.t(qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "rx":
        angle = _get_angle(params.get("theta") or params.get("angle") or 0)
        inst = qc.rx(angle, qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "ry":
        angle = _get_angle(params.get("theta") or params.get("angle") or 0)
        inst = qc.ry(angle, qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "rz":
        angle = _get_angle(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
        inst = qc.rz(angle, qubit)
        _apply_condition(inst, qc, gate)
    elif gtype == "p":  # phase gate (optionally controlled via controls[])
        angle = _get_angle(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
        if controls:
            target = qubit if qubit is not None else (targets[0] if targets else None)
            if target is None:
                raise ValueError("Controlled-P requires a target (qubit or targets[0])")
            if len(controls) == 1:
                inst = qc.cp(angle, controls[0], target)
                _apply_condition(inst, qc, gate)
            else:
                # Multi-controlled phase if available
                if hasattr(qc, "mcp"):
                    inst = qc.mcp(angle, controls, target)
                    _apply_condition(inst, qc, gate)
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
            inst = qc.p(angle, qubit)
            _apply_condition(inst, qc, gate)
    elif gtype == "cp":  # explicit controlled-phase gate
        angle = _get_angle(params.get("phi") or params.get("lambda") or params.get("angle") or 0)
        control = controls[0] if controls else qubit
        target = targets[0] if targets else None
        if control is None or target is None:
            raise ValueError("CP requires control (qubit/controls[0]) and targets[0]")
        inst = qc.cp(angle, control, target)
        _apply_condition(inst, qc, gate)
    # Two-qubit gates
    elif gtype == "cnot" or gtype == "cx":
        control = qubit if qubit is not None else (controls[0] if controls else None)
        target = targets[0] if targets else None
        if control is None or target is None:
            raise ValueError("CNOT requires control (qubit/controls[0]) and targets[0]")
        inst = qc.cx(control, target)
        _apply_condition(inst, qc, gate)
    elif gtype == "cz":
        control = qubit if qubit is not None else (controls[0] if controls else None)
        target = targets[0] if targets else None
        if control is None or target is None:
            raise ValueError("CZ requires control and target")
        inst = qc.cz(control, target)
        _apply_condition(inst, qc, gate)
    elif gtype == "swap":
        if qubit is not None:
            q1 = qubit
            q2 = targets[0] if targets else (controls[0] if controls else None)
        else:
            q1 = targets[0] if len(targets) > 0 else None
            q2 = targets[1] if len(targets) > 1 else (controls[0] if controls else None)
        if q1 is None or q2 is None:
            raise ValueError("SWAP requires two qubits (qubit & targets[0] or targets[0] & controls[0])")
        inst = qc.swap(q1, q2)
        _apply_condition(inst, qc, gate)
    # Three-qubit gate
    elif gtype == "toffoli" or gtype == "ccx":
        if len(controls) < 2 or len(targets) < 1:
            raise ValueError("Toffoli requires controls[0], controls[1], targets[0]")
        inst = qc.ccx(controls[0], controls[1], targets[0])
        _apply_condition(inst, qc, gate)
    elif gtype == "measure":
        target = qubit if qubit is not None else (targets[0] if targets else None)
        if target is None:
            raise ValueError("Measure requires 'qubit' or targets[0]")
        basis = _normalize_basis(params.get("basis"))
        cbit = _as_int(params.get("cbit") or params.get("classical_bit"), target)
        if cbit is None or cbit < 0 or cbit >= qc.num_clbits:
            raise ValueError("Measure requires a valid classical bit index")
        _apply_basis_rotation(qc, basis, int(target))
        qc.measure(int(target), int(cbit))
        if _as_bool(params.get("reset_after") or params.get("reset")):
            qc.reset(int(target))
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
    include_metrics: bool = False,
    cosmic_approach: Optional[str] = None,
    measurement_config: Optional[Dict[str, Any]] = None,
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
    gates_sorted = sorted(gates, key=sort_key)

    if measurement_config:
        basis = _normalize_basis(measurement_config.get("basis"))
        qubits = measurement_config.get("qubits")
        reset_after = _as_bool(measurement_config.get("reset_after"))
        classical_bits = measurement_config.get("classical_bits")

        if not qubits:
            qubits = list(range(num_qubits))
        if classical_bits is None or len(classical_bits) != len(qubits):
            classical_bits = list(qubits)

        gates_filtered = [g for g in gates_sorted if g.get("type") != "measure"]
        max_position = max(
            (g.get("position") for g in gates_filtered if isinstance(g.get("position"), int)),
            default=-1,
        )

        measurement_gates = []
        for idx, (qubit, cbit) in enumerate(zip(qubits, classical_bits)):
            measurement_gates.append(
                {
                    "type": "measure",
                    "qubit": int(qubit),
                    "position": max_position + 1 + idx,
                    "params": {
                        "basis": basis,
                        "cbit": int(cbit),
                        "reset_after": reset_after,
                    },
                }
            )

        gates_sorted = gates_filtered + measurement_gates

    if method_norm == "statevector":
        max_qubits = int(os.getenv("STATEVECTOR_MAX_QUBITS", "10"))
        if num_qubits > max_qubits:
            raise ValueError(
                f"Statevector simulation is limited to {max_qubits} qubits (requested {num_qubits}). "
                f"Use method='qasm' or 'noisy' for larger circuits."
            )

        measure_gates = [g for g in gates_sorted if g.get("type") == "measure"]
        non_measure_gates = [g for g in gates_sorted if g.get("type") != "measure"]
        has_conditions = any(_gate_has_condition(g) for g in gates_sorted)

        last_non_measure_pos = max(
            (g.get("position") for g in non_measure_gates if isinstance(g.get("position"), int)),
            default=-1,
        )
        mid_circuit_measurement = False
        if measure_gates and last_non_measure_pos >= 0:
            for g in measure_gates:
                pos = g.get("position")
                if not isinstance(pos, int) or pos < last_non_measure_pos:
                    mid_circuit_measurement = True
                    break

        if not mid_circuit_measurement and not has_conditions:
            qc_sv = QuantumCircuit(num_qubits)
            for g in non_measure_gates:
                _apply_gate(qc_sv, g)

            for g in measure_gates:
                params = g.get("params") or {}
                target = g.get("qubit")
                if target is None:
                    targets = g.get("targets") or []
                    if targets:
                        target = targets[0]
                if target is None:
                    continue
                basis = _normalize_basis(params.get("basis"))
                _apply_basis_rotation(qc_sv, basis, int(target))

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
            measurement_basis = _extract_measurement_basis(gates_sorted, num_qubits)
            per_qubit_probabilities = _per_qubit_probabilities(counts, num_qubits)
            confidence_intervals = _confidence_intervals(counts, int(shots))
            warnings = None
        else:
            try:
                from qiskit.quantum_info import Statevector
            except Exception as e:
                raise RuntimeError(f"Failed to import Qiskit Statevector: {e}")

            branches: List[Tuple[float, Statevector, List[int]]] = [
                (1.0, Statevector.from_label("0" * num_qubits), [0 for _ in range(num_qubits)]),
            ]
            has_measurements = False

            for gate in gates_sorted:
                gtype = gate.get("type")
                if gtype == "measure":
                    has_measurements = True
                    params = gate.get("params") or {}
                    basis = _normalize_basis(params.get("basis"))
                    reset_after = _as_bool(params.get("reset_after") or params.get("reset"))
                    target, cbit = _measurement_target_and_cbit(gate, num_qubits)

                    next_branches: List[Tuple[float, Statevector, List[int]]] = []
                    for weight, state, classical in branches:
                        if weight <= 0:
                            continue
                        rotated = _apply_basis_rotation_statevector(state, basis, target, num_qubits)
                        p0, p1 = _measurement_probabilities(rotated, target)
                        for outcome, prob in ((0, p0), (1, p1)):
                            if prob <= 0:
                                continue
                            collapsed = _collapse_statevector(rotated, target, outcome)
                            if reset_after and outcome == 1:
                                collapsed = _apply_reset_statevector(collapsed, target, num_qubits)
                            new_classical = list(classical)
                            new_classical[cbit] = outcome
                            next_branches.append((weight * prob, collapsed, new_classical))
                    branches = next_branches
                else:
                    condition = _condition_from_params(gate.get("params"))
                    updated_branches: List[Tuple[float, Statevector, List[int]]] = []
                    for weight, state, classical in branches:
                        if condition and not _condition_is_met(condition, classical):
                            updated_branches.append((weight, state, classical))
                            continue
                        updated_state = _apply_gate_unitary(state, gate, num_qubits)
                        updated_branches.append((weight, updated_state, classical))
                    branches = updated_branches

            probabilities: Dict[str, float] = {}
            for weight, state, _classical in branches:
                if weight <= 0:
                    continue
                data = state.data
                for idx, amp in enumerate(data):
                    prob = (amp.real * amp.real) + (amp.imag * amp.imag)
                    if prob <= 0:
                        continue
                    key = format(idx, f"0{num_qubits}b")
                    probabilities[key] = probabilities.get(key, 0.0) + weight * prob

            total_prob = sum(probabilities.values())
            if total_prob > 0 and abs(total_prob - 1.0) > 1e-9:
                probabilities = {k: v / total_prob for k, v in probabilities.items()}

            counts = _probabilities_to_counts(probabilities, int(shots))
            measurement_basis = _extract_measurement_basis(gates_sorted, num_qubits)
            per_qubit_probabilities = _per_qubit_probabilities(counts, num_qubits)
            confidence_intervals = _confidence_intervals(counts, int(shots))

            statevector = None
            warnings = None
            if not has_measurements and branches:
                sv = branches[0][1].data
                statevector = {
                    format(i, f"0{num_qubits}b"): [float(sv[i].real), float(sv[i].imag)]
                    for i in range(len(sv))
                }
            elif has_measurements:
                warnings = [
                    "Statevector output is unavailable when mid-circuit measurements or classical conditions are present."
                ]

        cosmic_metrics = None
        hardware_metrics = None
        if include_metrics:
            cosmic_metrics = calculate_cosmic_metrics(
                gates_sorted,
                cosmic_approach or "occurrences",
                num_qubits=num_qubits,
            )
            hardware_metrics = calculate_hardware_metrics(num_qubits, gates_sorted)

        return {
            "backend": "statevector",
            "method": "statevector",
            "shots": int(shots),
            "counts": counts,
            "probabilities": probabilities,
            "statevector": statevector,
            "warnings": warnings,
            "measurement_basis": measurement_basis,
            "per_qubit_probabilities": per_qubit_probabilities,
            "cosmic_metrics": cosmic_metrics,
            "hardware_metrics": hardware_metrics,
            "confidence_intervals": confidence_intervals,
            "memory": None,
        }

    # Build circuit for shot-based simulation
    qc = QuantumCircuit(num_qubits, num_qubits)
    has_explicit_measure = any((g.get("type") == "measure") for g in gates_sorted)

    for g in gates_sorted:
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

    measurement_basis = _extract_measurement_basis(gates_sorted, num_qubits)
    per_qubit_probabilities = _per_qubit_probabilities(counts, num_qubits)
    confidence_intervals = _confidence_intervals(counts, int(shots))

    cosmic_metrics = None
    hardware_metrics = None
    if include_metrics:
        cosmic_metrics = calculate_cosmic_metrics(
            gates_sorted,
            cosmic_approach or "occurrences",
            num_qubits=num_qubits,
        )
        hardware_metrics = calculate_hardware_metrics(num_qubits, gates_sorted)

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
        "measurement_basis": measurement_basis,
        "per_qubit_probabilities": per_qubit_probabilities,
        "cosmic_metrics": cosmic_metrics,
        "hardware_metrics": hardware_metrics,
        "confidence_intervals": confidence_intervals,
        "memory": memory_out,
    }
