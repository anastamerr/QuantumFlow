import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.error_mitigation import (
    apply_readout_correction,
    build_readout_calibration_matrix,
    probabilistic_error_cancellation,
    zero_noise_extrapolate,
    zero_noise_extrapolate_counts,
)


class TestErrorMitigation(unittest.TestCase):
    def test_build_readout_calibration_matrix(self):
        calibration = {
            "0": {"0": 90, "1": 10},
            "1": {"0": 20, "1": 80},
        }
        matrix, states = build_readout_calibration_matrix(calibration)
        self.assertEqual(states, ["0", "1"])
        self.assertAlmostEqual(matrix[0, 0], 0.9, places=6)
        self.assertAlmostEqual(matrix[1, 0], 0.1, places=6)
        self.assertAlmostEqual(matrix[0, 1], 0.2, places=6)
        self.assertAlmostEqual(matrix[1, 1], 0.8, places=6)

    def test_apply_readout_correction_identity(self):
        calibration = {
            "0": {"0": 100},
            "1": {"1": 100},
        }
        counts = {"0": 70, "1": 30}
        corrected = apply_readout_correction(counts, calibration)
        self.assertAlmostEqual(corrected["0"], 0.7, places=6)
        self.assertAlmostEqual(corrected["1"], 0.3, places=6)

    def test_zero_noise_extrapolate_linear(self):
        values = {1.0: 0.8, 2.0: 0.6}
        extrapolated = zero_noise_extrapolate(values, order=1)
        self.assertAlmostEqual(extrapolated, 1.0, places=6)

    def test_zero_noise_extrapolate_counts(self):
        counts = {
            1.0: {"0": 80, "1": 20},
            2.0: {"0": 60, "1": 40},
        }
        extrapolated = zero_noise_extrapolate_counts(counts, order=1)
        self.assertGreaterEqual(extrapolated["0"], 0.9)
        self.assertLessEqual(extrapolated["1"], 0.1)

    def test_probabilistic_error_cancellation(self):
        weighted = [
            (0.6, {"0": 100}),
            (0.4, {"1": 100}),
        ]
        mitigated = probabilistic_error_cancellation(weighted)
        self.assertAlmostEqual(mitigated["0"], 0.6, places=6)
        self.assertAlmostEqual(mitigated["1"], 0.4, places=6)


if __name__ == "__main__":
    unittest.main()
