from __future__ import annotations

from typing import Dict, Iterable, List, Tuple

import numpy as np


def _normalize_counts(counts: Dict[str, int]) -> Dict[str, float]:
    total = float(sum(counts.values()))
    if total <= 0:
        return {state: 0.0 for state in counts}
    return {state: value / total for state, value in counts.items()}


def build_readout_calibration_matrix(
    calibration_counts: Dict[str, Dict[str, int]],
) -> Tuple[np.ndarray, List[str]]:
    """
    Build a readout calibration matrix M where M[i, j] = P(measured_i | prepared_j).

    Args:
        calibration_counts: Mapping of prepared state -> measured counts.

    Returns:
        A tuple of (matrix, state_order).
    """
    prepared_states = sorted(calibration_counts.keys())
    measured_states: List[str] = sorted(
        {state for counts in calibration_counts.values() for state in counts.keys()}
    )
    if not measured_states:
        measured_states = prepared_states.copy()

    matrix = np.zeros((len(measured_states), len(prepared_states)), dtype=float)
    for col, prepared in enumerate(prepared_states):
        normalized = _normalize_counts(calibration_counts.get(prepared, {}))
        for row, measured in enumerate(measured_states):
            matrix[row, col] = normalized.get(measured, 0.0)

    return matrix, prepared_states


def apply_readout_correction(
    counts: Dict[str, int],
    calibration_counts: Dict[str, Dict[str, int]],
    method: str = "least_squares",
) -> Dict[str, float]:
    """
    Apply readout error mitigation using a calibration matrix.

    Args:
        counts: Raw measurement counts.
        calibration_counts: Calibration data used to build the assignment matrix.
        method: "least_squares" (default) or "pinv".

    Returns:
        Corrected probability distribution over prepared states.
    """
    matrix, prepared_states = build_readout_calibration_matrix(calibration_counts)
    measured_states = sorted(
        {state for counts_map in calibration_counts.values() for state in counts_map.keys()}
    )
    if not measured_states:
        measured_states = prepared_states.copy()

    measured_probs = np.array(
        [_normalize_counts(counts).get(state, 0.0) for state in measured_states], dtype=float
    )

    if method == "pinv":
        solution = np.linalg.pinv(matrix) @ measured_probs
    else:
        solution, *_ = np.linalg.lstsq(matrix, measured_probs, rcond=None)

    solution = np.clip(solution, 0.0, None)
    total = float(np.sum(solution))
    if total > 0:
        solution /= total

    return {prepared_states[i]: float(solution[i]) for i in range(len(prepared_states))}


def zero_noise_extrapolate(
    values_by_scale: Dict[float, float],
    order: int = 1,
) -> float:
    """
    Perform zero-noise extrapolation on expectation values.

    Args:
        values_by_scale: Mapping from noise scale factor -> value.
        order: Polynomial order for extrapolation.

    Returns:
        Extrapolated value at zero noise.
    """
    if len(values_by_scale) < order + 1:
        raise ValueError("Not enough points for the requested extrapolation order.")

    scales = np.array(sorted(values_by_scale.keys()), dtype=float)
    values = np.array([values_by_scale[scale] for scale in scales], dtype=float)
    coeffs = np.polyfit(scales, values, order)
    return float(np.polyval(coeffs, 0.0))


def zero_noise_extrapolate_counts(
    counts_by_scale: Dict[float, Dict[str, int]],
    order: int = 1,
) -> Dict[str, float]:
    """
    Apply zero-noise extrapolation to each bitstring probability.

    Args:
        counts_by_scale: Mapping from noise scale -> counts.
        order: Polynomial order for extrapolation.

    Returns:
        Extrapolated probability distribution at zero noise.
    """
    if len(counts_by_scale) < order + 1:
        raise ValueError("Not enough points for the requested extrapolation order.")

    scales = sorted(counts_by_scale.keys())
    all_states = sorted({state for counts in counts_by_scale.values() for state in counts.keys()})
    probabilities_by_scale = {
        scale: _normalize_counts(counts_by_scale[scale]) for scale in scales
    }

    extrapolated: Dict[str, float] = {}
    for state in all_states:
        values = [probabilities_by_scale[scale].get(state, 0.0) for scale in scales]
        coeffs = np.polyfit(np.array(scales, dtype=float), np.array(values, dtype=float), order)
        extrapolated[state] = float(max(0.0, np.polyval(coeffs, 0.0)))

    total = sum(extrapolated.values())
    if total > 0:
        extrapolated = {state: value / total for state, value in extrapolated.items()}
    return extrapolated


def probabilistic_error_cancellation(
    weighted_counts: Iterable[Tuple[float, Dict[str, int]]],
) -> Dict[str, float]:
    """
    Combine noisy counts with quasi-probability weights.

    Args:
        weighted_counts: Iterable of (weight, counts) pairs.

    Returns:
        Mitigated probability distribution.
    """
    aggregated: Dict[str, float] = {}
    for weight, counts in weighted_counts:
        probabilities = _normalize_counts(counts)
        for state, prob in probabilities.items():
            aggregated[state] = aggregated.get(state, 0.0) + weight * prob

    aggregated = {state: max(0.0, value) for state, value in aggregated.items()}
    total = sum(aggregated.values())
    if total > 0:
        aggregated = {state: value / total for state, value in aggregated.items()}
    return aggregated

