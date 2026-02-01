import math
import unittest
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.qiskit_runner import run_circuit


class TestQiskitRunner(unittest.TestCase):
    def test_angle_small_integer_treated_as_degrees(self):
        res = run_circuit(
            num_qubits=1,
            gates=[{"type": "rx", "qubit": 0, "params": {"theta": 3}, "position": 0}],
            method="statevector",
            shots=1000,
        )

        probs = res["probabilities"]
        self.assertIn("0", probs)
        self.assertIn("1", probs)

        angle_rad = 3 * math.pi / 180.0
        expected_p1 = math.sin(angle_rad / 2) ** 2
        self.assertAlmostEqual(probs["1"], expected_p1, places=8)

    def test_controlled_phase_via_p_with_controls(self):
        res = run_circuit(
            num_qubits=2,
            gates=[
                {"type": "h", "qubit": 0, "position": 0},
                {"type": "h", "qubit": 1, "position": 0},
                {"type": "p", "qubit": 1, "controls": [0], "params": {"phi": math.pi}, "position": 1},
                {"type": "h", "qubit": 1, "position": 2},
            ],
            method="statevector",
            shots=1000,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("00", 0.0), 0.5, places=8)
        self.assertAlmostEqual(probs.get("11", 0.0), 0.5, places=8)
        self.assertLess(probs.get("01", 0.0), 1e-8)
        self.assertLess(probs.get("10", 0.0), 1e-8)

        counts = res["counts"]
        self.assertEqual(sum(counts.values()), 1000)
        self.assertEqual(set(counts.keys()), {"00", "11"})

    def test_swap_gate_statevector(self):
        res = run_circuit(
            num_qubits=2,
            gates=[
                {"type": "x", "qubit": 0, "position": 0},
                {"type": "swap", "qubit": 0, "targets": [1], "position": 1},
            ],
            method="statevector",
            shots=512,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("10", 0.0), 1.0, places=8)
        self.assertLess(probs.get("01", 0.0), 1e-8)

    def test_toffoli_gate_statevector(self):
        res = run_circuit(
            num_qubits=3,
            gates=[
                {"type": "x", "qubit": 0, "position": 0},
                {"type": "x", "qubit": 1, "position": 1},
                {"type": "toffoli", "controls": [0, 1], "targets": [2], "position": 2},
            ],
            method="statevector",
            shots=256,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("111", 0.0), 1.0, places=8)
        self.assertLess(probs.get("011", 0.0), 1e-8)

    def test_mid_circuit_measurement_with_reset(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "x", "qubit": 0, "position": 0},
                {
                    "type": "measure",
                    "qubit": 0,
                    "position": 1,
                    "params": {"basis": "z", "cbit": 0, "reset_after": True},
                },
                {"type": "x", "qubit": 0, "position": 2},
            ],
            method="statevector",
            shots=512,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("1", 0.0), 1.0, places=8)
        self.assertLess(probs.get("0", 0.0), 1e-8)

    def test_qasm_execution_with_memory(self):
        res = run_circuit(
            num_qubits=1,
            gates=[{"type": "h", "qubit": 0, "position": 0}],
            method="qasm",
            shots=64,
            memory=True,
        )

        counts = res["counts"]
        self.assertEqual(sum(counts.values()), 64)
        self.assertIsNotNone(res.get("memory"))

    def test_noisy_execution(self):
        res = run_circuit(
            num_qubits=1,
            gates=[{"type": "h", "qubit": 0, "position": 0}],
            method="noisy",
            shots=64,
        )

        counts = res["counts"]
        self.assertEqual(sum(counts.values()), 64)

    def test_cp_and_cz_gates_statevector(self):
        res = run_circuit(
            num_qubits=2,
            gates=[
                {"type": "h", "qubit": 0, "position": 0},
                {"type": "cp", "qubit": 0, "targets": [1], "params": {"phi": math.pi / 2}, "position": 1},
                {"type": "cz", "qubit": 0, "targets": [1], "position": 2},
            ],
            method="statevector",
            shots=128,
        )
        self.assertAlmostEqual(sum(res["probabilities"].values()), 1.0, places=8)

    def test_qasm_conditional_gate_with_register(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "measure", "qubit": 0, "position": 0, "params": {"cbit": 0}},
                {"type": "x", "qubit": 0, "position": 1, "params": {"condition": 1}},
            ],
            method="qasm",
            shots=32,
        )
        self.assertEqual(sum(res["counts"].values()), 32)

    def test_qasm_conditional_gate_with_bit_list(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "measure", "qubit": 0, "position": 0, "params": {"cbit": 0}},
                {"type": "x", "qubit": 0, "position": 1, "params": {"condition": {"bits": [0], "value": 1}}},
            ],
            method="qasm",
            shots=32,
        )
        self.assertEqual(sum(res["counts"].values()), 32)

    def test_statevector_condition_without_bits(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "x", "qubit": 0, "position": 0},
                {"type": "measure", "qubit": 0, "position": 1, "params": {"cbit": 0}},
                {"type": "x", "qubit": 0, "position": 2, "params": {"condition": 1}},
            ],
            method="statevector",
            shots=128,
        )
        self.assertAlmostEqual(res["probabilities"].get("0", 0.0), 1.0, places=8)

    def test_measurement_with_targets_field(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "x", "qubit": 0, "position": 0},
                {"type": "measure", "targets": [0], "position": 1, "params": {"basis": "z", "cbit": 0}},
            ],
            method="statevector",
            shots=128,
        )
        self.assertAlmostEqual(res["probabilities"].get("1", 0.0), 1.0, places=8)

    def test_measurement_invalid_cbit_raises(self):
        with self.assertRaises(ValueError):
            run_circuit(
                num_qubits=1,
                gates=[
                    {"type": "measure", "qubit": 0, "position": 0, "params": {"cbit": 2}},
                ],
                method="qasm",
                shots=8,
            )

    def test_conditional_bit_out_of_range_raises(self):
        with self.assertRaises(ValueError):
            run_circuit(
                num_qubits=1,
                gates=[
                    {"type": "measure", "qubit": 0, "position": 0, "params": {"cbit": 0}},
                    {"type": "x", "qubit": 0, "position": 1, "params": {"condition": {"bits": [2], "value": 1}}},
                ],
                method="qasm",
                shots=8,
            )

    def test_unsupported_gate_type_raises(self):
        with self.assertRaises(ValueError):
            run_circuit(
                num_qubits=1,
                gates=[{"type": "unknown_gate", "qubit": 0, "position": 0}],
                method="qasm",
                shots=8,
            )


if __name__ == "__main__":
    unittest.main()
