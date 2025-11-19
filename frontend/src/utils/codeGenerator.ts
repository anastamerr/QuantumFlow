/**
 * @file Main entry point for code generation utilities
 * 
 * This file provides the primary interface for generating quantum circuit code in
 * various formats (Qiskit, Cirq, Braket, JSON) from a quantum circuit definition.
 */

// Import Types
import { Gate, Qubit } from '../types/circuit';
import { OptimizationOptions, defaultOptimizationOptions } from '../components/generator/types/optimizationTypes';

// Import Generator Functions
import { generateQiskitCode } from '../components/generator/generators/qiskitGenerator';
import { generateCirqCode } from '../components/generator/generators/cirqGenerator';
import { generateBraketCode } from '../components/generator/generators/braketGenerator';
import { generateCircuitJSON } from '../components/generator/generators/jsonGenerator';

// Import Optimization Utilities
import { optimizeCircuit } from '../components/generator/optimizers/circuitOptimizer';

/**
 * Updates the code panel's UI to include optimization options
 * For use with ExportPanel and CodePanel
 */
export const getOptimizationUI = (
  optimize: boolean,
  setOptimize: (value: boolean) => void,
  optimizationOptions: OptimizationOptions,
  setOptimizationOptions: (options: OptimizationOptions) => void
) => {
  // Implementation would depend on the UI framework being used
  // This is a placeholder for the actual UI component
  return {
    optimize,
    setOptimize,
    optimizationOptions,
    setOptimizationOptions
  };
};

// Export all the main functions
export {
  // Generator functions
  generateQiskitCode,
  generateCirqCode,
  generateBraketCode,
  generateCircuitJSON,
  
  // Optimizer utilities
  optimizeCircuit,
};

// Export types with the export type syntax
export type { OptimizationOptions };

// Export values
export { defaultOptimizationOptions };