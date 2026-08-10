import pathlib
import random
import sys
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.hardware_metrics import (
    _calculate_hardware_metrics_python,
    calculate_hardware_metrics,
    native_analyzer_available,
)


def build_gates(count: int, num_qubits: int) -> list[dict]:
    randomizer = random.Random(20260810)
    single_types = ["h", "x", "y", "z", "t", "rx", "rz"]
    gates: list[dict] = []
    for position in range(count):
        control = randomizer.randrange(num_qubits)
        selector = position % 10
        if selector == 7:
            target = (control + 1) % num_qubits
            gates.append(
                {
                    "type": "cnot",
                    "qubit": control,
                    "targets": [target],
                    "position": position,
                }
            )
        elif selector == 9:
            gates.append({"type": "measure", "qubit": control, "position": position})
        else:
            gates.append(
                {
                    "type": randomizer.choice(single_types),
                    "qubit": control,
                    "position": position,
                }
            )
    return gates


@unittest.skipUnless(native_analyzer_available(), "native analyzer has not been built")
class TestNativeHardwareMetrics(unittest.TestCase):
    def test_native_engine_matches_reference(self):
        gates = build_gates(10_000, 20)
        expected = _calculate_hardware_metrics_python(20, gates)
        actual = calculate_hardware_metrics(20, gates)

        expected.pop("analyzer_engine")
        self.assertEqual(actual.pop("analyzer_engine"), "cpp")
        self.assertEqual(actual, expected)

    def test_python_fallback_can_be_forced(self):
        gates = build_gates(100, 8)
        with patch.dict("os.environ", {"QUANTUMFLOW_METRICS_ENGINE": "python"}):
            result = calculate_hardware_metrics(8, gates)
        self.assertEqual(result["analyzer_engine"], "python")


if __name__ == "__main__":
    unittest.main()
