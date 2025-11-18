import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'

// Define types for our state
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
    [key: string]: number | string
  }
  targets?: number[] // For multi-qubit gates like CNOT
  controls?: number[] // For controlled gates
}

export interface Qubit {
  id: number
  name: string
}

export interface CircuitState {
  qubits: Qubit[]
  gates: Gate[]
  maxPosition: number
  name: string
  description: string
}

// Define the initial state
const initialState: CircuitState = {
  qubits: [
    { id: 0, name: 'q0' },
    { id: 1, name: 'q1' },
  ],
  gates: [],
  maxPosition: 10, // Initial circuit width
  name: 'New Circuit',
  description: '',
}

export const circuitSlice = createSlice({
  name: 'circuit',
  initialState,
  reducers: {
    addQubit: (state) => {
      const newId = state.qubits.length
      state.qubits.push({
        id: newId,
        name: `q${newId}`,
      })
    },
    removeQubit: (state, action: PayloadAction<number>) => {
      const qubitId = action.payload
      
      // Remove the qubit
      state.qubits = state.qubits.filter((qubit) => qubit.id !== qubitId)
      
      // Remove gates that involve this qubit
      state.gates = state.gates.filter(
        (gate) => 
          gate.qubit !== qubitId && 
          !gate.targets?.includes(qubitId) && 
          !gate.controls?.includes(qubitId)
      )
      
      // Reindex remaining qubits and update gates accordingly
      const oldToNewIdMap: { [oldId: number]: number } = {}
      state.qubits.forEach((qubit, index) => {
        oldToNewIdMap[qubit.id] = index
        qubit.id = index
        qubit.name = `q${index}`
      })
      
      // Update gate references to use new qubit IDs
      state.gates.forEach(gate => {
        if (gate.qubit in oldToNewIdMap) {
          gate.qubit = oldToNewIdMap[gate.qubit]
        }
        if (gate.targets) {
          gate.targets = gate.targets.map(target => oldToNewIdMap[target]).filter(id => id !== undefined)
        }
        if (gate.controls) {
          gate.controls = gate.controls.map(control => oldToNewIdMap[control]).filter(id => id !== undefined)
        }
      })
    },
    addGate: (state, action: PayloadAction<Omit<Gate, 'id'>>) => {
      const newGate = {
        ...action.payload,
        id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
      state.gates.push(newGate)
      
      // Update maxPosition if needed
      if (newGate.position >= state.maxPosition) {
        state.maxPosition = newGate.position + 5 // Add some buffer
      }
    },
    updateGate: (state, action: PayloadAction<{ id: string; updates: Partial<Gate> }>) => {
      const { id, updates } = action.payload
      const gateIndex = state.gates.findIndex((gate) => gate.id === id)
      
      if (gateIndex !== -1) {
        state.gates[gateIndex] = { ...state.gates[gateIndex], ...updates }
      }
    },
    removeGate: (state, action: PayloadAction<string>) => {
      state.gates = state.gates.filter((gate) => gate.id !== action.payload)
    },
    clearCircuit: (state) => {
      state.gates = []
      state.qubits = [
        { id: 0, name: 'q0' },
        { id: 1, name: 'q1' },
      ]
      state.maxPosition = 10
      state.name = 'New Circuit'
      state.description = ''
    },
    setCircuitName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
    },
    setCircuitDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload
    },
    importCircuit: (state, action: PayloadAction<CircuitState>) => {
      return { ...action.payload }
    },
    extendCircuit: (state, action: PayloadAction<number>) => {
      state.maxPosition = action.payload
    },
    addGates: (state, action: PayloadAction<Omit<Gate, 'id'>[]>) => {
      const newGates = action.payload.map((gate, index) => ({
        ...gate,
        id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: typeof gate.position === 'number' ? gate.position : index,
        qubit: gate.qubit ?? 0
      }))
      
      // Clear existing gates and add new ones
      state.gates = []
      state.gates.push(...newGates)
      
      // Ensure we have enough qubits for the algorithm
      const allQubits = newGates.flatMap(gate => {
        const qubits = [gate.qubit];
        if (gate.targets) qubits.push(...gate.targets);
        if (gate.controls) qubits.push(...gate.controls);
        return qubits.filter(q => typeof q === 'number' && q >= 0);
      });
      
      const maxQubit = allQubits.length > 0 ? Math.max(...allQubits) : 0;
      
      // Add qubits if needed
      while (state.qubits.length <= maxQubit) {
        const newId = state.qubits.length;
        state.qubits.push({
          id: newId,
          name: `q${newId}`,
        });
      }
      
      // Update maxPosition based on gate positions
      const positions = newGates.map(gate => gate.position).filter(p => typeof p === 'number');
      const maxPosition = positions.length > 0 ? Math.max(...positions) : 0;
      state.maxPosition = Math.max(maxPosition + 5, state.maxPosition);
    },
  },
})

// Export actions
export const {
  addQubit,
  removeQubit,
  addGate,
  updateGate,
  removeGate,
  clearCircuit,
  setCircuitName,
  setCircuitDescription,
  importCircuit,
  extendCircuit,
  addGates,
} = circuitSlice.actions

// Export selectors
export const selectQubits = (state: RootState) => state.circuit.qubits
export const selectGates = (state: RootState) => state.circuit.gates
export const selectCircuitName = (state: RootState) => state.circuit.name
export const selectCircuitDescription = (state: RootState) => state.circuit.description
export const selectMaxPosition = (state: RootState) => state.circuit.maxPosition
export const selectQubitCount = (state: RootState) => state.circuit.qubits.length
export const selectGateCount = (state: RootState) => state.circuit.gates.length
export const selectCircuitDepth = (state: RootState) =>
  state.circuit.gates.length > 0
    ? Math.max(
        ...state.circuit.gates.map((gate) =>
          typeof gate.position === 'number' ? gate.position : 0,
        ),
      ) + 1
    : 0
export const selectGateFrequency = (state: RootState) =>
  state.circuit.gates.reduce<Record<string, number>>((acc, gate) => {
    const type = gate.type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

// Export the reducer
export default circuitSlice.reducer