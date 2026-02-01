// Define types for quantum circuit elements
import { AdvancedOptimizationOptions } from '../utils/circuitOptimizer';

export interface Gate {
  id: string
  name: string
  symbol: string
  description: string
  category: string
  color: string
  type: string
  qubit?: number
  position?: number
  params?: {
    [key: string]: number | string | boolean
  }
  targets?: number[] // For multi-qubit gates like CNOT
  controls?: number[] // For controlled gates
}

export interface GateDefinition {
  id: string
  name: string
  symbol: string
  description: string
  category: string
  color: string
  params?: {
    name: string
    type: 'number' | 'angle' | 'select'
    default: number | string
    options?: string[]
    min?: number
    max?: number
    step?: number
  }[]
  targets?: number
  controls?: number
}

export interface Qubit {
  id: number
  name: string
}

export interface CircuitData {
  qubits: Qubit[]
  gates: Gate[]
  maxPosition: number
  name: string
  description: string
}

export interface CircuitPosition {
  qubit: number
  position: number
}

export interface DroppedGate {
  gateType: string
  position: CircuitPosition
}

// Optimization related types
export interface OptimizationOptions {
  consolidateGates: boolean;
  cancelAdjacentGates: boolean;
  convertGateSequences: boolean;
  transpileToBackend: boolean;
  backendName?: string;
  enableAdvancedOptimization?: boolean;
  advancedOptions?: AdvancedOptimizationOptions;
}
