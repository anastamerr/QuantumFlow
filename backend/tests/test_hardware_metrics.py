import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.hardware_metrics import calculate_hardware_metrics


class TestHardwareMetrics(unittest.TestCase):
    def test_hardware_metrics_basic(self):
        gates = [
            {"type": "h", "qubit": 0, "position": 0},
            {"type": "cnot", "qubit": 0, "targets": [1], "position": 1},
            {"type": "t", "qubit": 1, "position": 2},
            {"type": "measure", "qubit": 0, "position": 3},
        ]
        metrics = calculate_hardware_metrics(2, gates)

        self.assertEqual(metrics["circuit_width"], 2)
        self.assertEqual(metrics["circuit_depth"], 4)
        self.assertEqual(metrics["gate_count"]["h"], 1)
        self.assertEqual(metrics["gate_count"]["cnot"], 1)
        self.assertEqual(metrics["t_count"], 1)
        self.assertEqual(metrics["t_depth"], 1)
        self.assertEqual(metrics["cnot_count"], 1)
        self.assertEqual(metrics["single_qubit_gates"], 2)
        self.assertEqual(metrics["two_qubit_gates"], 1)
        self.assertEqual(metrics["multi_qubit_gates"], 0)
        self.assertEqual(metrics["measurement_count"], 1)
        self.assertAlmostEqual(metrics["entanglement_ratio"], 1 / 3, places=6)
        self.assertEqual(metrics["entanglement_depth"], 1)
        self.assertEqual(metrics["quantum_volume"], 4)


if __name__ == "__main__":
    unittest.main()
