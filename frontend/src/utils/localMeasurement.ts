import { QuantumState } from './stateEvolution';
import { complexModulusSquared } from './stateEvolution';

/**
 * Convert QuantumState to a statevector array format
 * @param quantumState - The quantum state as a Record<string, [real, imag]>
 * @param numQubits - Number of qubits
 * @returns Array of complex numbers as [real, imag] tuples
 */
export function quantumStateToStatevector(
  quantumState: QuantumState,
  numQubits: number
): [number, number][] {
  const totalStates = Math.pow(2, numQubits);
  const statevector: [number, number][] = [];

  for (let i = 0; i < totalStates; i++) {
    const binary = i.toString(2).padStart(numQubits, '0');
    const amplitude = quantumState[binary] || [0, 0];
    statevector.push(amplitude);
  }

  return statevector;
}

/**
 * Get measurement probabilities from a statevector array
 * @param statevector - Array of complex amplitudes [real, imag][]
 * @param numQubits - Number of qubits
 * @returns Record mapping basis states to probabilities
 */
export function getMeasurementProbabilities(
  statevector: [number, number][],
  numQubits: number
): Record<string, number> {
  const probs: Record<string, number> = {};

  for (let i = 0; i < statevector.length; i++) {
    const binary = i.toString(2).padStart(numQubits, '0');
    const amplitude = statevector[i];
    // Calculate |a + bi|^2 = a^2 + b^2
    const probability = amplitude[0] * amplitude[0] + amplitude[1] * amplitude[1];
    probs[binary] = probability;
  }

  return probs;
}

/**
 * Get measurement probabilities directly from QuantumState
 * This is the preferred method as it uses the existing calculateProbabilities function
 * @param quantumState - The quantum state as a Record<string, [real, imag]>
 * @returns Record mapping basis states to probabilities
 */
export function getProbabilitiesFromQuantumState(
  quantumState: QuantumState
): Record<string, number> {
  const probabilities: Record<string, number> = {};
  
  // Calculate total probability (should be 1.0 for a normalized state)
  let totalProb = 0;
  Object.entries(quantumState).forEach(([basisState, amplitude]) => {
    const prob = complexModulusSquared(amplitude);
    probabilities[basisState] = prob;
    totalProb += prob;
  });
  
  // Normalize probabilities if needed (use appropriate tolerance for floating point)
  if (Math.abs(totalProb - 1.0) > 1e-6) {
    Object.keys(probabilities).forEach(basisState => {
      probabilities[basisState] /= totalProb;
    });
  }
  
  return probabilities;
}

/**
 * Get state matrix with basis states, amplitudes, and probabilities from QuantumState
 * @param quantumState - The quantum state as a Record<string, [real, imag]>
 * @param numQubits - Number of qubits
 * @returns Array of state items with state, amplitude, and probability
 */
export interface StateItem {
  state: string;
  amplitude: number | string;
  probability: number;
}

export function getStateMatrixFromQuantumState(
  quantumState: QuantumState,
  numQubits: number
): StateItem[] {
  const states: StateItem[] = [];
  const totalStates = Math.pow(2, numQubits);
  
  for (let i = 0; i < totalStates; i++) {
    const binary = i.toString(2).padStart(numQubits, '0');
    const amplitude = quantumState[binary] || [0, 0];
    const prob = complexModulusSquared(amplitude);
    
    if (prob > 1e-6) {  // ignore negligible noise
      // Format amplitude as real number if imaginary part is negligible, otherwise as complex string
      let ampValue: number | string;
      if (Math.abs(amplitude[1]) < 1e-6) {
        ampValue = amplitude[0];
      } else {
        ampValue = `${amplitude[0].toFixed(6)}${amplitude[1] >= 0 ? '+' : ''}${amplitude[1].toFixed(6)}i`;
      }
      
      states.push({
        state: `|${binary}⟩`,
        amplitude: ampValue,
        probability: prob
      });
    }
  }
  
  return states;
}

