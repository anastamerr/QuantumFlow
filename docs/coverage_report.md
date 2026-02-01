# Coverage Report

Date: 2026-01-31

## Backend (measurement modules)

Command:
```
python -m pytest backend/tests --cov=app.cosmic_metrics --cov=app.hardware_metrics --cov=app.error_mitigation --cov=app.tomography --cov=app.qiskit_runner --cov-report=term-missing
```

Summary:
- TOTAL: **84%**
- `app.qiskit_runner`: 80%
- `app.cosmic_metrics`: 96%
- `app.hardware_metrics`: 91%
- `app.error_mitigation`: 91%
- `app.tomography`: 93%

## Frontend (measurement components)

Command:
```
cd frontend
npm run test:coverage
```

Summary:
- All files (measurement-focused include set): **92.13%** statements
- `MeasurementVisualizer`: 98.13%
- `COSMICMetricsPanel`: 83.92%
- `MeasurementGate`: 92.75%
- `measurementStats`: 98.94%
