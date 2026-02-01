# Performance Benchmark (10 Qubits)

Date: 2026-01-31

## Configuration
- Qubits: 10
- Depth: 6 (alternating H/RZ layers with a CNOT per layer)
- Shots: 256
- Metrics: enabled

## Results (sample run)
- statevector: 0.620s
- qasm: 0.181s

## Notes
- Results are hardware-dependent and intended as a lightweight regression indicator.
- Benchmark script: `backend/benchmarks/measurement_benchmark.py`.
