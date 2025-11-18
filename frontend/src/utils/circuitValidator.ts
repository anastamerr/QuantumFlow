import { Gate, Qubit } from '../store/slices/circuitSlice';

// Added 'optimization' to the severity types
export type ErrorSeverity = 'critical' | 'warning' | 'optimization';

export interface CircuitError {
  id: string;
  severity: ErrorSeverity;
  message: string;
  gateId?: string; // Optional, as some errors apply to the whole qubit
  ruleId: number;
}

export function validateCircuit(gates: Gate[], qubits: Qubit[]): CircuitError[] {
  const errors: CircuitError[] = [];

  // --- STATE TRACKING ---
  const qubitMeasurementTimes = new Map<number, number>();
  const classicalBitWriteTimes = new Map<number, number>();
  
  // Helper: Track which qubits are actually used
  const usedQubits = new Set<number>();

  // Sort gates by position
  const sortedGates = [...gates].sort((a, b) => a.position - b.position);

  // Helper for Adjacency Checks (Rule 10 & 13)
  // Map: QubitID -> List of Gates on that wire, sorted by time
  const gatesByQubit = new Map<number, Gate[]>();

  // ---------------------------------------------------------
  // MAIN LOOP (Batches 1, 2, 3)
  // ---------------------------------------------------------
  for (const gate of sortedGates) {
    const gateType = gate.type.toUpperCase();
    const targets = [gate.qubit, ...(gate.targets || [])].filter(q => q !== undefined);
    const controls = gate.controls || [];
    const allInvolvedQubits = [...new Set([...targets, ...controls])];

    // Track usage for Rule 14
    allInvolvedQubits.forEach(q => {
        usedQubits.add(q);
        if (!gatesByQubit.has(q)) gatesByQubit.set(q, []);
        gatesByQubit.get(q)!.push(gate);
    });

    // --- BATCH 1: CRASHERS ---
    
    // Rule 1: Self Control
    if (controls.some(c => targets.includes(c))) {
      errors.push({ id: `r1-${gate.id}`, severity: 'critical', gateId: gate.id, ruleId: 1, message: `Invalid Topology: Qubit cannot control itself.` });
    }
    
    // Rule 2: Missing Angle
    if (['RX', 'RY', 'RZ', 'P', 'U1', 'U2', 'U3'].includes(gateType)) {
      const angle = gate.params?.['angle'];
      if (angle === undefined || angle === null || angle === '') {
        errors.push({ id: `r2-${gate.id}`, severity: 'critical', gateId: gate.id, ruleId: 2, message: `Math Error: '${gateType}' is missing rotation angle.` });
      }
    }

    // Rule 3: Arity
    if (['CX', 'CNOT', 'CZ', 'SWAP'].includes(gateType) && allInvolvedQubits.length < 2) {
      errors.push({ id: `r3-${gate.id}`, severity: 'critical', gateId: gate.id, ruleId: 3, message: `Gate '${gateType}' requires 2 qubits.` });
    }
    if (['CCX', 'TOFFOLI'].includes(gateType) && allInvolvedQubits.length < 3) {
      errors.push({ id: `r3-${gate.id}`, severity: 'critical', gateId: gate.id, ruleId: 3, message: `Gate '${gateType}' requires 3 qubits.` });
    }

    // --- BATCH 2: DATA INTEGRITY ---
    const isMeasure = (gateType === 'MEASURE' || gateType === 'M');
    const targetClBit = gate.params?.['bit'] !== undefined ? Number(gate.params['bit']) : (isMeasure ? gate.qubit : undefined); 

    // Rule 4: Ghost Measure
    if (isMeasure && targetClBit === undefined) {
       errors.push({ id: `r4-${gate.id}`, severity: 'critical', gateId: gate.id, ruleId: 4, message: `Ghost Measurement: No target bit assigned.` });
    }

    // Rule 5: Overwrite
    if (isMeasure && targetClBit !== undefined) {
      if (classicalBitWriteTimes.has(targetClBit)) {
        errors.push({ id: `r5-${gate.id}`, severity: 'warning', gateId: gate.id, ruleId: 5, message: `Data Clash: Overwriting Classical Bit ${targetClBit}.` });
      }
      classicalBitWriteTimes.set(targetClBit, gate.position);
    }

    // Rule 6: Zombie Qubit
    if (!isMeasure) {
      for (const q of allInvolvedQubits) {
        if (qubitMeasurementTimes.has(q) && gate.position > qubitMeasurementTimes.get(q)!) {
            errors.push({ id: `r6-${gate.id}-${q}`, severity: 'warning', gateId: gate.id, ruleId: 6, message: `Modifying collapsed qubit q${q} after measurement.` });
        }
      }
    } else {
      allInvolvedQubits.forEach(q => { if (!qubitMeasurementTimes.has(q)) qubitMeasurementTimes.set(q, gate.position); });
    }

    // --- BATCH 3: LOGIC ---
    // (Rules 7, 8, 9 simplified for brevity - keeping structure)
    if (gate.params?.['condition']) {
        // ... existing condition logic ...
    }
  }

  // =================================================================
  // BATCH 4: OPTIMIZATIONS (The "Best Practices")
  // =================================================================

  // Iterate per qubit to check sequences
  qubits.forEach(qubit => {
    const qubitGates = gatesByQubit.get(qubit.id) || [];
    
    // RULE 14: Unused Qubit
    if (qubitGates.length === 0) {
        errors.push({
            id: `r14-${qubit.id}`,
            severity: 'optimization',
            message: `Optimization: Qubit q${qubit.id} is unused. Consider removing it to save resources.`,
            ruleId: 14
        });
        return; // Skip other checks for this qubit
    }

    // Check adjacency
    for (let i = 0; i < qubitGates.length; i++) {
        const current = qubitGates[i];
        const next = qubitGates[i + 1];

        // RULE 10: Identity Pair (H-H, X-X, Z-Z, SWAP-SWAP)
        // If two identical self-inverse gates are adjacent
        const selfInverseGates = ['H', 'X', 'Y', 'Z', 'SWAP', 'CX', 'CZ']; 
        if (next && current.type === next.type && selfInverseGates.includes(current.type.toUpperCase())) {
             // For multi-qubit gates like CX, ensure targets/controls match exactly
             const currentTargets = JSON.stringify(current.targets || []);
             const nextTargets = JSON.stringify(next.targets || []);
             const currentControls = JSON.stringify(current.controls || []);
             const nextControls = JSON.stringify(next.controls || []);

             if (currentTargets === nextTargets && currentControls === nextControls) {
                // Prevent duplicate error messages (only flag on the first gate)
                if (!errors.find(e => e.id === `r10-${current.id}`)) {
                    errors.push({
                        id: `r10-${current.id}`,
                        severity: 'optimization',
                        gateId: current.id,
                        ruleId: 10,
                        message: `Optimization: Two adjacent '${current.type}' gates cancel out. Remove both.`
                    });
                }
             }
        }

        // RULE 11: Deterministic Measurement
        // If the FIRST gate on a wire is a Measure
        if (i === 0 && (current.type.toUpperCase() === 'MEASURE' || current.type.toUpperCase() === 'M')) {
             errors.push({
                id: `r11-${current.id}`,
                severity: 'optimization',
                gateId: current.id,
                ruleId: 11,
                message: `Best Practice: Measuring a fresh qubit always yields |0>. This gate adds no value.`
            });
        }

        // RULE 12: Useless Control
        // If the FIRST gate on a wire is a Control for a CX/CZ
        if (i === 0 && (current.type === 'CX' || current.type === 'CZ')) {
            // Check if this qubit is the CONTROL (not the target)
            // Assuming 'qubit' prop is Target, and 'controls' array has Control
            const isControl = (current.controls || []).includes(qubit.id);
            if (isControl) {
                 errors.push({
                    id: `r12-${current.id}`,
                    severity: 'optimization',
                    gateId: current.id,
                    ruleId: 12,
                    message: `Optimization: Control qubit is |0> (Ground State). This gate will never trigger.`
                });
            }
        }

        // RULE 13: Mergeable Rotations
        // If RX follows RX
        const rotationTypes = ['RX', 'RY', 'RZ', 'P'];
        if (next && current.type === next.type && rotationTypes.includes(current.type.toUpperCase())) {
            if (!errors.find(e => e.id === `r13-${current.id}`)) {
                errors.push({
                    id: `r13-${current.id}`,
                    severity: 'optimization',
                    gateId: current.id,
                    ruleId: 13,
                    message: `Optimization: Adjacent '${current.type}' rotations can be merged into one gate.`
                });
            }
        }
    }
  });

  return errors;
}