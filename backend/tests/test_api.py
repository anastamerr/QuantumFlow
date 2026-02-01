import base64
import os
import unittest
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from app.main import create_app


class _EnvGuard:
    def __init__(self, updates: dict[str, str]) -> None:
        self._updates = updates
        self._original: dict[str, str | None] = {}

    def __enter__(self):
        for key, value in self._updates.items():
            self._original[key] = os.environ.get(key)
            os.environ[key] = value
        return self

    def __exit__(self, exc_type, exc, tb):
        for key, original in self._original.items():
            if original is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = original


class TestApi(unittest.TestCase):
    def test_health(self):
        client = TestClient(create_app())
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("backend_env", data)

    def test_execute_basic(self):
        client = TestClient(create_app())
        payload = {
            "num_qubits": 1,
            "gates": [],
            "shots": 32,
            "memory": False,
        }
        response = client.post("/api/v1/execute", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["shots"], 32)
        self.assertIn("counts", data)

    def test_execute_with_measurement_override_and_metrics(self):
        client = TestClient(create_app())
        payload = {
            "num_qubits": 2,
            "gates": [{"type": "h", "qubit": 0, "position": 0}],
            "shots": 128,
            "memory": False,
            "include_metrics": True,
            "measurement_config": {
                "basis": "x",
                "qubits": [0],
                "classical_bits": [0],
                "reset_after": False,
            },
        }
        response = client.post("/api/v1/execute", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("measurement_basis", data)
        self.assertIn("per_qubit_probabilities", data)
        self.assertIn("cosmic_metrics", data)
        self.assertIn("hardware_metrics", data)
        self.assertIn("confidence_intervals", data)

    def test_basic_auth_required(self):
        with _EnvGuard({"AUTH_USERNAME": "user", "AUTH_PASSWORD": "pass"}):
            client = TestClient(create_app())
            payload = {"num_qubits": 1, "gates": [], "shots": 4, "memory": False}

            response = client.post("/api/v1/execute", json=payload)
            self.assertEqual(response.status_code, 401)

            token = base64.b64encode(b"user:pass").decode("ascii")
            response = client.post(
                "/api/v1/execute",
                json=payload,
                headers={"Authorization": f"Basic {token}"},
            )
            self.assertEqual(response.status_code, 200)

    def test_rate_limit(self):
        with _EnvGuard({"RATE_LIMIT_REQUESTS": "2", "RATE_LIMIT_WINDOW_SEC": "60"}):
            client = TestClient(create_app())
            for _ in range(2):
                response = client.get("/health")
                self.assertEqual(response.status_code, 200)

            response = client.get("/health")
            self.assertEqual(response.status_code, 429)

    def test_metrics_endpoints(self):
        client = TestClient(create_app())
        payload = {
            "num_qubits": 1,
            "gates": [{"type": "h", "qubit": 0, "position": 0}],
        }
        cosmic_response = client.post("/api/v1/metrics/cosmic", json=payload)
        self.assertEqual(cosmic_response.status_code, 200)
        cosmic_data = cosmic_response.json()
        self.assertIn("total_cfp", cosmic_data)

        hardware_response = client.post("/api/v1/metrics/hardware", json=payload)
        self.assertEqual(hardware_response.status_code, 200)
        hardware_data = hardware_response.json()
        self.assertIn("circuit_depth", hardware_data)
