import math
import unittest


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


if __name__ == "__main__":
    unittest.main()

