/**
 * Utility functions for Bloch sphere calculations
 */

// Type for Bloch sphere coordinates
export interface BlochCoordinates {
  x: number; // X coordinate (-1 to 1)
  y: number; // Y coordinate (-1 to 1)
  z: number; // Z coordinate (-1 to 1)
}

// Type for a complex number as [real, imaginary]
export type Complex = [number, number];

// Type for a quantum state as a mapping from basis state to complex amplitude
export type QuantumState = Record<string, Complex>;

const complexConjugate = (z: Complex): Complex => [z[0], -z[1]];

const complexAdd = (a: Complex, b: Complex): Complex => [a[0] + b[0], a[1] + b[1]];

const complexMultiply = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];

const complexAbsSquared = (z: Complex): number => z[0] * z[0] + z[1] * z[1];

const inferNumQubits = (stateVector: QuantumState): number => {
  const keys = Object.keys(stateVector);
  if (keys.length === 0) return 0;
  return Math.max(...keys.map(k => k.length));
};

const reducedDensityMatrixForQubit = (
  stateVector: QuantumState,
  qubitIndex: number
): { rho00: number; rho11: number; rho01: Complex } | null => {
  const numQubits = inferNumQubits(stateVector);
  if (numQubits === 0) return null;
  if (qubitIndex < 0 || qubitIndex >= numQubits) return null;
  if (numQubits > 30) return null;

  const dim = 1 << numQubits;
  const halfDim = dim >> 1;
  const bit = 1 << qubitIndex;
  const lowMask = bit - 1;

  let rho00 = 0;
  let rho11 = 0;
  let rho01: Complex = [0, 0];

  for (let r = 0; r < halfDim; r++) {
    const low = r & lowMask;
    const high = r >> qubitIndex;
    const i0 = low | (high << (qubitIndex + 1));
    const i1 = i0 | bit;

    const s0 = i0.toString(2).padStart(numQubits, '0');
    const s1 = i1.toString(2).padStart(numQubits, '0');

    const a0 = stateVector[s0] || [0, 0];
    const a1 = stateVector[s1] || [0, 0];

    rho00 += complexAbsSquared(a0);
    rho11 += complexAbsSquared(a1);
    rho01 = complexAdd(rho01, complexMultiply(a0, complexConjugate(a1)));
  }

  const trace = rho00 + rho11;
  if (trace <= 1e-15) return null;

  rho00 /= trace;
  rho11 /= trace;
  rho01 = [rho01[0] / trace, rho01[1] / trace];

  return { rho00, rho11, rho01 };
};

/**
 * Calculate Bloch sphere coordinates from quantum amplitudes
 * @param alpha Complex amplitude of |0⟩
 * @param beta Complex amplitude of |1⟩
 * @returns BlochCoordinates representing the point on the Bloch sphere
 */
export const amplitudesToBloch = (alpha: Complex, beta: Complex): BlochCoordinates => {
  // Calculate probabilities
  const alpha_mag_squared = alpha[0] * alpha[0] + alpha[1] * alpha[1];
  const beta_mag_squared = beta[0] * beta[0] + beta[1] * beta[1];
  
  // Handle zero state case to prevent NaN
  if (alpha_mag_squared + beta_mag_squared < 1e-10) {
    return { x: 0, y: 0, z: 1 }; // Default to |0⟩ state
  }
  
  const norm = Math.sqrt(alpha_mag_squared + beta_mag_squared);
  
  // Normalize if needed
  const normAlpha: Complex = [
    alpha[0] / norm,
    alpha[1] / norm
  ];
  const normBeta: Complex = [
    beta[0] / norm,
    beta[1] / norm
  ];
  
  // Extract phase information
  // Theta is the polar angle (from Z axis)
  // For normalized state |ψ⟩ = α|0⟩ + β|1⟩, theta = 2*arccos(|α|)
  let theta = 0;
  const totalNorm = alpha_mag_squared + beta_mag_squared;
  
  if (totalNorm > 1e-15) {
    const alphaProb = alpha_mag_squared / totalNorm;
    // Ensure alphaProb is in valid range [0,1] to avoid NaN from acos
    const clampedAlphaProb = Math.min(Math.max(alphaProb, 0), 1);
    theta = 2 * Math.acos(Math.sqrt(clampedAlphaProb));
  }
  
  // Handle NaN in calculation
  if (isNaN(theta)) {
    theta = 0; // Default to |0⟩ state
  }
  
  // Phi is the azimuthal angle in the X-Y plane
  // This requires the relative phase between alpha and beta
  let phi = 0;
  
  // Only calculate phase if beta has significant magnitude
  if (Math.sqrt(beta_mag_squared) > 1e-10) {
    // For normalized amplitudes, calculate relative phase
    // Remove global phase by making alpha real and positive
    const globalPhase = Math.atan2(normAlpha[1], normAlpha[0]);
    
    // Apply phase correction to beta
    const correctedBetaReal = normBeta[0] * Math.cos(-globalPhase) - normBeta[1] * Math.sin(-globalPhase);
    const correctedBetaImag = normBeta[0] * Math.sin(-globalPhase) + normBeta[1] * Math.cos(-globalPhase);
    
    // The relative phase is now just the phase of the corrected beta
    phi = Math.atan2(correctedBetaImag, correctedBetaReal);
    
    // Normalize to [0, 2π)
    if (phi < 0) phi += 2 * Math.PI;
  }
  
  // Convert spherical coordinates to Cartesian
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.sin(theta) * Math.sin(phi);
  const z = Math.cos(theta);
  
  // Handle NaN values with defaults
  return { 
    x: isNaN(x) ? 0 : x, 
    y: isNaN(y) ? 0 : y, 
    z: isNaN(z) ? 1 : z 
  };
};

/**
 * Calculate Bloch sphere coordinates from a state vector
 * @param stateVector State vector as a Record<string, Complex>
 * @param qubitIndex Index of the qubit to visualize (0-based)
 * @returns BlochCoordinates for the specified qubit
 */
export const stateVectorToBloch = (
  stateVector: QuantumState,
  qubitIndex: number = 0
): BlochCoordinates | null => {
  try {
    const numQubits = inferNumQubits(stateVector);

    if (numQubits === 1) {
      const alpha: Complex = stateVector['0'] || [1, 0];
      const beta: Complex = stateVector['1'] || [0, 0];
      return amplitudesToBloch(alpha, beta);
    }

    const reduced = reducedDensityMatrixForQubit(stateVector, qubitIndex);
    if (reduced) {
      const x = 2 * reduced.rho01[0];
      const y = -2 * reduced.rho01[1];
      const z = reduced.rho00 - reduced.rho11;

      return {
        x: isNaN(x) ? 0 : Math.max(-1, Math.min(1, x)),
        y: isNaN(y) ? 0 : Math.max(-1, Math.min(1, y)),
        z: isNaN(z) ? 1 : Math.max(-1, Math.min(1, z)),
      };
    }

    // Default values to prevent NaN
    let alpha: Complex = [1, 0];
    let beta: Complex = [0, 0];
    
    // For a single qubit, we have two basis states: |0⟩ and |1⟩
    if (Object.keys(stateVector).length <= 2 && 
        Object.keys(stateVector).every(key => key.length === 1)) {
      alpha = stateVector['0'] || [1, 0]; // Default to |0⟩ if missing
      beta = stateVector['1'] || [0, 0];  // Default to 0 amplitude if missing
      return amplitudesToBloch(alpha, beta);
    }
    
    // For multi-qubit states, we need to calculate the reduced density matrix
    // This is a simplification that works for product states
    
    // Get all basis states
    const basisStates = Object.keys(stateVector);
    
    // Initialize new amplitudes
    alpha = [0, 0];
    beta = [0, 0];
    
    // Process each basis state
    basisStates.forEach(state => {
      // Skip if state doesn't have enough qubits
      if (state.length <= qubitIndex) return;
      
      const amp = stateVector[state];
      if (!amp) return;
      
      // Check the qubit value at the specified index (from right to left)
      const qubitValue = state[state.length - 1 - qubitIndex];
      
      if (qubitValue === '0') {
        // Add contribution to |0⟩ amplitude
        alpha[0] += amp[0];
        alpha[1] += amp[1];
      } else {
        // Add contribution to |1⟩ amplitude
        beta[0] += amp[0];
        beta[1] += amp[1];
      }
    });
    
    // Check if we have any valid contributions
    if (Math.abs(alpha[0]) < 1e-10 && Math.abs(alpha[1]) < 1e-10 && 
        Math.abs(beta[0]) < 1e-10 && Math.abs(beta[1]) < 1e-10) {
      // No valid contributions found, return default |0⟩ state
      return { x: 0, y: 0, z: 1 };
    }
    
    // Convert to BlochCoordinates
    return amplitudesToBloch(alpha, beta);
  } catch (err) {
    console.error('Error calculating Bloch coordinates:', err);
    // Return default |0⟩ state in case of error
    return { x: 0, y: 0, z: 1 };
  }
};

/**
 * Calculate the expectation values of the Pauli operators for a qubit state
 * @param stateVector State vector as a Record<string, Complex>
 * @param qubitIndex Index of the qubit (0-based)
 * @returns Object with expectation values for X, Y, Z operators
 */
export const calculatePauliExpectations = (
  stateVector: QuantumState,
  qubitIndex: number = 0
): { x: number, y: number, z: number } | null => {
  const bloch = stateVectorToBloch(stateVector, qubitIndex);
  if (!bloch) return null;
  
  return bloch; // The Bloch coordinates directly correspond to Pauli expectations
};

/**
 * Extract the |0⟩ and |1⟩ amplitudes for a specific qubit from a state vector
 * @param stateVector State vector
 * @param qubitIndex Index of qubit to extract
 * @returns Object containing alpha (|0⟩) and beta (|1⟩) amplitudes
 */
export const extractQubitAmplitudes = (
  stateVector: QuantumState, 
  qubitIndex: number
): { alpha: Complex, beta: Complex } => {
  const numQubits = inferNumQubits(stateVector);
  if (numQubits > 1) {
    const reduced = reducedDensityMatrixForQubit(stateVector, qubitIndex);
    if (reduced) {
      const prob0 = Math.max(0, Math.min(1, reduced.rho00));
      const prob1 = Math.max(0, Math.min(1, reduced.rho11));

      const alphaMag = Math.sqrt(prob0);
      const betaMag = Math.sqrt(prob1);
      const phase = (Math.abs(reduced.rho01[0]) > 1e-12 || Math.abs(reduced.rho01[1]) > 1e-12)
        ? -Math.atan2(reduced.rho01[1], reduced.rho01[0])
        : 0;

      return {
        alpha: [alphaMag, 0],
        beta: [betaMag * Math.cos(phase), betaMag * Math.sin(phase)],
      };
    }
  }

  // Initialize amplitudes
  let alpha: Complex = [0, 0];
  let beta: Complex = [0, 0];
  
  // Check if we're dealing with a simple single-qubit state
  if (Object.keys(stateVector).length <= 2 && 
      Object.keys(stateVector).every(key => key.length === 1)) {
    alpha = stateVector['0'] || [0, 0];
    beta = stateVector['1'] || [0, 0];
  } else {
    // For multi-qubit states
    Object.entries(stateVector).forEach(([state, amplitude]) => {
      if (state.length <= qubitIndex) return;
      
      // Get the bit value at the specified position (from right to left)
      const bit = state[state.length - 1 - qubitIndex];
      
      // Add contribution to appropriate amplitude
      if (bit === '0') {
        alpha[0] += amplitude[0];
        alpha[1] += amplitude[1];
      } else {
        beta[0] += amplitude[0];
        beta[1] += amplitude[1];
      }
    });
  }
  
  // Calculate the total norm
  const normSquared = 
    alpha[0] * alpha[0] + alpha[1] * alpha[1] + 
    beta[0] * beta[0] + beta[1] * beta[1];
  
  // Prevent division by zero
  if (normSquared > 1e-10) {
    const norm = Math.sqrt(normSquared);
    alpha = [alpha[0] / norm, alpha[1] / norm];
    beta = [beta[0] / norm, beta[1] / norm];
  } else {
    // Default to |0⟩ state if norm is too small
    alpha = [1, 0];
    beta = [0, 0];
  }
  
  return { alpha, beta };
};

/**
 * Calculate probabilities for measuring |0⟩ and |1⟩ for a specific qubit
 * @param stateVector State vector
 * @param qubitIndex Index of qubit to analyze
 * @returns Array with [P(|0⟩), P(|1⟩)]
 */
export const calculateQubitProbabilities = (
  stateVector: QuantumState,
  qubitIndex: number
): [number, number] => {
  const { alpha, beta } = extractQubitAmplitudes(stateVector, qubitIndex);
  
  // Calculate probabilities
  const prob0 = alpha[0] * alpha[0] + alpha[1] * alpha[1];
  const prob1 = beta[0] * beta[0] + beta[1] * beta[1];
  
  // Ensure probabilities sum to 1
  const sum = prob0 + prob1;
  if (sum > 1e-10) {
    return [prob0 / sum, prob1 / sum];
  }
  
  // Default to |0⟩ state if sum is too small
  return [1, 0];
};
