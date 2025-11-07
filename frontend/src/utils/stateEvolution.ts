import { Gate } from '../types/circuit';

/**
 * Type definition for a complex number as [real, imaginary]
 */
type Complex = [number, number];

/**
 * Type definition for quantum state as a mapping from basis state to complex amplitude
 */
export type QuantumState = Record<string, Complex>;

/**
 * Add two complex numbers
 */
export const complexAdd = (a: Complex, b: Complex): Complex => {
  return [a[0] + b[0], a[1] + b[1]];
};

/**
 * Multiply two complex numbers
 */
export const complexMultiply = (a: Complex, b: Complex): Complex => {
  const real = a[0] * b[0] - a[1] * b[1];
  const imag = a[0] * b[1] + a[1] * b[0];
  return [real, imag];
};

/**
 * Calculate the modulus squared of a complex number (|z|²)
 */
export const complexModulusSquared = (z: Complex): number => {
  return z[0] * z[0] + z[1] * z[1];
};

/**
 * Format a complex number as a string
 */
export const formatComplexNumber = (z: Complex): string => {
  const [real, imag] = z;
  const realPart = real.toFixed(2).replace(/\.00$/, '');
  const imagPart = Math.abs(imag).toFixed(2).replace(/\.00$/, '');
  
  if (Math.abs(real) < 0.005 && Math.abs(imag) < 0.005) {
    return '0';
  } else if (Math.abs(real) < 0.005) {
    return `${imagPart}i`;
  } else if (Math.abs(imag) < 0.005) {
    return realPart;
  } else {
    return `${realPart}${imag >= 0 ? '+' : '-'}${imagPart}i`;
  }
};

/**
 * Apply a single-qubit gate to the quantum state
 */
export const applySingleQubitGate = (
  state: QuantumState,
  gate: Gate,
  numQubits: number
): QuantumState => {
  const newState: QuantumState = {};
  const targetQubit = gate.qubit !== undefined ? gate.qubit : 0;
  
  // Apply the gate matrix to the state vector
  Object.entries(state).forEach(([basisState, amplitude]) => {
    switch (gate.type) {
      case 'h': // Hadamard gate
        applyHadamard(basisState, amplitude, targetQubit, newState);
        break;
      case 'x': // Pauli X gate
        applyPauliX(basisState, amplitude, targetQubit, newState);
        break;
      case 'y': // Pauli Y gate
        applyPauliY(basisState, amplitude, targetQubit, newState);
        break;
      case 'z': // Pauli Z gate
        applyPauliZ(basisState, amplitude, targetQubit, newState);
        break;
      case 's': // S gate
        applyPhaseS(basisState, amplitude, targetQubit, newState);
        break;
      case 't': // T gate
        applyPhaseT(basisState, amplitude, targetQubit, newState);
        break;
      case 'rx': // Rotation around X
        applyRotationX(basisState, amplitude, targetQubit, newState, Number(gate.params?.theta) || 0);
        break;
      case 'ry': // Rotation around Y
        applyRotationY(basisState, amplitude, targetQubit, newState, Number(gate.params?.theta) || 0);
        break;
      case 'rz': // Rotation around Z
        applyRotationZ(basisState, amplitude, targetQubit, newState, Number(gate.params?.phi) || 0);
        break;
      default:
        // For unsupported gates, just copy the amplitude
        newState[basisState] = [...amplitude];
    }
  });
  
  return newState;
};

/**
 * Apply a two-qubit gate to the quantum state
 */
export const applyTwoQubitGate = (
  state: QuantumState,
  gate: Gate,
  numQubits: number
): QuantumState => {
  const newState: QuantumState = {};
  const controlQubit = gate.qubit !== undefined ? gate.qubit : (gate.controls && gate.controls[0]) || 0;
  const targetQubit = (gate.targets && gate.targets[0]) || 0;
  
  // Apply the gate matrix to the state vector
  Object.entries(state).forEach(([basisState, amplitude]) => {
    switch (gate.type) {
      case 'cnot': // Controlled NOT
        applyCNOT(basisState, amplitude, controlQubit, targetQubit, newState);
        break;
      case 'cz': // Controlled Z
        applyCZ(basisState, amplitude, controlQubit, targetQubit, newState);
        break;
      case 'swap': // SWAP gate
        applySwap(basisState, amplitude, controlQubit, targetQubit, newState);
        break;
      default:
        // For unsupported gates, just copy the amplitude
        newState[basisState] = [...amplitude];
    }
  });
  
  return newState;
};

/**
 * Apply a three-qubit (Toffoli) gate to the quantum state
 */
export const applyThreeQubitGate = (
  state: QuantumState,
  gate: Gate,
  numQubits: number
): QuantumState => {
  const newState: QuantumState = {};
  
  if (gate.type === 'toffoli' && gate.controls && gate.controls.length >= 2 && gate.targets && gate.targets.length > 0) {
    const control1 = gate.controls[0];
    const control2 = gate.controls[1];
    const target = gate.targets[0];
    
    // Apply Toffoli gate
    Object.entries(state).forEach(([basisState, amplitude]) => {
      applyToffoli(basisState, amplitude, control1, control2, target, newState);
    });
  } else {
    // If it's not a properly defined Toffoli gate, just copy the state
    Object.entries(state).forEach(([basisState, amplitude]) => {
      newState[basisState] = [...amplitude];
    });
  }
  
  return newState;
};

/**
 * Main function to simulate applying a quantum gate to a state
 */
export const simulateGateApplication = (
  state: QuantumState,
  gate: Gate,
  numQubits: number
): QuantumState => {
  // Determine the type of gate and route to appropriate handler
  if (['h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'p'].includes(gate.type)) {
    return applySingleQubitGate(state, gate, numQubits);
  } else if (['cnot', 'cz', 'swap'].includes(gate.type)) {
    return applyTwoQubitGate(state, gate, numQubits);
  } else if (gate.type === 'toffoli') {
    return applyThreeQubitGate(state, gate, numQubits);
  } else {
    // Unsupported gate type - just return the original state
    return { ...state };
  }
};

/**
 * Calculate measurement probabilities from quantum state
 */
export const calculateProbabilities = (state: QuantumState): Record<string, number> => {
  const probabilities: Record<string, number> = {};
  
  // Calculate total probability (should be 1.0 for a normalized state)
  let totalProb = 0;
  Object.entries(state).forEach(([basisState, amplitude]) => {
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
};

/**
 * Apply a Hadamard gate to qubit targetQubit in basis state
 */
const applyHadamard = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit]; // Reverse bit order (MSB to LSB)
  
  // Create the new state after applying Hadamard
  const otherState = flipBit(basisState, targetQubit);
  
  // Apply Hadamard matrix: H = (1/√2) * [1 1; 1 -1]
  const factor = 1 / Math.sqrt(2);
  
  // Calculate new amplitudes
  const sign = targetBit === '0' ? 1 : -1;
  
  // Add contribution to both output states
  addToState(newState, basisState, [amplitude[0] * factor, amplitude[1] * factor]);
  addToState(newState, otherState, [amplitude[0] * factor * sign, amplitude[1] * factor * sign]);
};

/**
 * Apply a Pauli X gate (NOT gate) to qubit targetQubit in basis state
 */
const applyPauliX = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState
) => {
  // X gate flips the target bit
  const newBasisState = flipBit(basisState, targetQubit);
  addToState(newState, newBasisState, amplitude);
};

/**
 * Apply a Pauli Y gate to qubit targetQubit in basis state
 */
const applyPauliY = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState
) => {
  // Y gate flips the target bit and applies a phase based on the bit value
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit];
  const newBasisState = flipBit(basisState, targetQubit);
  
  // Apply i if bit was 0, -i if bit was 1
  const newAmplitude: Complex = targetBit === '0' 
    ? [-amplitude[1], amplitude[0]]   // Multiply by i
    : [amplitude[1], -amplitude[0]];  // Multiply by -i
    
  addToState(newState, newBasisState, newAmplitude);
};

/**
 * Apply a Pauli Z gate to qubit targetQubit in basis state
 */
const applyPauliZ = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit];
  
  // Z gate applies -1 phase if target bit is 1, otherwise unchanged
  const newAmplitude: Complex = targetBit === '1' 
    ? [-amplitude[0], -amplitude[1]] // Multiply by -1
    : [...amplitude];
    
  addToState(newState, basisState, newAmplitude);
};

/**
 * Apply an S gate (phase gate) to qubit targetQubit in basis state
 */
const applyPhaseS = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit];
  
  // S gate applies i phase if target bit is 1, otherwise unchanged
  const newAmplitude: Complex = targetBit === '1' 
    ? [-amplitude[1], amplitude[0]] // Multiply by i
    : [...amplitude];
    
  addToState(newState, basisState, newAmplitude);
};

/**
 * Apply a T gate (π/8 phase gate) to qubit targetQubit in basis state
 */
const applyPhaseT = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit];
  
  // T gate applies e^(iπ/4) phase if target bit is 1
  if (targetBit === '1') {
    // e^(iπ/4) = cos(π/4) + i*sin(π/4)
    const cosPhase = Math.cos(Math.PI / 4);
    const sinPhase = Math.sin(Math.PI / 4);
    const newAmplitude: Complex = [
      amplitude[0] * cosPhase - amplitude[1] * sinPhase,
      amplitude[0] * sinPhase + amplitude[1] * cosPhase
    ];
    addToState(newState, basisState, newAmplitude);
  } else {
    addToState(newState, basisState, amplitude);
  }
};

/**
 * Apply an RX gate (rotation around X) to qubit targetQubit in basis state
 */
const applyRotationX = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState,
  angleInDegrees: number
) => {
  const angle = angleInDegrees * Math.PI / 180; // Convert to radians
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit];
  
  // Get the flipped state
  const otherState = flipBit(basisState, targetQubit);
  
  // Apply RX matrix: RX(θ) = [cos(θ/2), -i*sin(θ/2); -i*sin(θ/2), cos(θ/2)]
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  
  // For |0⟩ state (targetBit = '0'), new amplitude = cos(θ/2) * |0⟩ + (-i*sin(θ/2)) * |1⟩
  // For |1⟩ state (targetBit = '1'), new amplitude = (-i*sin(θ/2)) * |0⟩ + cos(θ/2) * |1⟩
  
  if (targetBit === '0') {
    // Original state |0⟩ contributes cos(θ/2) to |0⟩ and -i*sin(θ/2) to |1⟩
    const newAmplitude0: Complex = [
      amplitude[0] * cos,
      amplitude[1] * cos
    ];
    const newAmplitude1: Complex = [
      amplitude[1] * sin,    // -i * (a + bi) = b - ai
      -amplitude[0] * sin
    ];
    
    addToState(newState, basisState, newAmplitude0);
    addToState(newState, otherState, newAmplitude1);
  } else {
    // Original state |1⟩ contributes -i*sin(θ/2) to |0⟩ and cos(θ/2) to |1⟩
    const newAmplitude0: Complex = [
      amplitude[1] * sin,    // -i * (a + bi) = b - ai
      -amplitude[0] * sin
    ];
    const newAmplitude1: Complex = [
      amplitude[0] * cos,
      amplitude[1] * cos
    ];
    
    addToState(newState, otherState, newAmplitude0);
    addToState(newState, basisState, newAmplitude1);
  }
};

/**
 * Apply an RY gate (rotation around Y) to qubit targetQubit in basis state
 */
const applyRotationY = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState,
  angleInDegrees: number
) => {
  const angle = angleInDegrees * Math.PI / 180; // Convert to radians
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit];
  
  // Get the flipped state
  const otherState = flipBit(basisState, targetQubit);
  
  // Apply RY matrix: RY(θ) = [cos(θ/2), -sin(θ/2); sin(θ/2), cos(θ/2)]
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  
  // For |0⟩ state (targetBit = '0'), new amplitude = cos(θ/2) * |0⟩ + (-sin(θ/2)) * |1⟩
  // For |1⟩ state (targetBit = '1'), new amplitude = sin(θ/2) * |0⟩ + cos(θ/2) * |1⟩
  
  if (targetBit === '0') {
    // Original state |0⟩ contributes cos(θ/2) to |0⟩ and -sin(θ/2) to |1⟩
    const newAmplitude0: Complex = [
      amplitude[0] * cos,
      amplitude[1] * cos
    ];
    const newAmplitude1: Complex = [
      -amplitude[0] * sin,
      -amplitude[1] * sin
    ];
    
    addToState(newState, basisState, newAmplitude0);
    addToState(newState, otherState, newAmplitude1);
  } else {
    // Original state |1⟩ contributes sin(θ/2) to |0⟩ and cos(θ/2) to |1⟩
    const newAmplitude0: Complex = [
      amplitude[0] * sin,
      amplitude[1] * sin
    ];
    const newAmplitude1: Complex = [
      amplitude[0] * cos,
      amplitude[1] * cos
    ];
    
    addToState(newState, otherState, newAmplitude0);
    addToState(newState, basisState, newAmplitude1);
  }
};

/**
 * Apply an RZ gate (rotation around Z) to qubit targetQubit in basis state
 */
const applyRotationZ = (
  basisState: string, 
  amplitude: Complex, 
  targetQubit: number, 
  newState: QuantumState,
  angleInDegrees: number
) => {
  const angle = angleInDegrees * Math.PI / 180; // Convert to radians
  const n = basisState.length;
  const targetBit = basisState[n - 1 - targetQubit];
  
  // Apply RZ matrix: RZ(θ) = [e^(-iθ/2), 0; 0, e^(iθ/2)]
  const halfAngle = angle / 2;
  
  if (targetBit === '0') {
    // Apply e^(-iθ/2) = cos(-θ/2) + i*sin(-θ/2)
    const cosPhase = Math.cos(-halfAngle);
    const sinPhase = Math.sin(-halfAngle);
    const newAmplitude: Complex = [
      amplitude[0] * cosPhase - amplitude[1] * sinPhase,
      amplitude[0] * sinPhase + amplitude[1] * cosPhase
    ];
    addToState(newState, basisState, newAmplitude);
  } else {
    // Apply e^(iθ/2) = cos(θ/2) + i*sin(θ/2)
    const cosPhase = Math.cos(halfAngle);
    const sinPhase = Math.sin(halfAngle);
    const newAmplitude: Complex = [
      amplitude[0] * cosPhase - amplitude[1] * sinPhase,
      amplitude[0] * sinPhase + amplitude[1] * cosPhase
    ];
    addToState(newState, basisState, newAmplitude);
  }
};

/**
 * Apply a CNOT gate with control and target qubits
 */
const applyCNOT = (
  basisState: string, 
  amplitude: Complex, 
  controlQubit: number, 
  targetQubit: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const controlBit = basisState[n - 1 - controlQubit];
  
  // Only flip the target bit if the control bit is 1
  if (controlBit === '1') {
    const newBasisState = flipBit(basisState, targetQubit);
    addToState(newState, newBasisState, amplitude);
  } else {
    addToState(newState, basisState, amplitude);
  }
};

/**
 * Apply a CZ gate with control and target qubits
 */
const applyCZ = (
  basisState: string, 
  amplitude: Complex, 
  controlQubit: number, 
  targetQubit: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const controlBit = basisState[n - 1 - controlQubit];
  const targetBit = basisState[n - 1 - targetQubit];
  
  // Apply phase -1 if both control and target are 1
  if (controlBit === '1' && targetBit === '1') {
    addToState(newState, basisState, [-amplitude[0], -amplitude[1]]);
  } else {
    addToState(newState, basisState, amplitude);
  }
};

/**
 * Apply a SWAP gate between two qubits
 */
const applySwap = (
  basisState: string, 
  amplitude: Complex, 
  qubit1: number, 
  qubit2: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const bit1 = basisState[n - 1 - qubit1];
  const bit2 = basisState[n - 1 - qubit2];
  
  // If bits are the same, no change
  if (bit1 === bit2) {
    addToState(newState, basisState, amplitude);
    return;
  }
  
  // Swap the bits
  const basisChars = basisState.split('');
  basisChars[n - 1 - qubit1] = bit2;
  basisChars[n - 1 - qubit2] = bit1;
  const newBasisState = basisChars.join('');
  
  addToState(newState, newBasisState, amplitude);
};

/**
 * Apply a Toffoli gate (CCNOT) with two control qubits and one target
 */
const applyToffoli = (
  basisState: string, 
  amplitude: Complex, 
  control1: number, 
  control2: number, 
  target: number, 
  newState: QuantumState
) => {
  const n = basisState.length;
  const control1Bit = basisState[n - 1 - control1];
  const control2Bit = basisState[n - 1 - control2];
  
  // Only flip the target bit if both control bits are 1
  if (control1Bit === '1' && control2Bit === '1') {
    const newBasisState = flipBit(basisState, target);
    addToState(newState, newBasisState, amplitude);
  } else {
    addToState(newState, basisState, amplitude);
  }
};

/**
 * Helper function to flip a specific bit in a basis state string
 */
const flipBit = (basisState: string, bitPosition: number): string => {
  const n = basisState.length;
  const index = n - 1 - bitPosition; // Reverse bit order (MSB to LSB)
  
  const basisChars = basisState.split('');
  basisChars[index] = basisChars[index] === '0' ? '1' : '0';
  return basisChars.join('');
};

/**
 * Helper function to add amplitude to a basis state in the quantum state
 */
const addToState = (state: QuantumState, basisState: string, amplitude: Complex) => {
  if (!state[basisState]) {
    state[basisState] = [...amplitude];
  } else {
    state[basisState] = complexAdd(state[basisState], amplitude);
  }
};

/**
 * Mock function to simulate a quantum circuit execution and return measurement probabilities
 */
export const simulateCircuit = (gates: Gate[], numQubits: number): Record<string, number> => {
  // Initialize state to |0...0⟩
  let state: QuantumState = {};
  const zeroState = '0'.repeat(numQubits);
  state[zeroState] = [1, 0]; // amplitude 1+0i
  
  // Fill all other states with zero amplitude
  for (let i = 1; i < Math.pow(2, numQubits); i++) {
    const binaryString = i.toString(2).padStart(numQubits, '0');
    state[binaryString] = [0, 0]; // amplitude 0+0i
  }
  
  // Sort gates by position
  const sortedGates = [...gates].sort((a, b) => 
    (a.position !== undefined ? a.position : 0) - (b.position !== undefined ? b.position : 0)
  );
  
  // Apply each gate in sequence
  for (const gate of sortedGates) {
    state = simulateGateApplication(state, gate, numQubits);
  }
  
  // Calculate final probabilities
  return calculateProbabilities(state);
};