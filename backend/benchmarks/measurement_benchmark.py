import time
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.qiskit_runner import run_circuit


def build_benchmark_gates(num_qubits: int, depth: int) -> list[dict]:
    gates = []
    position = 0
    for layer in range(depth):
        for qubit in range(num_qubits):
            gates.append(
                {
                    "type": "h" if layer % 2 == 0 else "rz",
                    "qubit": qubit,
                    "position": position,
                    "params": {"phi": 0.1},
                }
            )
            position += 1
        if num_qubits > 1:
            gates.append(
                {
                    "type": "cnot",
                    "qubit": 0,
                    "targets": [1],
                    "position": position,
                }
            )
            position += 1
    return gates


def benchmark(method: str, num_qubits: int, depth: int, shots: int) -> float:
    gates = build_benchmark_gates(num_qubits, depth)
    start = time.perf_counter()
    run_circuit(
        num_qubits=num_qubits,
        gates=gates,
        method=method,
        shots=shots,
        include_metrics=True,
    )
    return time.perf_counter() - start


def main() -> None:
    num_qubits = 10
    depth = 6
    shots = 256
    print(f"Benchmarking {num_qubits} qubits, depth {depth}, shots {shots}")

    for method in ("statevector", "qasm"):
        duration = benchmark(method, num_qubits, depth, shots)
        print(f"{method}: {duration:.3f}s")


if __name__ == "__main__":
    main()
