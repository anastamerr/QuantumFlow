# Native C++ hardware-metrics analyzer

QuantumFlow can accelerate hardware-metrics requests with a CPython extension written in C++17. The extension scans the gate sequence once and returns the same response as the Python reference implementation. If the native module is not built, the API automatically falls back to Python.

## Build

From `backend/` with the intended Python environment active:

```bash
cmake -S native -B native/build -DCMAKE_BUILD_TYPE=Release
cmake --build native/build --config Release
```

The compiled module is written to `app/_native/`. On Linux it is a `.so`; on Windows it is a `.pyd`.

Set `QUANTUMFLOW_METRICS_ENGINE=python` to force the reference engine or `QUANTUMFLOW_METRICS_ENGINE=cpp` to require the native engine. The default `auto` mode uses C++ when available.

## Verify

```bash
python -m unittest tests.test_native_hardware_metrics
python benchmarks/native_hardware_metrics_benchmark.py
```
