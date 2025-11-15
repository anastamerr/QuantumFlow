/**
 * Custom Gate Manager
 * Handles creation, storage, and validation of user-defined custom gates
 */

import { Gate, GateDefinition } from "../types/circuit";

export interface CustomGateDefinition extends GateDefinition {
  isCustom: true;
  composedGates: Gate[]; // The sequence of gates that make up this custom gate
  createdAt: string;
}

const CUSTOM_GATES_STORAGE_KEY = "quantumflow_custom_gates";

/**
 * Check if a gate is a single-qubit gate (no multi-qubit operations)
 */
function isSingleQubitGate(gate: Gate): boolean {
  // Multi-qubit gates have targets or controls arrays
  if (gate.targets && gate.targets.length > 0) return false;
  if (gate.controls && gate.controls.length > 0) return false;

  // Check gate type - these are known multi-qubit gates
  const multiQubitTypes = ["cnot", "cz", "swap", "toffoli", "ccx", "cx"];
  if (multiQubitTypes.includes(gate.type.toLowerCase())) return false;

  return true;
}

/**
 * Validate that a circuit contains only single-qubit gates
 */
export function validateSingleQubitCircuit(gates: Gate[]): {
  valid: boolean;
  error?: string;
  invalidGates?: Gate[];
} {
  if (gates.length === 0) {
    return {
      valid: false,
      error: "Circuit is empty. Add some gates before creating a custom gate.",
    };
  }

  const invalidGates = gates.filter((gate) => !isSingleQubitGate(gate));

  if (invalidGates.length > 0) {
    return {
      valid: false,
      error: `Custom gates can only contain single-qubit gates. Found ${invalidGates.length} multi-qubit gate(s).`,
      invalidGates,
    };
  }

  // Check if all gates are on the same qubit
  const qubits = new Set(gates.map((g) => g.qubit));
  if (qubits.size > 1) {
    return {
      valid: false,
      error: "All gates must be on the same qubit to create a custom gate.",
    };
  }

  return { valid: true };
}

/**
 * Normalize gate positions to start from 0 and be sequential
 */
function normalizeGatePositions(gates: Gate[]): Gate[] {
  // Sort by position
  const sorted = [...gates].sort((a, b) => {
    const posA =
      typeof a.position === "number" ? a.position : a.position?.x ?? 0;
    const posB =
      typeof b.position === "number" ? b.position : b.position?.x ?? 0;
    return posA - posB;
  });

  // Renormalize positions to 0, 1, 2, ...
  return sorted.map((gate, index) => ({
    ...gate,
    position: index,
    qubit: 0, // Always normalize to qubit 0 for templates
  }));
}

/**
 * Create a custom gate definition from a circuit
 */
export function createCustomGate(
  name: string,
  symbol: string,
  description: string,
  gates: Gate[]
): { success: boolean; gate?: CustomGateDefinition; error?: string } {
  // Validate
  const validation = validateSingleQubitCircuit(gates);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Normalize gate positions
  const normalizedGates = normalizeGatePositions(gates);

  // Create custom gate definition
  const customGate: CustomGateDefinition = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    symbol: symbol || name.substring(0, 3).toUpperCase(),
    description: description || `Custom gate: ${name}`,
    category: "Custom Gates",
    color: "purple",
    isCustom: true,
    composedGates: normalizedGates,
    createdAt: new Date().toISOString(),
  };

  return { success: true, gate: customGate };
}

/**
 * Save custom gate to localStorage
 */
export function saveCustomGate(gate: CustomGateDefinition): void {
  const existing = loadCustomGates();
  existing.push(gate);
  localStorage.setItem(CUSTOM_GATES_STORAGE_KEY, JSON.stringify(existing));
}

/**
 * Load all custom gates from localStorage
 */
export function loadCustomGates(): CustomGateDefinition[] {
  try {
    const stored = localStorage.getItem(CUSTOM_GATES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as CustomGateDefinition[];
  } catch (error) {
    console.error("Failed to load custom gates:", error);
    return [];
  }
}

/**
 * Update an existing custom gate
 */
export function updateCustomGate(
  gateId: string,
  updates: Partial<Pick<CustomGateDefinition, 'name' | 'symbol' | 'description'>>
): { success: boolean; error?: string } {
  const existing = loadCustomGates();
  const gateIndex = existing.findIndex((g) => g.id === gateId);
  
  if (gateIndex === -1) {
    return { success: false, error: 'Custom gate not found' };
  }
  
  // Update the gate
  existing[gateIndex] = {
    ...existing[gateIndex],
    ...updates,
  };
  
  localStorage.setItem(CUSTOM_GATES_STORAGE_KEY, JSON.stringify(existing));
  return { success: true };
}

/**
 * Delete a custom gate by ID
 */
export function deleteCustomGate(gateId: string): void {
  const existing = loadCustomGates();
  const filtered = existing.filter((g) => g.id !== gateId);
  localStorage.setItem(CUSTOM_GATES_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Check if a gate definition is a custom gate
 */
export function isCustomGate(gate: any): gate is CustomGateDefinition {
  return gate && gate.isCustom === true && Array.isArray(gate.composedGates);
}

/**
 * Expand a custom gate into its component gates
 * @param customGate The custom gate to expand
 * @param targetQubit The qubit to apply the gate to
 * @param startPosition The starting position in the circuit
 */
export function expandCustomGate(
  customGate: CustomGateDefinition,
  targetQubit: number,
  startPosition: number
): Gate[] {
  return customGate.composedGates.map((gate, index) => {
    const pos =
      typeof startPosition === "number"
        ? startPosition + index
        : { x: (startPosition as any).x + index, y: targetQubit };

    return {
      ...gate,
      id: `${gate.id}_expanded_${Date.now()}_${index}`,
      qubit: targetQubit,
      position: pos,
    };
  });
}

/**
 * Clear all custom gates (for debugging/reset)
 */
export function clearAllCustomGates(): void {
  localStorage.removeItem(CUSTOM_GATES_STORAGE_KEY);
}
