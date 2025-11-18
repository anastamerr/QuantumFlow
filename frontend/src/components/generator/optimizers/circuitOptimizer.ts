import { Gate, Qubit } from '../../../types/circuit';
import { OptimizationOptions } from '../types/optimizationTypes';
import { applyAdvancedOptimization, defaultAdvancedOptions } from '../../../utils/circuitOptimizer';

/**
 * Applies basic circuit optimization by removing redundant gates
 * @param gates Array of gates to optimize
 * @param options Optimization options
 * @returns Optimized array of gates
 */
export const optimizeCircuit = (gates: Gate[], options: OptimizationOptions): Gate[] => {
  if (!options.consolidateGates && 
      !options.cancelAdjacentGates && 
      !options.convertGateSequences && 
      !options.enableAdvancedOptimization) {
    return gates; // No optimization needed
  }
  
  // Sort gates by position (time) and qubit
  let optimizedGates = [...gates].sort((a, b) => {
    if ((a.position || 0) === (b.position || 0)) {
      return (a.qubit || 0) - (b.qubit || 0);
    }
    return (a.position || 0) - (b.position || 0);
  });

  // Create a map of gates by qubit for easier processing
  const gatesByQubit: Record<number, Gate[]> = {};
  
  for (const gate of optimizedGates) {
    const qubit = gate.qubit || 0;
    if (!gatesByQubit[qubit]) {
      gatesByQubit[qubit] = [];
    }
    gatesByQubit[qubit].push(gate);
  }
  
  // Track gates to remove
  const gatesToRemove = new Set<string>();
  
  // Process each qubit's gate sequence
  if (options.cancelAdjacentGates) {
    Object.keys(gatesByQubit).forEach(qubitKey => {
      const qubit = parseInt(qubitKey);
      const qubitGates = gatesByQubit[qubit];
      
      for (let i = 0; i < qubitGates.length - 1; i++) {
        const currentGate = qubitGates[i];
        const nextGate = qubitGates[i + 1];
        
        // Skip gates that are already marked for removal
        if (gatesToRemove.has(currentGate.id) || gatesToRemove.has(nextGate.id)) {
          continue;
        }
        
        // Check for cancellable gates (e.g., adjacent X gates cancel out)
        if (currentGate.type === nextGate.type && 
            !hasParameters(currentGate) && !hasParameters(nextGate) &&
            !isControlledGate(currentGate) && !isControlledGate(nextGate) &&
            gatesOperateOnSameQubits(currentGate, nextGate) &&
            !hasIntermediateGatesOnSameQubits(optimizedGates, currentGate, nextGate)) {
          // These gate types cancel out when applied twice
          if (['x', 'y', 'z', 'h'].includes(currentGate.type)) {
            gatesToRemove.add(currentGate.id);
            gatesToRemove.add(nextGate.id);
            i++; // Skip the next gate since we've processed it
          }
        }
      }
    });
  }
  
  // Filter out removed gates
  optimizedGates = optimizedGates.filter(gate => !gatesToRemove.has(gate.id));
  
  // Apply advanced optimizations if enabled
  if (options.enableAdvancedOptimization && options.advancedOptions) {
    // We need qubits for some of the advanced optimization techniques
    // Create a dummy array of qubits for this purpose
    const maxQubitIndex = Math.max(...optimizedGates.map(g => Math.max(
      g.qubit || 0,
      ...((g.targets || []).length > 0 ? g.targets || [] : [0]),
      ...((g.controls || []).length > 0 ? g.controls || [] : [0])
    )));
    
    const dummyQubits: Qubit[] = Array.from({ length: maxQubitIndex + 1 }, (_, i) => ({
      id: i,
      name: `q${i}`
    }));
    
    optimizedGates = applyAdvancedOptimization(optimizedGates, dummyQubits, options.advancedOptions);
  }
  
  // Return the optimized gate list
  return optimizedGates;
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
    if (gate.id === g1.id || gate.id === g2.id) return false;
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
 * Checks if a gate has parameters
 */
export const hasParameters = (gate: Gate): boolean => {
  return !!gate.params && Object.keys(gate.params).length > 0;
};

/**
 * Checks if a gate is a controlled gate
 */
export const isControlledGate = (gate: Gate): boolean => {
  return ['cnot', 'cz', 'toffoli', 'mcx'].includes(gate.type) || 
         (!!gate.controls && gate.controls.length > 0);
};