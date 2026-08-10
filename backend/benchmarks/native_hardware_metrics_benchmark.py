import gc
import json
import pathlib
import statistics
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.hardware_metrics import (
    _calculate_hardware_metrics_python,
    calculate_hardware_metrics,
    native_analyzer_available,
)
from tests.test_native_hardware_metrics import build_gates


def measure(function) -> float:
    started = time.perf_counter_ns()
    function()
    return (time.perf_counter_ns() - started) / 1_000_000


def main() -> None:
    if not native_analyzer_available():
        raise SystemExit("Build backend/native before running this benchmark")

    num_qubits = 20
    gate_count = 100_000
    repetitions = 31
    gates = build_gates(gate_count, num_qubits)

    python_call = lambda: _calculate_hardware_metrics_python(num_qubits, gates)
    native_call = lambda: calculate_hardware_metrics(num_qubits, gates)

    expected = python_call()
    actual = native_call()
    expected.pop("analyzer_engine")
    actual.pop("analyzer_engine")
    if actual != expected:
        raise RuntimeError("native and Python analyzer results differ")

    for _ in range(10):
        python_call()
        native_call()

    python_samples = []
    native_samples = []
    gc.disable()
    try:
        for index in range(repetitions):
            if index % 2 == 0:
                python_samples.append(measure(python_call))
                native_samples.append(measure(native_call))
            else:
                native_samples.append(measure(native_call))
                python_samples.append(measure(python_call))
    finally:
        gc.enable()

    python_ms = statistics.median(python_samples)
    native_ms = statistics.median(native_samples)
    result = {
        "num_qubits": num_qubits,
        "gate_count": gate_count,
        "repetitions": repetitions,
        "python_median_ms": round(python_ms, 3),
        "cpp_median_ms": round(native_ms, 3),
        "speedup": round(python_ms / native_ms, 2),
        "latency_reduction_percent": round((1 - native_ms / python_ms) * 100, 1),
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
