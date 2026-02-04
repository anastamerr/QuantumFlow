import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.cosmic_metrics import calculate_cosmic_metrics


def _with_condition(gate: dict, bit: int = 0, value: int = 1) -> dict:
    gate = dict(gate)
    gate["params"] = {"condition": {"bits": [bit], "value": value}}
    return gate


def grover_reference_gates() -> list[dict]:
    gates: list[dict] = []
    position = 0
    for _ in range(6):
        gates.append({"type": "h", "qubit": position % 3, "position": position})
        position += 1
    for idx in range(6):
        gate = {"type": "x", "qubit": idx % 3, "position": position}
        if idx < 3:
            gate = _with_condition(gate, bit=idx % 2, value=1)
        gates.append(gate)
        position += 1
    for _ in range(3):
        gates.append({"type": "z", "qubit": position % 3, "position": position})
        position += 1
    for qubit in range(3):
        gates.append(
            {
                "type": "measure",
                "qubit": qubit,
                "position": position,
                "params": {"basis": "z", "cbit": qubit},
            }
        )
        position += 1
    return gates


def teleportation_reference_gates() -> list[dict]:
    gates: list[dict] = []
    position = 0
    gates.append({"type": "h", "qubit": 1, "position": position})
    position += 1
    for idx in range(3):
        gate = {"type": "x", "qubit": 2, "position": position}
        gates.append(_with_condition(gate, bit=idx % 2, value=1))
        position += 1
    for qubit in range(3):
        gates.append(
            {
                "type": "measure",
                "qubit": qubit,
                "position": position,
                "params": {"basis": "z", "cbit": qubit},
            }
        )
        position += 1
    return gates


def shor_reference_gates_occurrences() -> list[dict]:
    gates: list[dict] = []
    position = 0
    gate_types = ["h", "x", "y", "z", "s", "t"]
    for idx in range(14):
        gtype = gate_types[idx % len(gate_types)]
        gate = {"type": gtype, "qubit": idx % 4, "position": position}
        if idx < 3:
            gate = _with_condition(gate, bit=idx, value=1)
        gates.append(gate)
        position += 1
    for idx in range(3):
        gates.append(
            {
                "type": "rz",
                "qubit": idx % 4,
                "position": position,
                "params": {"phi": 0},
            }
        )
        position += 1
    for qubit in range(3):
        gates.append(
            {
                "type": "measure",
                "qubit": qubit,
                "position": position,
                "params": {"basis": "z", "cbit": qubit},
            }
        )
        position += 1
    return gates


def shor_reference_gates_types() -> list[dict]:
    gates: list[dict] = []
    position = 0
    # Register A (c0, c1, c2) mapped to qubits 0-2
    for gtype in ["h", "s", "t"]:
        gates.append({"type": gtype, "qubit": 0, "position": position})
        position += 1
    # Register B (q0, q1) mapped to qubits 3-4
    gates.append({"type": "x", "qubit": 3, "position": position})
    position += 1
    gates.append({"type": "cnot", "qubit": 3, "targets": [4], "position": position})
    position += 1
    # Measurements for both registers
    gates.append({"type": "measure", "qubit": 0, "position": position})
    position += 1
    gates.append({"type": "measure", "qubit": 3, "position": position})
    return gates


class TestCosmicMetrics(unittest.TestCase):
    def test_grover_approach1_matches_paper(self):
        gates = grover_reference_gates()
        metrics = calculate_cosmic_metrics(gates, "occurrences", num_qubits=3)
        self.assertEqual(metrics["entries"], 18)
        self.assertEqual(metrics["exits"], 18)
        self.assertEqual(metrics["writes"], 3)
        self.assertEqual(metrics["reads"], 3)
        self.assertEqual(metrics["total_cfp"], 42)

    def test_grover_approach2_matches_paper(self):
        gates = grover_reference_gates()
        metrics = calculate_cosmic_metrics(gates, "types", num_qubits=3)
        self.assertEqual(metrics["entries"], 5)
        self.assertEqual(metrics["writes"], 5)
        self.assertEqual(metrics["reads"], 4)
        self.assertEqual(metrics["total_cfp"], 14)

    def test_shor_approach1_matches_paper(self):
        gates = shor_reference_gates_occurrences()
        metrics = calculate_cosmic_metrics(gates, "occurrences", num_qubits=4)
        self.assertEqual(metrics["entries"], 20)
        self.assertEqual(metrics["exits"], 20)
        self.assertEqual(metrics["writes"], 3)
        self.assertEqual(metrics["reads"], 3)
        self.assertEqual(metrics["total_cfp"], 46)

    def test_shor_approach2_matches_paper(self):
        gates = shor_reference_gates_types()
        metrics = calculate_cosmic_metrics(
            gates,
            "types",
            num_qubits=5,
            input_vectors=[[0, 1, 2], [3, 4]],
            measurement_vectors=[[0, 1, 2], [3, 4]],
        )
        self.assertEqual(metrics["entries"], 9)
        self.assertEqual(metrics["writes"], 9)
        self.assertEqual(metrics["reads"], 7)
        self.assertEqual(metrics["total_cfp"], 25)

    def test_teleportation_approach1_matches_paper(self):
        gates = teleportation_reference_gates()
        metrics = calculate_cosmic_metrics(gates, "occurrences", num_qubits=3)
        self.assertEqual(metrics["entries"], 7)
        self.assertEqual(metrics["exits"], 7)
        self.assertEqual(metrics["writes"], 3)
        self.assertEqual(metrics["reads"], 3)
        self.assertEqual(metrics["total_cfp"], 20)

    def test_q_cosmic_counts(self):
        gates = [{"type": "measure", "qubit": 0}, {"type": "measure", "qubit": 1}]
        metrics = calculate_cosmic_metrics(
            gates,
            "q-cosmic",
            num_qubits=2,
            input_vectors=[[0], [1]],
            measurement_vectors=[[0], [1]],
        )
        self.assertEqual(metrics["entries"], 2)
        self.assertEqual(metrics["exits"], 2)
        self.assertEqual(metrics["q_entries"], 1)
        self.assertEqual(metrics["q_exits"], 1)
        self.assertEqual(metrics["total_cfp"], 6)


if __name__ == "__main__":
    unittest.main()
