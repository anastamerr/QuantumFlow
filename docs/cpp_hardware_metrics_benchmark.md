# C++ hardware-metrics benchmark

Date: 2026-08-10

## What changed

QuantumFlow's hardware-metrics path now has a C++17 CPython extension. It performs gate counting, circuit-depth analysis, T-depth, CNOT and measurement counts, arity classification, entanglement metrics, and quantum-volume estimation in one native pass. The existing Python implementation remains the reference and automatic fallback.

## Correctness validation

- The native engine is compared field-for-field with the Python reference on a deterministic 10,000-gate circuit.
- The full backend suite passes: 45 tests.
- The API reports `analyzer_engine` as `cpp` or `python` so deployments can verify which path ran.

## Benchmark method

- Circuit: 20 qubits, 100,000 deterministic mixed gates.
- Workload: hardware-metrics analysis only; circuit construction is excluded.
- Warm-up: 10 calls per engine.
- Timed runs: 31 per engine, alternating execution order.
- Statistic: median wall-clock latency measured with `perf_counter_ns`.
- Environment: Windows 11, Python 3.10, MSVC 19.36, Release build (`/O2`).

## Result

| Engine | Median latency |
| --- | ---: |
| Python reference | 104.452 ms |
| C++17 extension | 54.742 ms |

The C++ analyzer delivered a **1.91x speedup** and **47.6% lower median latency** on this benchmark. A second complete run measured 49.5% lower latency, so the documented result uses the more conservative run.

Results are hardware-dependent. Re-run `backend/benchmarks/native_hardware_metrics_benchmark.py` on the deployment target before using the number for capacity planning.
