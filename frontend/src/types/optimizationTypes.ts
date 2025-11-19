import { AdvancedOptimizationOptions } from '../utils/circuitOptimizer';

/**
 * Optimization options for quantum circuits
 */
export interface OptimizationOptions {
  /**
   * Consolidate adjacent gates of the same type when possible
   */
  consolidateGates: boolean;
  
  /**
   * Cancel out gates that nullify each other (e.g., two adjacent X gates)
   */
  cancelAdjacentGates: boolean;
  
  /**
   * Convert certain gate sequences to their equivalent shorter form
   * (e.g., H-Z-H becomes X)
   */
  convertGateSequences: boolean;
  
  /**
   * Transpile the circuit to a minimal gate set for the target backend
   */
  transpileToBackend: boolean;
  
  /**
   * Backend to optimize for (default: 'qasm_simulator')
   */
  backendName?: string;

  /**
   * Enable advanced optimization techniques
   */
  enableAdvancedOptimization?: boolean;

  /**
   * Advanced optimization options
   */
  advancedOptions?: AdvancedOptimizationOptions;
}

// Default optimization options
export const defaultOptimizationOptions: OptimizationOptions = {
  consolidateGates: false,
  cancelAdjacentGates: false,
  convertGateSequences: false,
  transpileToBackend: false,
  backendName: 'qasm_simulator',
  enableAdvancedOptimization: false,
  advancedOptions: undefined // This will be imported from circuitOptimizer
};