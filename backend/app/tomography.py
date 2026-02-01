from __future__ import annotations

from typing import Dict, List, Tuple

import numpy as np


def _normalize_counts(counts: Dict[str, int]) -> Dict[str, float]:
    total = float(sum(counts.values()))
    if total <= 0:
        return {state: 0.0 for state in counts}
    return {state: value / total for state, value in counts.items()}


def _expectation_from_counts(counts: Dict[str, int]) -> float:
    probabilities = _normalize_counts(counts)
    return float(probabilities.get("0", 0.0) - probabilities.get("1", 0.0))


def state_tomography_single_qubit(
    measurements: Dict[str, Dict[str, int]],
) -> Dict[str, object]:
    """
    Reconstruct a single-qubit density matrix via linear inversion.

    Args:
        measurements: Mapping from basis ('x', 'y', 'z') -> counts.

    Returns:
        Dictionary containing density_matrix and Bloch vector.
    """
    for basis in ("x", "y", "z"):
        if basis not in measurements:
            raise ValueError(f"Missing {basis}-basis measurements.")

    rx = _expectation_from_counts(measurements["x"])
    ry = _expectation_from_counts(measurements["y"])
    rz = _expectation_from_counts(measurements["z"])

    rho = np.array(
        [
            [(1 + rz) / 2, (rx - 1j * ry) / 2],
            [(rx + 1j * ry) / 2, (1 - rz) / 2],
        ],
        dtype=complex,
    )

    return {
        "density_matrix": _matrix_to_json(rho),
        "bloch_vector": {"x": rx, "y": ry, "z": rz},
    }


def measurement_tomography_single_qubit(
    calibration_counts: Dict[str, Dict[str, int]],
) -> Dict[str, object]:
    """
    Estimate single-qubit measurement assignment matrix.

    Args:
        calibration_counts: Mapping prepared state -> measured counts.

    Returns:
        Assignment matrix and average assignment fidelity.
    """
    prepared_states = ["0", "1"]
    for state in prepared_states:
        if state not in calibration_counts:
            raise ValueError(f"Missing calibration data for |{state}>.")

    matrix = np.zeros((2, 2), dtype=float)
    for col, prepared in enumerate(prepared_states):
        probs = _normalize_counts(calibration_counts[prepared])
        matrix[0, col] = probs.get("0", 0.0)
        matrix[1, col] = probs.get("1", 0.0)

    fidelity = float((matrix[0, 0] + matrix[1, 1]) / 2.0)
    return {
        "assignment_matrix": matrix.tolist(),
        "average_assignment_fidelity": fidelity,
    }


def process_tomography_single_qubit(
    process_measurements: Dict[str, Dict[str, Dict[str, int]]],
) -> Dict[str, object]:
    """
    Estimate a single-qubit Pauli transfer matrix via linear inversion.

    Args:
        process_measurements: Mapping from input state label to basis counts.
            Supported labels: '0', '1', '+', '-', '+i', '-i'.

    Returns:
        Pauli transfer matrix (3x3) and output Bloch vectors.
    """
    input_bloch = {
        "0": np.array([0.0, 0.0, 1.0]),
        "1": np.array([0.0, 0.0, -1.0]),
        "+": np.array([1.0, 0.0, 0.0]),
        "-": np.array([-1.0, 0.0, 0.0]),
        "+i": np.array([0.0, 1.0, 0.0]),
        "-i": np.array([0.0, -1.0, 0.0]),
    }

    inputs: List[np.ndarray] = []
    outputs: List[np.ndarray] = []
    output_vectors: Dict[str, Dict[str, float]] = {}

    for label, measurements in process_measurements.items():
        if label not in input_bloch:
            raise ValueError(f"Unsupported input state label: {label}")
        tomography = state_tomography_single_qubit(measurements)
        bloch = tomography["bloch_vector"]
        out_vec = np.array([bloch["x"], bloch["y"], bloch["z"]], dtype=float)
        inputs.append(input_bloch[label])
        outputs.append(out_vec)
        output_vectors[label] = {
            "x": float(out_vec[0]),
            "y": float(out_vec[1]),
            "z": float(out_vec[2]),
        }

    if len(inputs) < 3:
        raise ValueError("At least three input states are required for process tomography.")

    input_matrix = np.stack(inputs, axis=0)
    output_matrix = np.stack(outputs, axis=0)
    transfer, *_ = np.linalg.lstsq(input_matrix, output_matrix, rcond=None)

    return {
        "pauli_transfer_matrix": transfer.tolist(),
        "output_bloch_vectors": output_vectors,
    }


def state_fidelity(
    rho: List[List[complex]],
    sigma: List[List[complex]],
) -> float:
    """
    Compute Uhlmann fidelity between two density matrices.
    """
    rho_mat = np.array(rho, dtype=complex)
    sigma_mat = np.array(sigma, dtype=complex)

    sqrt_rho = _matrix_sqrt(rho_mat)
    inner = sqrt_rho @ sigma_mat @ sqrt_rho
    sqrt_inner = _matrix_sqrt(inner)
    fidelity = float(np.real(np.trace(sqrt_inner)) ** 2)
    return max(0.0, min(1.0, fidelity))


def _matrix_sqrt(matrix: np.ndarray) -> np.ndarray:
    values, vectors = np.linalg.eigh(matrix)
    values = np.clip(values, 0.0, None)
    sqrt_values = np.sqrt(values)
    return vectors @ np.diag(sqrt_values) @ vectors.conj().T


def _matrix_to_json(matrix: np.ndarray) -> List[List[List[float]]]:
    return [
        [[float(value.real), float(value.imag)] for value in row] for row in matrix
    ]

