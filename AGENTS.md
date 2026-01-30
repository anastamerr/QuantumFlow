# QuantumFlow Code Sweep - Issues (2026-01-30)

This list focuses on correctness, runtime failures, and accuracy problems found in a full pass of the repo.
Paths include line numbers so you can jump straight to the source.

## Critical / High
- Unsupported gates exposed in UI: `qft` / `iqft` are available in the gate library, but the backend runner does not implement them (and code generators do not handle them). Any circuit using these will fail with "Unsupported gate type". Files: `frontend/src/utils/gateLibrary.ts` (around lines 178-195), `backend/app/qiskit_runner.py` (lines 64-149).
- Algorithm library uses non-numeric positions: many gates use `{x, y}` objects for `position`, but the core `Gate` type and most utilities expect a number. This causes `Math.max`, sorting, grouping, and depth calculations to return `NaN` or collapse to 0. Files: `frontend/src/utils/algorithmLibrary.ts` (lines 118-228, 251-316, 378-433), `frontend/src/components/generator/generators/codeGeneratorUtils.ts` (lines 23-26, 55-64), `frontend/src/utils/circuitOptimizer.ts` (e.g., lines 380-413), `frontend/src/components/panels/SimulationPanel.tsx` (depth calc), `backend/app/qiskit_runner.py` (sort_key expects int, lines 201-205).
- Grover implementation incorrect for >2 qubits: it substitutes a single Toffoli for an n-controlled Z, which is not equivalent for general n, so Grover results are wrong beyond very small cases. File: `frontend/src/utils/algorithmLibrary.ts` (lines 145-165).
- Angle units inconsistent across the app: UI gate params are in degrees (0-360), algorithm templates use radians, generators and backend coerce heuristically, but the optimizer combines angles as radians without conversion and local state evolution assumes degrees. This yields incorrect optimized circuits and mismatched visualizations. Files: `frontend/src/utils/gateLibrary.ts` (lines 55-87), `frontend/src/utils/circuitOptimizer.ts` (lines 380-413), `frontend/src/utils/stateEvolution.ts` (lines 344-405), `frontend/src/components/generator/generators/codeGeneratorUtils.ts` (lines 76-93).
- QuantumStateVisualizer step-backwards logic is wrong: it recomputes from the *current* state instead of the initial state, double-applying gates and producing incorrect state/probability when stepping back. File: `frontend/src/components/visualization/QuantumStateVisualizer.tsx` (lines 228-246).

## Medium
- Phase gate is a no-op in local state evolution: `simulateGateApplication` routes `p` to `applySingleQubitGate`, but that switch never implements `p`, so phase gates (and controlled phase) are ignored. File: `frontend/src/utils/stateEvolution.ts` (lines 68-96, 170-179).
- Algorithm application breaks intended parallelism: `position: gate.position || index` treats position 0 as falsy, so gates meant to share position 0 are serialized. File: `frontend/src/components/panels/AlgorithmLibraryPanel.tsx` (lines 222-225).
- Depth reduction can violate dependencies when `maxDepth` is set: positions are scaled and floored, which can collapse multiple dependent gates onto the same timestep on the same qubit. File: `frontend/src/utils/circuitOptimizer.ts` (lines 614-622).
- CORS config allows credentials with wildcard origins, which browsers reject and is a security risk. File: `backend/app/main.py` (lines 12-23).

## Low / Quality
- Text encoding is corrupted in many UI strings (ket notation, pi, etc.), leading to mojibake in the UI and docs. Examples: `frontend/src/utils/gateLibrary.ts` (lines 161-191), `frontend/src/utils/algorithmLibrary.ts` (lines 31, 70, 334), `frontend/src/utils/stateEvolution.ts` (lines 227, 358), `frontend/src/utils/blochSphereUtils.ts` (multiple), `frontend/src/components/panels/SimulationPanel.tsx` (multiple).
- Duplicate optimization type definitions increase drift risk. Braket generator imports a different copy than Qiskit/Cirq generators. Files: `frontend/src/types/optimizationTypes.ts`, `frontend/src/components/generator/types/optimizationTypes.ts`, `frontend/src/components/generator/generators/braketGenerator.ts`.
