# Measurement Features Overview

## Execute Request: Measurement Override
`POST /api/v1/execute` supports an optional `measurement_config` payload:

```json
{
  "measurement_config": {
    "basis": "z",
    "qubits": [0, 1],
    "classical_bits": [0, 1],
    "reset_after": false
  }
}
```

- `basis`: `z | x | y` basis for measurement.
- `qubits`: subset of qubits to measure.
- `classical_bits`: mapping target classical bits.
- `reset_after`: reset qubits after measurement (if supported in simulator).

## Execute Response: New Fields

- `measurement_basis`: basis per qubit.
- `per_qubit_probabilities`: marginal probabilities per qubit.
- `confidence_intervals`: Wilson score intervals per bitstring.
- `cosmic_metrics`, `hardware_metrics`: metrics blocks when `include_metrics=true`.

## Metrics Endpoints

```
POST /api/v1/metrics/cosmic
POST /api/v1/metrics/hardware
```

Both accept `{ num_qubits, gates, approach? }` and return the corresponding metrics.

## Error Mitigation Utilities (Backend)

Module: `backend/app/error_mitigation.py`

- Readout correction via calibration matrix.
- Zero-noise extrapolation (scalar or per-bitstring).
- Probabilistic error cancellation (quasi-probability weights).

## Tomography Utilities (Backend)

Module: `backend/app/tomography.py`

- Single-qubit state tomography (X/Y/Z bases).
- Single-qubit process tomography (Pauli transfer matrix).
- Single-qubit measurement tomography (assignment matrix).
- Uhlmann fidelity for density matrices.
