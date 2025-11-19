import { Gate, Qubit } from '../store/slices/circuitSlice';
import { SimulationStep, BlochVector, QubitStateDetail } from '../store/slices/simulationSlice';
import { C, applyGateMatrix, getGateMatrix, stateToBloch, mag, Complex } from './mathHelpers';

/**
 * Helper: Converts Bloch coordinates (x,y,z) into Theta, Phi, and Amplitudes
 * Uses 4-decimal precision and clamps noise to prevent "Superposition" flickering.
 */
const calculateAngles = (v: BlochVector, alpha: Complex, beta: Complex, id: number): QubitStateDetail => {
  // --- CLAMPING FIX ---
  // Force tiny numbers to 0 to prevent scientific notation confusion (e.g., 1e-16)
  const clean = (n: number) => Math.abs(n) < 0.0001 ? 0 : n;
  const x = clean(v.x);
  const y = clean(v.y);
  const z = Math.max(-1, Math.min(1, clean(v.z))); // Clamp Z rigidly to -1..1

  // 1. Calculate Theta (0 to PI)
  const theta = Math.acos(z);

  // 2. Calculate Phi (0 to 2PI)
  let phi = Math.atan2(y, x);
  if (phi < 0) phi += 2 * Math.PI;
  
  // Pole Correction: If at |0> or |1>, Phi is irrelevant (set to 0 for clean UI)
  if (Math.abs(z) > 0.999) phi = 0;

  // 3. Format Complex String
  const formatC = (n: Complex) => {
    if (Math.abs(n.imag) < 0.0001) return `${n.real.toFixed(4)}`;
    const sign = n.imag >= 0 ? '+' : '-';
    return `${n.real.toFixed(4)} ${sign} ${Math.abs(n.imag).toFixed(4)}i`;
  };

  let complexStr = "";
  if (mag(alpha) > 0.0001) complexStr += `${formatC(alpha)}|0⟩`;
  if (mag(beta) > 0.0001) {
    if (complexStr !== "") complexStr += " + ";
    const betaStr = formatC(beta);
    const needsParens = Math.abs(beta.imag) > 0.0001 || beta.real < 0;
    complexStr += needsParens ? `(${betaStr})|1⟩` : `${betaStr}|1⟩`;
  }

  // 4. Vector Text
  let vectorText = "Superposition";
  if (z > 0.999) vectorText = "|0⟩";
  else if (z < -0.999) vectorText = "|1⟩";
  else if (x > 0.999) vectorText = "|+⟩";
  else if (x < -0.999) vectorText = "|-⟩";
  // Add Y-axis labels for completeness
  else if (y > 0.999) vectorText = "|+i⟩";
  else if (y < -0.999) vectorText = "|-i⟩";

  return {
    qubitId: id,
    bloch: { x, y, z }, // Return cleaned coordinates
    vectorText,
    theta,
    phi,
    complexStr
  };
};

export const calculateSimulationHistory = (
  qubits: Qubit[],
  gates: Gate[],
): SimulationStep[] => {
  
  const history: SimulationStep[] = [];
  const lastGatePos = gates.length > 0 ? Math.max(...gates.map(g => g.position)) : 0;
  
  // Ensure we simulate at least one step if empty, or up to the last gate + 1
  const totalSteps = lastGatePos + 2;

  // Initialize State
  let currentStates: Record<number, [Complex, Complex]> = {};
  qubits.forEach(q => { currentStates[q.id] = [C(1), C(0)]; });

  for (let step = 0; step < totalSteps; step++) {
    const stepGates = gates.filter(g => g.position === step - 1);
    const stepDetails: QubitStateDetail[] = [];

    // --- SHORT-CIRCUIT ---
    // If this is not the initialization step (0) AND there are no gates here,
    // we SKIP all math. This prevents floating point drift in empty cells.
    if (step > 0 && stepGates.length === 0) {
       // Just calculate visuals based on the EXISTING state
       qubits.forEach(q => {
         const [alpha, beta] = currentStates[q.id];
         const bloch = stateToBloch(alpha, beta);
         stepDetails.push(calculateAngles(bloch, alpha, beta, q.id));
       });
       
       history.push({
         step: step,
         description: `Step ${step}`,
         qubitStates: stepDetails
       });
       continue; // Skip to next loop iteration
    }

    // --- 1. Multi-Qubit Logic (CX/CNOT) ---
    stepGates.forEach(gate => {
        const type = gate.type.toLowerCase();
        if (['cx', 'cnot'].includes(type)) {
            const g = gate as any; 
            if (g.targetQubit !== undefined) {
                const controlState = currentStates[g.qubit];
                const probOne = mag(controlState[1]) ** 2;
                // Classical control check
                if (probOne > 0.5) {
                     const targetSt = currentStates[g.targetQubit];
                     currentStates[g.targetQubit] = applyGateMatrix(getGateMatrix('x'), targetSt);
                }
            }
        }
    });

    // --- 2. Single Qubit Logic ---
    qubits.forEach(q => {
      let [alpha, beta] = currentStates[q.id];
      
      // Find gate (ignoring multi-qubit ones we just handled)
      const gate = stepGates.find(g => g.qubit === q.id && !['cx', 'cnot', 'cz', 'swap'].includes(g.type.toLowerCase()));

      if (gate) {
        const matrix = getGateMatrix(gate.type, gate.params as any);
        [alpha, beta] = applyGateMatrix(matrix, [alpha, beta]);
      }

      currentStates[q.id] = [alpha, beta];
      
      // Visuals
      const bloch = stateToBloch(alpha, beta);
      stepDetails.push(calculateAngles(bloch, alpha, beta, q.id));
    });

    history.push({
      step: step,
      description: step === 0 ? "Initial" : `Step ${step}`,
      qubitStates: stepDetails
    });
  }

  return history;
};