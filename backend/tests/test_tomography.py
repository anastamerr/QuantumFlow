import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.tomography import (
    measurement_tomography_single_qubit,
    process_tomography_single_qubit,
    state_fidelity,
    state_tomography_single_qubit,
)


def _counts(p0: float, shots: int = 100) -> dict:
    p0 = max(0.0, min(1.0, p0))
    c0 = int(round(p0 * shots))
    c1 = shots - c0
    return {"0": c0, "1": c1}


class TestTomography(unittest.TestCase):
    def test_state_tomography_single_qubit(self):
        measurements = {
            "x": _counts(0.5),
            "y": _counts(0.5),
            "z": _counts(1.0),
        }
        result = state_tomography_single_qubit(measurements)
        bloch = result["bloch_vector"]
        self.assertAlmostEqual(bloch["x"], 0.0, places=6)
        self.assertAlmostEqual(bloch["y"], 0.0, places=6)
        self.assertAlmostEqual(bloch["z"], 1.0, places=6)

    def test_measurement_tomography_single_qubit(self):
        calibration = {
            "0": {"0": 95, "1": 5},
            "1": {"0": 4, "1": 96},
        }
        result = measurement_tomography_single_qubit(calibration)
        matrix = result["assignment_matrix"]
        self.assertAlmostEqual(matrix[0][0], 0.95, places=6)
        self.assertAlmostEqual(matrix[1][1], 0.96, places=6)
        self.assertGreater(result["average_assignment_fidelity"], 0.9)

    def test_process_tomography_identity(self):
        process_measurements = {
            "0": {
                "x": _counts(0.5),
                "y": _counts(0.5),
                "z": _counts(1.0),
            },
            "+": {
                "x": _counts(1.0),
                "y": _counts(0.5),
                "z": _counts(0.5),
            },
            "+i": {
                "x": _counts(0.5),
                "y": _counts(1.0),
                "z": _counts(0.5),
            },
        }
        result = process_tomography_single_qubit(process_measurements)
        matrix = result["pauli_transfer_matrix"]
        self.assertAlmostEqual(matrix[0][0], 1.0, places=6)
        self.assertAlmostEqual(matrix[1][1], 1.0, places=6)
        self.assertAlmostEqual(matrix[2][2], 1.0, places=6)

    def test_state_fidelity_identity(self):
        rho = [[1.0 + 0.0j, 0.0j], [0.0j, 0.0j]]
        sigma = [[1.0 + 0.0j, 0.0j], [0.0j, 0.0j]]
        fidelity = state_fidelity(rho, sigma)
        self.assertAlmostEqual(fidelity, 1.0, places=6)


if __name__ == "__main__":
    unittest.main()
