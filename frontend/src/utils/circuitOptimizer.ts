import { Gate, Qubit } from '../types/circuit';
import { gateLibrary } from './gateLibrary';

/**
 * Advanced optimization techniques for quantum circuits
 */

/**
 * Hardware model representing a quantum processor's qubit topology and gate fidelities
 */
export interface HardwareModel {
  // Connectivity graph represented as an adjacency list
  connectivity: Record<number, number[]>;
  // Two-qubit gate error rates (from qubit i to qubit j)
  twoQubitErrors: Record<string, number>;
  // Single-qubit gate error rates
  singleQubitErrors: Record<number, number>;
  // Maximum circuit depth supported
  maxDepth?: number;
  // Name of the hardware model
  name: string;
}

/**
 * Hardware models for various quantum processors
 */
export const hardwareModels: Record<string, HardwareModel> = {
  // Linear topology (qubits connected in a line)
  'linear': {
    name: 'Linear Topology',
    connectivity: {
      0: [1],
      1: [0, 2],
      2: [1, 3],
      3: [2, 4],
      4: [3]
    },
    twoQubitErrors: {},
    singleQubitErrors: {},
  },
  // Grid topology (2D lattice)
  'grid': {
    name: 'Grid Topology',
    connectivity: {
      0: [1, 3],
      1: [0, 2, 4],
      2: [1, 5],
      3: [0, 4, 6],
      4: [1, 3, 5, 7],
      5: [2, 4, 8],
      6: [3, 7],
      7: [4, 6, 8],
      8: [5, 7]
    },
    twoQubitErrors: {},
    singleQubitErrors: {},
  },
  // Fully connected topology
  'fully_connected': {
    name: 'Fully Connected',
    connectivity: {
      0: [1, 2, 3, 4],
      1: [0, 2, 3, 4],
      2: [0, 1, 3, 4],
      3: [0, 1, 2, 4],
      4: [0, 1, 2, 3]
    },
    twoQubitErrors: {},
    singleQubitErrors: {},
  },
  // IBM Falcon topology (based on IBM Quantum processors)
  'ibm_falcon': {
    name: 'IBM Falcon Processor',
    connectivity: {
      0: [1, 5],
      1: [0, 2, 6],
      2: [1, 3, 7],
      3: [2, 4, 8],
      4: [3, 9],
      5: [0, 6, 10],
      6: [1, 5, 7, 11],
      7: [2, 6, 8, 12],
      8: [3, 7, 9, 13],
      9: [4, 8, 14],
      10: [5, 11, 15],
      11: [6, 10, 12, 16],
      12: [7, 11, 13, 17],
      13: [8, 12, 14, 18],
      14: [9, 13, 19],
      15: [10, 16],
      16: [11, 15, 17],
      17: [12, 16, 18],
      18: [13, 17, 19],
      19: [14, 18]
    },
    twoQubitErrors: {},  // Would contain real error rates in production
    singleQubitErrors: {},
  },
  // Google Sycamore topology
  'google_sycamore': {
    name: 'Google Sycamore',
    connectivity: {
      0: [1, 5, 6],
      1: [0, 2, 6, 7],
      2: [1, 3, 7, 8],
      3: [2, 4, 8, 9],
      4: [3, 9],
      5: [0, 6, 10],
      6: [0, 1, 5, 7, 11],
      7: [1, 2, 6, 8, 12],
      8: [2, 3, 7, 9, 13],
      9: [3, 4, 8, 14],
      10: [5, 11, 15],
      11: [6, 10, 12, 16],
      12: [7, 11, 13, 17],
      13: [8, 12, 14, 18],
      14: [9, 13, 19],
      15: [10, 16, 20],
      16: [11, 15, 17, 21],
      17: [12, 16, 18, 22],
      18: [13, 17, 19, 23],
      19: [14, 18, 24],
      20: [15, 21],
      21: [16, 20, 22],
      22: [17, 21, 23],
      23: [18, 22, 24],
      24: [19, 23]
    },
    twoQubitErrors: {},
    singleQubitErrors: {},
  }
};

/**
 * Advanced optimization options
 */
export interface AdvancedOptimizationOptions {
  // Circuit synthesis
  synthesisLevel: 0 | 1 | 2 | 3;  // 0: none, 1: basic, 2: medium, 3: aggressive
  
  // Noise-aware optimization
  noiseAware: boolean;
  hardwareModel: string;  // Key from hardwareModels
  
  // Circuit depth reduction
  depthReduction: boolean;
  maxDepth?: number;  // Maximum allowed circuit depth (null for no limit)
  
  // Qubit mapping
  qubitMapping: boolean;
  preserveLayout: boolean;  // If true, try to maintain original qubit layout when mapping
}

// Default advanced optimization options
export const defaultAdvancedOptions: AdvancedOptimizationOptions = {
  synthesisLevel: 1,
  noiseAware: false,
  hardwareModel: 'linear',
  depthReduction: false,
  qubitMapping: false,
  preserveLayout: true
};

/**
 * Calculate circuit depth (maximum time step across all qubits)
 */
export const calculateCircuitDepth = (gates: Gate[]): number => {
  if (gates.length === 0) return 0;
  
  return Math.max(...gates.map(g => g.position || 0)) + 1;
};

/**
 * Identify gate sequences that can be merged or simplified
 * Returns pairs of gate indices that can be optimized
 */
export const findOptimizableSequences = (gates: Gate[]): [number, number][] => {
  const optimizablePairs: [number, number][] = [];
  const gatesByQubit: Record<number, Gate[]> = {};
  
  // Group gates by qubit (including control/target qubits for multi-qubit gates)
  gates.forEach(gate => {
    const qubits = getGateQubits(gate);
    qubits.forEach(qubit => {
      if (!gatesByQubit[qubit]) {
        gatesByQubit[qubit] = [];
      }
      gatesByQubit[qubit].push(gate);
    });
  });
  
  // Sort gates for each qubit by position
  for (const qubit in gatesByQubit) {
    gatesByQubit[qubit].sort((a, b) => (a.position || 0) - (b.position || 0));
  }
  
  // Look for adjacent gates that can be optimized
  for (const qubit in gatesByQubit) {
    const qubitGates = gatesByQubit[qubit];
    
    for (let i = 0; i < qubitGates.length - 1; i++) {
      const g1 = qubitGates[i];
      const g2 = qubitGates[i + 1];
      
      // Skip if gates don't operate on the same qubits
      if (!gatesOperateOnSameQubits(g1, g2)) continue;
      
      // Check if there are any gates between these two that would prevent optimization
      if (hasIntermediateGatesOnSameQubits(gates, g1, g2)) continue;
      
      // Look for specific patterns that can be optimized
      
      // 1. Two identical Pauli gates cancel out (X-X, Y-Y, Z-Z)
      if (g1.type === g2.type && ['x', 'y', 'z'].includes(g1.type) && 
          !hasParameters(g1) && !hasParameters(g2) && 
          !isControlledGate(g1) && !isControlledGate(g2)) {
        optimizablePairs.push([gates.indexOf(g1), gates.indexOf(g2)]);
      }
      
      // 2. Two Hadamard gates cancel out
      else if (g1.type === 'h' && g2.type === 'h' && 
               !hasParameters(g1) && !hasParameters(g2) &&
               !isControlledGate(g1) && !isControlledGate(g2)) {
        optimizablePairs.push([gates.indexOf(g1), gates.indexOf(g2)]);
      }
      
      // 3. Rotation gates of the same type can be combined
      else if (g1.type === g2.type && ['rx', 'ry', 'rz'].includes(g1.type) && 
               g1.params && g2.params && 
               !isControlledGate(g1) && !isControlledGate(g2)) {
        optimizablePairs.push([gates.indexOf(g1), gates.indexOf(g2)]);
      }
      
      // 4. CNOT gates on same control-target pair cancel out
      else if (g1.type === 'cnot' && g2.type === 'cnot' &&
               g1.qubit === g2.qubit && 
               arraysEqual(g1.targets || [], g2.targets || [])) {
        optimizablePairs.push([gates.indexOf(g1), gates.indexOf(g2)]);
      }
      
      // 5. Look for H-*-H patterns (check for exactly one gate between)
      else if (g1.type === 'h' && i + 2 < qubitGates.length && qubitGates[i + 2].type === 'h') {
        const middleGate = qubitGates[i + 1];
        if ((middleGate.type === 'x' || middleGate.type === 'z') && 
            gatesOperateOnSameQubits(g1, middleGate) &&
            gatesOperateOnSameQubits(middleGate, qubitGates[i + 2]) &&
            !hasIntermediateGatesOnSameQubits(gates, g1, qubitGates[i + 2])) {
          optimizablePairs.push([gates.indexOf(g1), gates.indexOf(qubitGates[i + 2])]);
        }
      }
    }
  }
  
  return optimizablePairs;
};

/**
 * Helper function to get all qubits a gate operates on
 */
const getGateQubits = (gate: Gate): Set<number> => {
  const qubits = new Set<number>();
  if (gate.qubit !== undefined) qubits.add(gate.qubit);
  if (gate.targets) gate.targets.forEach(q => qubits.add(q));
  if (gate.controls) gate.controls.forEach(q => qubits.add(q));
  return qubits;
};

/**
 * Check if two gates operate on the exact same set of qubits
 */
const gatesOperateOnSameQubits = (g1: Gate, g2: Gate): boolean => {
  const qubits1 = getGateQubits(g1);
  const qubits2 = getGateQubits(g2);
  
  if (qubits1.size !== qubits2.size) return false;
  
  for (const qubit of qubits1) {
    if (!qubits2.has(qubit)) return false;
  }
  
  return true;
};

/**
 * Check if there are gates between g1 and g2 that operate on the same qubits
 */
const hasIntermediateGatesOnSameQubits = (allGates: Gate[], g1: Gate, g2: Gate): boolean => {
  const pos1 = g1.position || 0;
  const pos2 = g2.position || 0;
  const targetQubits = getGateQubits(g1);
  
  return allGates.some(gate => {
    const gatePos = gate.position || 0;
    if (gatePos > pos1 && gatePos < pos2) {
      const gateQubits = getGateQubits(gate);
      // Check if this intermediate gate shares any qubits with our target gates
      for (const qubit of gateQubits) {
        if (targetQubits.has(qubit)) return true;
      }
    }
    return false;
  });
};

/**
 * Check if a gate has parameters
 */
const hasParameters = (gate: Gate): boolean => {
  return !!gate.params && Object.keys(gate.params).length > 0;
};

/**
 * Check if a gate is a controlled gate
 */
const isControlledGate = (gate: Gate): boolean => {
  return ['cnot', 'cz', 'toffoli'].includes(gate.type) || 
         (!!gate.controls && gate.controls.length > 0);
};

/**
 * Check if two arrays are equal
 */
const arraysEqual = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

/**
 * Circuit synthesis: convert the circuit to an equivalent form with fewer gates
 */
export const synthesizeCircuit = (gates: Gate[], level: 0 | 1 | 2 | 3): Gate[] => {
    if (level === 0) return [...gates];
    
    // Clone gates to avoid modifying the original
    let synthesized = [...gates];
    let optimizationsMade = true;
    
    // Apply optimization iterations until no more optimizations can be made
    for (let iteration = 0; iteration < level && optimizationsMade; iteration++) {
      const initialGateCount = synthesized.length;
      
      // Find sequences that can be optimized
      const optimizablePairs = findOptimizableSequences(synthesized);
      
      // Skip if no more optimizations found
      if (optimizablePairs.length === 0) {
        optimizationsMade = false;
        break;
      }
      
      // Mark gates to remove (we'll do this instead of removing immediately to avoid index changes)
      const gatesToRemove = new Set<number>();
      const gatesToAdd: Gate[] = [];
      
      // Process each optimizable pair
      for (const [i1, i2] of optimizablePairs) {
        if (gatesToRemove.has(i1) || gatesToRemove.has(i2)) continue;
        
        const g1 = synthesized[i1];
        const g2 = synthesized[i2];
        
        // Handle different optimization patterns
        
        // 1. Two gates of same type that cancel (H-H, X-X, Z-Z, Y-Y)
        if ((g1.type === g2.type) && ['h', 'x', 'z', 'y'].includes(g1.type) &&
            !hasParameters(g1) && !hasParameters(g2) &&
            !isControlledGate(g1) && !isControlledGate(g2)) {
          gatesToRemove.add(i1);
          gatesToRemove.add(i2);
        }
        
        // 2. CNOT gates cancel out
        else if (g1.type === 'cnot' && g2.type === 'cnot' &&
                 g1.qubit === g2.qubit && 
                 arraysEqual(g1.targets || [], g2.targets || [])) {
          gatesToRemove.add(i1);
          gatesToRemove.add(i2);
        }
        
        // 3. Combine rotation gates of same type
        else if (g1.type === g2.type && ['rx', 'ry', 'rz'].includes(g1.type) && 
                 g1.params && g2.params &&
                 !isControlledGate(g1) && !isControlledGate(g2)) {
          gatesToRemove.add(i1);
          gatesToRemove.add(i2);
          
          // Get parameter names based on gate type
          let paramName: string;
          switch (g1.type) {
            case 'rx':
              paramName = 'theta';
              break;
            case 'ry':
              paramName = 'theta';
              break;
            case 'rz':
              paramName = 'phi';
              break;
            default:
              paramName = 'theta';
          }
          
          // Add a combined rotation gate with proper angle handling
          const angle1 = Number(g1.params[paramName] || 0);
          const angle2 = Number(g2.params[paramName] || 0);
          const rawCombined = (angle1 + angle2) % 360;
          const combinedAngle = rawCombined < 0 ? rawCombined + 360 : rawCombined;
          
          // Only add if the combined angle is not effectively zero
          if (Math.abs(combinedAngle) > 1e-10 && Math.abs(combinedAngle - 360) > 1e-10) {
            gatesToAdd.push({
              ...g1,
              id: `gate-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              params: { ...g1.params, [paramName]: combinedAngle }
            });
          }
        }
        
        // 4. Handle H-*-H patterns 
        else if (g1.type === 'h' && g2.type === 'h' && g1.qubit === g2.qubit) {
          // Find what gate is between these two H gates
          const pos1 = g1.position || 0;
          const pos2 = g2.position || 0;
          
          // Look for the middle gate between these two H gates on the same qubit
          let middleGate: Gate | null = null;
          for (const gate of synthesized) {
            const gatePos = gate.position || 0;
            if (gatePos > pos1 && gatePos < pos2 && gate.qubit === g1.qubit &&
                !gatesToRemove.has(synthesized.indexOf(gate))) {
              if (!middleGate || gatePos < (middleGate.position || 0)) {
                middleGate = gate;
              }
            }
          }
          
          if (middleGate && (middleGate.type === 'x' || middleGate.type === 'z') &&
              !hasParameters(middleGate) && !isControlledGate(middleGate)) {
            const middleIndex = synthesized.indexOf(middleGate);
            
            // Only proceed if middleGate isn't already marked for removal
            if (!gatesToRemove.has(middleIndex)) {
              gatesToRemove.add(i1);  // First H
              gatesToRemove.add(i2);  // Second H
              gatesToRemove.add(middleIndex); // Middle gate
              
              // H-X-H = Z, H-Z-H = X
              const newGateType = middleGate.type === 'x' ? 'z' : 'x';
              const gateDef = gateLibrary.find(g => g.id === newGateType);
              
              gatesToAdd.push({
                id: `gate-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                type: newGateType,
                qubit: g1.qubit,
                position: g1.position,
                name: gateDef?.name || `Pauli-${newGateType.toUpperCase()}`,
                symbol: gateDef?.symbol || newGateType.toUpperCase(),
                description: gateDef?.description || `${newGateType} gate`,
                category: gateDef?.category || 'Single-Qubit Gates',
                color: gateDef?.color || (newGateType === 'x' ? 'red' : 'purple')
              });
            }
          }
        }
      }
      
      // Remove optimized gates
      synthesized = synthesized.filter((_, index) => !gatesToRemove.has(index));
      
      // Add new gates
      synthesized = [...synthesized, ...gatesToAdd];
      
      // Sort by position and qubit for next iteration
      synthesized.sort((a, b) => {
        const posA = a.position || 0;
        const posB = b.position || 0;
        if (posA !== posB) return posA - posB;
        return (a.qubit || 0) - (b.qubit || 0);
      });
      
      // Check if we made any progress
      optimizationsMade = synthesized.length < initialGateCount || gatesToAdd.length > 0;
    }
    
    return synthesized;
  };
  
// Add a helper function to create fully typed gates
export const createGate = (type: string, qubit: number, position: number): Gate => {
  // Find the gate definition from the library
  const gateDef = gateLibrary.find(g => g.id === type);
  
  return {
    id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    qubit,
    position,
    // Add required Gate properties with defaults if gateDef not found
    name: gateDef?.name || `${type.toUpperCase()} Gate`,
    symbol: gateDef?.symbol || type.toUpperCase(),
    description: gateDef?.description || `${type} gate`,
    category: gateDef?.category || 'Gates',
    color: gateDef?.color || 'gray'
  };
};

/**
 * Reduce circuit depth by parallelizing gates when possible
 */
export const reduceCircuitDepth = (gates: Gate[], maxDepth?: number): Gate[] => {
  if (gates.length === 0) return [];
  
  // Clone gates to avoid modifying the original
  const optimizedGates = [...gates];
  
  // Create dependency graph for the gates
  const dependencies = new Map<string, Set<string>>();
  
  // Initialize dependency sets
  optimizedGates.forEach(gate => {
    dependencies.set(gate.id, new Set<string>());
  });
  
  // Create a helper function to get all qubits used by a gate
  const getGateQubits = (gate: Gate): Set<number> => {
    const qubits = new Set<number>();
    if (gate.qubit !== undefined) qubits.add(gate.qubit);
    if (gate.targets) gate.targets.forEach(q => qubits.add(q));
    if (gate.controls) gate.controls.forEach(q => qubits.add(q));
    return qubits;
  };

  // For each gate, determine which gates must execute before it
  for (let i = 0; i < optimizedGates.length; i++) {
    const gate1 = optimizedGates[i];
    const qubits1 = getGateQubits(gate1);
    
    for (let j = i + 1; j < optimizedGates.length; j++) {
      const gate2 = optimizedGates[j];
      const pos1 = gate1.position || 0;
      const pos2 = gate2.position || 0;
      
      const qubits2 = getGateQubits(gate2);
      
      // Check if gates share any qubits (have a dependency)
      const hasOverlap = [...qubits1].some(q => qubits2.has(q));
      
      // If gates share qubits, the later gate depends on the earlier one
      if (hasOverlap) {
        if (pos1 <= pos2) {
          dependencies.get(gate2.id)?.add(gate1.id);
        } else {
          dependencies.get(gate1.id)?.add(gate2.id);
        }
      }
    }
  }
  
  // Topologically sort the gates
  const visited = new Set<string>();
  const temp = new Set<string>();
  const order: string[] = [];
  
  const visit = (id: string) => {
    if (temp.has(id)) return; // Cycle detected (should not happen in valid circuits)
    if (visited.has(id)) return;
    
    temp.add(id);
    
    // Visit dependencies first
    const deps = dependencies.get(id) || new Set<string>();
    for (const depId of deps) {
      visit(depId);
    }
    
    temp.delete(id);
    visited.add(id);
    order.push(id);
  };
  
  // Visit all gates
  for (const gate of optimizedGates) {
    visit(gate.id);
  }
  
  // Re-assign positions to minimize circuit depth
  const idToGate = new Map<string, Gate>();
  optimizedGates.forEach(gate => idToGate.set(gate.id, gate));
  
  const qubitLastPos = new Map<number, number>();
  
  // Assign new positions, minimizing depth
  for (const id of order) {
    const gate = idToGate.get(id);
    if (!gate) continue;
    
    // Find the earliest position this gate can be placed
    const gateQubits = getGateQubits(gate);
    
    // Find the earliest time step where all needed qubits are available
    let earliestPos = 0;
    for (const q of gateQubits) {
      earliestPos = Math.max(earliestPos, qubitLastPos.get(q) || 0);
    }
    
    // Assign the new position
    gate.position = earliestPos;
    
    // Update the last position for all qubits used by this gate
    for (const q of gateQubits) {
      qubitLastPos.set(q, earliestPos + 1);
    }
  }
  
  // Apply max depth constraint if specified
  if (maxDepth !== undefined) {
    const actualDepth = calculateCircuitDepth(optimizedGates);
    if (actualDepth > maxDepth) {
      // Avoid unsafe compression that can violate dependencies.
      console.warn(
        `reduceCircuitDepth: unable to fit circuit depth ${actualDepth} into maxDepth ${maxDepth} without breaking dependencies.`
      );
    }
  }
  
  return optimizedGates;
};

/**
 * Map qubits to hardware connectivity
 */
export const mapQubitToHardware = (
  gates: Gate[], 
  qubits: Qubit[], 
  hardwareModel: HardwareModel,
  preserveLayout: boolean
): Gate[] => {
  if (gates.length === 0) return [];
  
  // Clone gates to avoid modifying the original
  const mappedGates = [...gates];
  
  // If preserving layout, try to find a subgraph isomorphism, otherwise
  // use a more general approach
  if (preserveLayout) {
    // In a real implementation, we would find a subgraph isomorphism here
    // For this example, we'll use a simple approach
    
    // Get the set of connected qubits in the circuit
    const connectedPairs = new Set<string>();
    mappedGates.forEach(gate => {
      if ((gate.type === 'cnot' || gate.type === 'cz' || gate.type === 'swap') && 
          gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
        const q1 = Math.min(gate.qubit, gate.targets[0]);
        const q2 = Math.max(gate.qubit, gate.targets[0]);
        connectedPairs.add(`${q1}-${q2}`);
      }
    });
    
    // Check if current layout fits in hardware
    let fits = true;
    for (const pairStr of connectedPairs) {
      const [q1, q2] = pairStr.split('-').map(Number);
      
      // Check if this connection exists in hardware
      const connected = hardwareModel.connectivity[q1]?.includes(q2) || 
                       hardwareModel.connectivity[q2]?.includes(q1);
      
      if (!connected) {
        fits = false;
        break;
      }
    }
    
    // If the layout fits, no changes needed
    if (fits) return mappedGates;
  }
  
  // For more complex mapping, we'd use more sophisticated algorithms here
  // For this example, we'll use a greedy approach to remap qubits
  
  // Generate a mapping from logical to physical qubits
  const logicalToPhysical = new Map<number, number>();
  const physicalToLogical = new Map<number, number>();
  
  // First, list the physical qubits available in the hardware model
  const physicalQubits = Object.keys(hardwareModel.connectivity).map(Number);
  
  // Count the number of 2-qubit gates for each qubit pair to determine importance
  const pairCounts = new Map<string, number>();
  mappedGates.forEach(gate => {
    if ((gate.type === 'cnot' || gate.type === 'cz' || gate.type === 'swap') && 
        gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
      const q1 = Math.min(gate.qubit, gate.targets[0]);
      const q2 = Math.max(gate.qubit, gate.targets[0]);
      const pairKey = `${q1}-${q2}`;
      pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
    }
  });
  
  // Sort qubit pairs by count (most important first) and validate connectivity
  const sortedPairs = [...pairCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([pairKey]) => pairKey.split('-').map(Number))
    .filter(([, ]) => {
      // Only include pairs that can potentially be mapped to hardware
      return physicalQubits.length >= 2;
    });
  
  // Greedy assignment: place most important pairs first with connectivity validation
  for (const [q1, q2] of sortedPairs) {
    // Skip if both qubits are already assigned
    if (logicalToPhysical.has(q1) && logicalToPhysical.has(q2)) {
      // Verify the existing mapping maintains connectivity
      const p1 = logicalToPhysical.get(q1)!;
      const p2 = logicalToPhysical.get(q2)!;
      if (!hardwareModel.connectivity[p1]?.includes(p2)) {
        // Invalid mapping, need to reassign
        logicalToPhysical.delete(q1);
        logicalToPhysical.delete(q2);
        physicalToLogical.delete(p1);
        physicalToLogical.delete(p2);
      } else {
        continue; // Valid mapping exists
      }
    }
    
    // If one qubit is assigned, try to find a compatible match
    if (logicalToPhysical.has(q1)) {
      const p1 = logicalToPhysical.get(q1)!;
      const possibleP2 = hardwareModel.connectivity[p1]?.filter(p => !physicalToLogical.has(p)) || [];
      
      if (possibleP2.length > 0) {
        const p2 = possibleP2[0];
        logicalToPhysical.set(q2, p2);
        physicalToLogical.set(p2, q2);
      }
    } 
    else if (logicalToPhysical.has(q2)) {
      const p2 = logicalToPhysical.get(q2)!;
      const possibleP1 = hardwareModel.connectivity[p2]?.filter(p => !physicalToLogical.has(p)) || [];
      
      if (possibleP1.length > 0) {
        const p1 = possibleP1[0];
        logicalToPhysical.set(q1, p1);
        physicalToLogical.set(p1, q1);
      }
    }
    // If neither qubit is assigned, find an available connected pair
    else {
      // Find an available connected pair in the hardware
      let found = false;
      for (let i = 0; i < physicalQubits.length && !found; i++) {
        const p1 = physicalQubits[i];
        if (physicalToLogical.has(p1)) continue;
        
        const connectedQubits = hardwareModel.connectivity[p1] || [];
        for (const p2 of connectedQubits) {
          if (!physicalToLogical.has(p2)) {
            // Verify this is a valid bidirectional connection
            if (hardwareModel.connectivity[p2]?.includes(p1)) {
              // Assign both qubits
              logicalToPhysical.set(q1, p1);
              physicalToLogical.set(p1, q1);
              logicalToPhysical.set(q2, p2);
              physicalToLogical.set(p2, q2);
              found = true;
              break;
            }
          }
        }
      }
    }
  }
  
  // Assign remaining qubits to any available physical qubits
  for (const qubit of qubits) {
    if (!logicalToPhysical.has(qubit.id)) {
      for (const p of physicalQubits) {
        if (!physicalToLogical.has(p)) {
          logicalToPhysical.set(qubit.id, p);
          physicalToLogical.set(p, qubit.id);
          break;
        }
      }
    }
  }
  
  // Return gates with remapped qubits (if remapping is complete)
  if (qubits.every(q => logicalToPhysical.has(q.id))) {
    // Clone gates and update qubit indices
    return mappedGates.map(gate => {
      const newGate = { ...gate };
      
      // Remap main qubit
      if (newGate.qubit !== undefined) {
        newGate.qubit = logicalToPhysical.get(newGate.qubit) ?? newGate.qubit;
      }
      
      // Remap target qubits
      if (newGate.targets) {
        newGate.targets = newGate.targets.map(t => logicalToPhysical.get(t) ?? t);
      }
      
      // Remap control qubits
      if (newGate.controls) {
        newGate.controls = newGate.controls.map(c => logicalToPhysical.get(c) ?? c);
      }
      
      return newGate;
    });
  }
  
  // If mapping is incomplete, return original gates
  return mappedGates;
};

/**
 * Apply noise-aware optimizations based on hardware model
 */
export const optimizeForNoiseAware = (
  gates: Gate[], 
  _qubits: Qubit[], 
  _hardwareModel: HardwareModel
): Gate[] => {
  if (gates.length === 0) return [];
  
  // Clone gates to avoid modifying the original
  const optimizedGates = [...gates];
  
  // For a real implementation, we would use more sophisticated modeling here
  // For this example, we'll use a simple heuristic to reduce CNOT count
  
  // Count CNOT gates (most error-prone)
  const cnotCount = optimizedGates.filter(g => g.type === 'cnot').length;
  
  // If we have many CNOTs, try to reduce them
  if (cnotCount > 5) {
    // Look for patterns where we can convert CNOT gates to equivalent forms
    // For this example, we'll just identify adjacent CNOTs on the same qubits
    const gatesByQubit: Record<string, Gate[]> = {};
    
    // Group gates by control-target pair
    optimizedGates.forEach(gate => {
      if (gate.type === 'cnot' && gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
        const key = `${gate.qubit}-${gate.targets[0]}`;
        if (!gatesByQubit[key]) {
          gatesByQubit[key] = [];
        }
        gatesByQubit[key].push(gate);
      }
    });
    
    // For each pair, sort by position and remove pairs of CNOTs (they cancel out)
    for (const key in gatesByQubit) {
      const pairGates = gatesByQubit[key];
      if (pairGates.length >= 2) {
        // Sort by position
        pairGates.sort((a, b) => (a.position || 0) - (b.position || 0));
        
        // Mark gates for removal if they appear in adjacent pairs
        const gatesToRemove = new Set<string>();
        let i = 0;
        while (i < pairGates.length - 1) {
          // Check if there are no gates between these CNOTs
          const pos1 = pairGates[i].position || 0;
          const pos2 = pairGates[i + 1].position || 0;
          
          // Get all qubits involved in this CNOT operation
          const controlQubit = pairGates[i].qubit;
          const targetQubit = pairGates[i].targets?.[0];
          
          // Check if there are no gates in between on these qubits
          let hasGatesBetween = false;
          for (const g of optimizedGates) {
            const gPos = g.position || 0;
            if (gPos > pos1 && gPos < pos2) {
              // Check if this gate affects either the control or target qubit
              const gateQubits = new Set<number>();
              if (g.qubit !== undefined) gateQubits.add(g.qubit);
              if (g.targets) g.targets.forEach(q => gateQubits.add(q));
              if (g.controls) g.controls.forEach(q => gateQubits.add(q));
              
              if ((controlQubit !== undefined && gateQubits.has(controlQubit)) ||
                  (targetQubit !== undefined && gateQubits.has(targetQubit))) {
                hasGatesBetween = true;
                break;
              }
            }
          }
          
          if (!hasGatesBetween) {
            gatesToRemove.add(pairGates[i].id);
            gatesToRemove.add(pairGates[i + 1].id);
            i += 2; // Skip both gates since we've processed them
          } else {
            i += 1; // Move to next gate
          }
        }
        
        // Remove cancelled CNOTs
        if (gatesToRemove.size > 0) {
          for (let i = optimizedGates.length - 1; i >= 0; i--) {
            if (gatesToRemove.has(optimizedGates[i].id)) {
              optimizedGates.splice(i, 1);
            }
          }
        }
      }
    }
  }
  
  return optimizedGates;
};

/**
 * Apply advanced optimization techniques to a quantum circuit
 * @param gates Array of gates to optimize
 * @param qubits Array of qubits in the circuit
 * @param options Advanced optimization options
 * @returns Optimized array of gates
 */
export const applyAdvancedOptimization = (
  gates: Gate[], 
  qubits: Qubit[], 
  options: AdvancedOptimizationOptions
): Gate[] => {
  if (gates.length === 0) return [];
  
  // Start with cloned gates
  let optimized = [...gates];
  
  // Apply circuit synthesis if enabled
  if (options.synthesisLevel > 0) {
    optimized = synthesizeCircuit(optimized, options.synthesisLevel);
  }
  
  // Apply noise-aware optimization if enabled
  if (options.noiseAware && hardwareModels[options.hardwareModel]) {
    optimized = optimizeForNoiseAware(
      optimized, 
      qubits, 
      hardwareModels[options.hardwareModel]
    );
  }
  
  // Apply qubit mapping if enabled
  if (options.qubitMapping && hardwareModels[options.hardwareModel]) {
    optimized = mapQubitToHardware(
      optimized,
      qubits,
      hardwareModels[options.hardwareModel],
      options.preserveLayout
    );
  }
  
  // Apply circuit depth reduction if enabled
  if (options.depthReduction) {
    optimized = reduceCircuitDepth(optimized, options.maxDepth);
  }
  
  return optimized;
};

/**
 * Estimate the gate count reduction from advanced optimization
 * @param gates Array of gates to analyze
 * @param qubits Array of qubits in the circuit
 * @param options Advanced optimization options
 * @returns Estimated gate count after optimization
 */
/**
 * Calculate actual optimization results by applying optimizations and comparing
 */
export const calculateActualOptimizationImpact = (
  gates: Gate[],
  qubits: Qubit[],
  options: AdvancedOptimizationOptions
): {
  originalGateCount: number;
  optimizedGateCount: number;
  originalDepth: number;
  optimizedDepth: number;
  reductionPercentage: number;
  gatesRemoved: number;
  gatesAdded: number;
  optimizationDetails: {
    cancelledPairs: number;
    combinedRotations: number;
    hxhToZ: number;
    hzhToX: number;
    removedCnots: number;
  };
} => {
  const originalGateCount = gates.length;
  const originalDepth = calculateCircuitDepth(gates);
  
  if (originalGateCount === 0) {
    return {
      originalGateCount: 0,
      optimizedGateCount: 0,
      originalDepth: 0,
      optimizedDepth: 0,
      reductionPercentage: 0,
      gatesRemoved: 0,
      gatesAdded: 0,
      optimizationDetails: {
        cancelledPairs: 0,
        combinedRotations: 0,
        hxhToZ: 0,
        hzhToX: 0,
        removedCnots: 0
      }
    };
  }
  
  // Apply actual optimizations and track what happens
  const optimizedGates = applyAdvancedOptimization(gates, qubits, options);
  const optimizedGateCount = optimizedGates.length;
  const optimizedDepth = calculateCircuitDepth(optimizedGates);
  
  // Calculate detailed optimization metrics
  const gatesRemoved = Math.max(0, originalGateCount - optimizedGateCount);
  const gatesAdded = Math.max(0, optimizedGateCount - originalGateCount);
  const reductionPercentage = originalGateCount > 0 ? 
    Math.round(((originalGateCount - optimizedGateCount) / originalGateCount) * 100) : 0;
  
  // Analyze what optimizations were applied
  const optimizationDetails = analyzeOptimizationDetails(gates, optimizedGates);
  
  return {
    originalGateCount,
    optimizedGateCount,
    originalDepth,
    optimizedDepth,
    reductionPercentage,
    gatesRemoved,
    gatesAdded,
    optimizationDetails
  };
};

/**
 * Analyze what specific optimizations were applied
 */
export const analyzeOptimizationDetails = (
  originalGates: Gate[],
  optimizedGates: Gate[]
): {
  cancelledPairs: number;
  combinedRotations: number;
  hxhToZ: number;
  hzhToX: number;
  removedCnots: number;
} => {
  // Count original gate types
  const originalCounts = countGateTypes(originalGates);
  const optimizedCounts = countGateTypes(optimizedGates);
  
  // Calculate specific optimizations
  const cancelledPairs = Math.max(0, 
    (originalCounts.x - optimizedCounts.x) / 2 +
    (originalCounts.y - optimizedCounts.y) / 2 +
    (originalCounts.z - optimizedCounts.z) / 2 +
    (originalCounts.h - optimizedCounts.h) / 2
  );
  
  const combinedRotations = Math.max(0,
    (originalCounts.rx - optimizedCounts.rx) / 2 +
    (originalCounts.ry - optimizedCounts.ry) / 2 +
    (originalCounts.rz - optimizedCounts.rz) / 2
  );
  
  const removedCnots = Math.max(0, originalCounts.cnot - optimizedCounts.cnot);
  
  // For H-X-H and H-Z-H patterns, we need to estimate based on gate changes
  const hxhToZ = Math.max(0, (originalCounts.h - optimizedCounts.h) / 2 - 
    (optimizedCounts.z - originalCounts.z));
  const hzhToX = Math.max(0, (originalCounts.h - optimizedCounts.h) / 2 - 
    (optimizedCounts.x - originalCounts.x));
  
  return {
    cancelledPairs: Math.floor(cancelledPairs),
    combinedRotations: Math.floor(combinedRotations),
    hxhToZ: Math.floor(Math.max(0, hxhToZ)),
    hzhToX: Math.floor(Math.max(0, hzhToX)),
    removedCnots: Math.floor(removedCnots)
  };
};

/**
 * Count gates by type
 */
const countGateTypes = (gates: Gate[]): Record<string, number> => {
  const counts: Record<string, number> = {
    x: 0, y: 0, z: 0, h: 0, rx: 0, ry: 0, rz: 0, cnot: 0, cz: 0, swap: 0
  };
  
  gates.forEach(gate => {
    if (counts.hasOwnProperty(gate.type)) {
      counts[gate.type]++;
    }
  });
  
  return counts;
};

/**
 * Legacy function maintained for backward compatibility
 * @deprecated Use calculateActualOptimizationImpact instead
 */
export const estimateOptimizationImpact = (
  gates: Gate[],
  qubits: Qubit[],
  options: AdvancedOptimizationOptions
): { 
  originalGateCount: number;
  estimatedGateCount: number;
  originalDepth: number;
  estimatedDepth: number;
  reductionPercentage: number;
} => {
  const actual = calculateActualOptimizationImpact(gates, qubits, options);
  return {
    originalGateCount: actual.originalGateCount,
    estimatedGateCount: actual.optimizedGateCount,
    originalDepth: actual.originalDepth,
    estimatedDepth: actual.optimizedDepth,
    reductionPercentage: actual.reductionPercentage
  };
};
