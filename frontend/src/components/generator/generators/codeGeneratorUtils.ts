import { Gate, Qubit } from '../../../types/circuit';
import { OptimizationOptions } from '../types/optimizationTypes';
import { optimizeCircuit } from '../optimizers/circuitOptimizer';

/**
 * Common function to prepare gates for code generation
 * Includes optimization and sorting
 */
export const prepareGatesForCodeGeneration = (
  qubits: Qubit[],
  gates: Gate[],
  optimize: boolean,
  optimizationOptions: Partial<OptimizationOptions>,
  defaultOptions: OptimizationOptions
): { 
  processedGates: Gate[];
  imports: string[];
} => {
  // Apply optimization if requested
  const options = { ...defaultOptions, ...optimizationOptions };
  const processedGates = optimize ? optimizeCircuit(gates, options) : gates;

  // Sort gates by position (time)
  const sortedGates = [...processedGates].sort((a, b) => {
    return (a.position || 0) - (b.position || 0);
  });

  // Determine necessary imports for optimizations  
  const imports: string[] = [];

  if (optimize) {
    if (options.transpileToBackend) {
      if (imports.indexOf('from qiskit import transpile') === -1) {
        imports.push('from qiskit import transpile');
      }
    }
    
    if (options.enableAdvancedOptimization) {
      if (imports.indexOf('from qiskit.transpiler import PassManager') === -1) {
        imports.push('from qiskit.transpiler import PassManager');
        imports.push('from qiskit.transpiler.passes import *');
      }
    }
  }

  return { 
    processedGates: sortedGates,
    imports
  };
};

/**
 * Creates a group of gates by position
 */
export const groupGatesByPosition = (gates: Gate[]): Record<number, Gate[]> => {
  const gatesByPosition: Record<number, Gate[]> = {};
  
  gates.forEach(gate => {
    const pos = gate.position || 0;
    if (!gatesByPosition[pos]) {
      gatesByPosition[pos] = [];
    }
    gatesByPosition[pos].push(gate);
  });
  
  return gatesByPosition;
};

/**
 * Validates circuit input
 */
export const validateCircuitInput = (qubits: Qubit[], gates: Gate[]): boolean => {
  return qubits.length > 0 && gates.length > 0;
};

/**
 * Convert a user-provided angle to radians.
 * UI sliders typically provide degrees (often near-integers), while algorithm templates may use radians.
 */
export const coerceAngleToRadians = (value: unknown): number => {
  const angle = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(angle)) return 0;

  const nearInteger = Math.abs(angle - Math.round(angle)) < 1e-9;
  if (nearInteger && Math.abs(angle) <= 360) {
    return angle * Math.PI / 180;
  }

  if (Math.abs(angle) <= 2 * Math.PI) {
    return angle;
  }

  return angle * Math.PI / 180;
};
