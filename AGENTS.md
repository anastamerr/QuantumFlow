# QuantumFlow Code Sweep - Issues (updated 2026-01-30)

This file tracks issues found in the sweep and their current status.

## Remaining (needs decisions)
- [ ] Optional: standardize UI strings to ASCII or Unicode escapes. Current sources contain valid Unicode symbols (ket brackets, π, arrows, emojis) and are UTF-8; no actual mojibake found.

## Resolved
- [x] Unsupported `qft` / `iqft` gates removed from the UI; algorithms now use primitive gates so the backend does not see unknown gate types. Files: `frontend/src/utils/gateLibrary.ts`, `frontend/src/utils/algorithmLibrary.ts`.
- [x] Algorithm library now uses numeric gate positions everywhere to avoid NaN depth/sort issues. File: `frontend/src/utils/algorithmLibrary.ts`.
- [x] Grover diffusion now uses a multi-controlled phase instead of a single Toffoli. File: `frontend/src/utils/algorithmLibrary.ts`.
- [x] Angle units normalized to degrees across optimizer, state evolution, and algorithms (QFT/QPE angles converted). Files: `frontend/src/utils/circuitOptimizer.ts`, `frontend/src/utils/stateEvolution.ts`, `frontend/src/utils/algorithmLibrary.ts`.
- [x] QuantumStateVisualizer step-back recomputes from the initial state and avoids double-apply errors. File: `frontend/src/components/visualization/QuantumStateVisualizer.tsx`.
- [x] Phase gate and controlled-phase now simulated locally. File: `frontend/src/utils/stateEvolution.ts`.
- [x] Parallel gate position 0 preserved in algorithm application. File: `frontend/src/components/panels/AlgorithmLibraryPanel.tsx`.
- [x] Max depth reduction no longer collapses dependencies. File: `frontend/src/utils/circuitOptimizer.ts`.
- [x] CORS wildcard + credentials fix. File: `backend/app/main.py`.
- [x] Duplicate optimization types removed to avoid drift. Files: `frontend/src/types/optimizationTypes.ts` and generator imports.
- [x] Code generators updated for correct multi-controlled phase and Qiskit imports. Files: `frontend/src/components/generator/generators/*`.
- [x] Frontend render guard for very large circuits and code splitting to reduce chunk size warnings. Files: `frontend/src/components/canvas/CircuitCanvas.tsx`, `frontend/vite.config.ts`, `frontend/src/components/visualization/ModernCodeBlock.tsx`.
- [x] Verified UI text encoding: strings use valid Unicode codepoints (e.g., U+27E9 for ket) and render correctly under UTF-8; no corrupted sequences found.
