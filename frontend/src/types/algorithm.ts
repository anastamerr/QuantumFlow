/**
 * @file Algorithm type definitions for the Quantum Algorithm Library
 */

import { Gate } from './circuit';

/**
 * Parameter types for algorithm configuration
 */
export interface AlgorithmParameter {
  name: string;
  type: 'number' | 'boolean' | 'select' | 'angle';
  description: string;
  defaultValue: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For select type
  unit?: string; // e.g., 'radians', 'degrees', 'iterations'
}

/**
 * Complexity metrics for algorithms
 */
export interface AlgorithmComplexity {
  gateCount: number;
  depth: number;
  requiredQubits: number;
  classicalBits?: number;
  timeComplexity?: string; // Big O notation
  spaceComplexity?: string; // Big O notation
}

/**
 * Educational content for algorithms
 */
export interface AlgorithmEducation {
  description: string;
  mathematicalBackground: string;
  applications: string[];
  references: {
    title: string;
    url?: string;
    doi?: string;
    authors?: string[];
    year?: number;
  }[];
  prerequisites: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Algorithm implementation function type
 */
export type AlgorithmImplementation = (params: Record<string, any>) => {
  gates: Gate[];
  requiredQubits: number;
  measurements?: number[];
};

/**
 * Main algorithm definition
 */
export interface QuantumAlgorithm {
  id: string;
  name: string;
  category: AlgorithmCategory;
  version: string;
  parameters: AlgorithmParameter[];
  complexity: AlgorithmComplexity;
  education: AlgorithmEducation;
  implementation: AlgorithmImplementation;
  validated: boolean; // Whether the implementation has been scientifically validated
  lastUpdated: string; // ISO date string
}

/**
 * Algorithm categories
 */
export type AlgorithmCategory = 
  | 'search'
  | 'factoring'
  | 'optimization'
  | 'machine-learning'
  | 'cryptography'
  | 'error-correction'
  | 'benchmarking'
  | 'simulation'
  | 'linear-algebra'
  | 'number-theory'
  | 'combinatorial';

/**
 * Algorithm library structure
 */
export interface AlgorithmLibrary {
  algorithms: QuantumAlgorithm[];
  categories: {
    [K in AlgorithmCategory]: {
      name: string;
      description: string;
      icon: string;
    }
  };
}

/**
 * Algorithm execution result
 */
export interface AlgorithmResult {
  success: boolean;
  gates: Gate[];
  requiredQubits: number;
  measurements?: number[];
  warnings?: string[];
  errors?: string[];
  metadata: {
    algorithmId: string;
    parameters: Record<string, any>;
    generatedAt: string;
  };
}