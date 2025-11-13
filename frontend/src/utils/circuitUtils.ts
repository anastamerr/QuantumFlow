import { Gate as StoreGate } from '../store/slices/circuitSlice';
import { Gate as CircuitGate } from '../types/circuit';
import { gateLibrary } from './gateLibrary';

/**
 * Transform Redux store gates to Circuit gates with full properties
 * This is needed because the Gate type in circuitSlice.ts doesn't have all the properties
 * that the Gate type in circuit.ts has.
 */
export const transformStoreGatesToCircuitGates = (storeGates: StoreGate[]): CircuitGate[] => {
  return storeGates.map(gate => {
    // Find the gate definition from the library
    const gateDef = gateLibrary.find(g => g.id === gate.type);
    
    if (!gateDef) {
      // If gate definition not found, create a generic one
      return {
        ...gate,
        name: gate.type,
        symbol: gate.type.substring(0, 2).toUpperCase(),
        description: 'Custom gate',
        category: 'Custom',
        color: 'gray'
      } as CircuitGate;
    }
    
    // Return a gate with properties from both the store gate and the gate definition
    return {
      ...gate,
      name: gateDef.name,
      symbol: gateDef.symbol,
      description: gateDef.description,
      category: gateDef.category,
      color: gateDef.color
    } as CircuitGate;
  });
};

/**
 * Calculate the maximum position (time step) in a circuit
 */
export function calculateMaxPosition(gates: StoreGate[]): number;
export function calculateMaxPosition(gates: CircuitGate[]): number;
export function calculateMaxPosition(gates: any[]): number {
  if (gates.length === 0) return 0;
  return Math.max(...gates.map(gate => gate.position || 0)) + 1;
}

/**
 * Group gates by position (time step)
 */
export function groupGatesByPosition(gates: StoreGate[]): Record<number, StoreGate[]>;
export function groupGatesByPosition(gates: CircuitGate[]): Record<number, CircuitGate[]>;
export function groupGatesByPosition(gates: any[]): Record<number, any[]> {
  const groupedGates: Record<number, any[]> = {};
  
  gates.forEach(gate => {
    const position = gate.position || 0;
    if (!groupedGates[position]) {
      groupedGates[position] = [];
    }
    groupedGates[position].push(gate);
  });
  
  return groupedGates;
}

/**
 * Group gates by qubit
 */
export function groupGatesByQubit(gates: StoreGate[]): Record<number, StoreGate[]>;
export function groupGatesByQubit(gates: CircuitGate[]): Record<number, CircuitGate[]>;
export function groupGatesByQubit(gates: any[]): Record<number, any[]> {
  const groupedGates: Record<number, any[]> = {};
  
  gates.forEach(gate => {
    const qubit = gate.qubit !== undefined ? gate.qubit : 0;
    if (!groupedGates[qubit]) {
      groupedGates[qubit] = [];
    }
    groupedGates[qubit].push(gate);
  });
  
  return groupedGates;
}

/**
 * Sort gates by position and then by qubit
 */
export function sortGatesByPositionAndQubit<T extends StoreGate | CircuitGate>(gates: T[]): T[] {
  return [...gates].sort((a, b) => {
    const posA = a.position !== undefined ? a.position : 0;
    const posB = b.position !== undefined ? b.position : 0;
    if (posA !== posB) return posA - posB;
    return (a.qubit !== undefined ? a.qubit : 0) - (b.qubit !== undefined ? b.qubit : 0);
  });
}