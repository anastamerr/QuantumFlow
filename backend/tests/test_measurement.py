import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.qiskit_runner import run_circuit


class TestMeasurement(unittest.TestCase):
    def test_z_basis_measurement_statevector(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "measure", "qubit": 0, "position": 0, "params": {"basis": "z"}},
            ],
            method="statevector",
            shots=512,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("0", 0.0), 1.0, places=8)
        self.assertLess(probs.get("1", 0.0), 1e-8)

    def test_x_basis_measurement_statevector(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "h", "qubit": 0, "position": 0},
                {"type": "measure", "qubit": 0, "position": 1, "params": {"basis": "x"}},
            ],
            method="statevector",
            shots=1000,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("0", 0.0), 1.0, places=8)
        self.assertLess(probs.get("1", 0.0), 1e-8)

        basis = res.get("measurement_basis") or {}
        self.assertEqual(basis.get(0), "x")

    def test_y_basis_measurement_statevector(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "h", "qubit": 0, "position": 0},
                {"type": "s", "qubit": 0, "position": 1},
                {"type": "measure", "qubit": 0, "position": 2, "params": {"basis": "y"}},
            ],
            method="statevector",
            shots=1000,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("0", 0.0), 1.0, places=8)
        self.assertLess(probs.get("1", 0.0), 1e-8)

        basis = res.get("measurement_basis") or {}
        self.assertEqual(basis.get(0), "y")

    def test_partial_measurement_statevector(self):
        res = run_circuit(
            num_qubits=2,
            gates=[
                {"type": "h", "qubit": 0, "position": 0},
            ],
            method="statevector",
            shots=1000,
            measurement_config={
                "basis": "z",
                "qubits": [0],
                "classical_bits": [0],
                "reset_after": False,
            },
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("00", 0.0), 0.5, places=6)
        self.assertAlmostEqual(probs.get("01", 0.0), 0.5, places=6)

    def test_mid_circuit_measurement_with_condition_statevector(self):
        res = run_circuit(
            num_qubits=1,
            gates=[
                {"type": "h", "qubit": 0, "position": 0},
                {"type": "measure", "qubit": 0, "position": 1, "params": {"basis": "z", "cbit": 0}},
                {
                    "type": "x",
                    "qubit": 0,
                    "position": 2,
                    "params": {"condition": {"bits": [0], "value": 1}},
                },
            ],
            method="statevector",
            shots=1000,
        )

        probs = res["probabilities"]
        self.assertAlmostEqual(probs.get("0", 0.0), 1.0, places=8)
        self.assertLess(probs.get("1", 0.0), 1e-8)

    def test_metrics_included(self):
        res = run_circuit(
            num_qubits=1,
            gates=[{"type": "h", "qubit": 0, "position": 0}],
            method="statevector",
            shots=10,
            include_metrics=True,
        )
        self.assertIn("cosmic_metrics", res)
        self.assertIn("hardware_metrics", res)
        self.assertEqual(res["cosmic_metrics"]["entries"], 1)
        self.assertEqual(res["hardware_metrics"]["circuit_width"], 1)


if __name__ == "__main__":
    unittest.main()
