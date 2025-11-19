import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'
import { calculateSimulationHistory } from '../../utils/simpleQuantumEngine'
import { 
  Gate, 
  Qubit,
  // Import circuit actions to listen for changes
  addGate,
  removeGate,
  updateGate,
  addQubit,
  removeQubit,
  clearCircuit,
  importCircuit,
  addGates
} from './circuitSlice'

// --- Types ---

export interface BlochVector {
  x: number
  y: number
  z: number
}

// Detailed physics data for a single qubit at a specific step
export interface QubitStateDetail {
  qubitId: number
  vectorText: string      // e.g. "|0>", "|+>"
  bloch: BlochVector      // { x, y, z }
  theta: number           // Polar angle (radians)
  phi: number             // Azimuthal angle (radians)
  complexStr: string      // e.g. "0.70|0> + 0.70|1>"
}

export interface SimulationStep {
  step: number
  description: string
  // The array of states for all qubits at this step
  qubitStates: QubitStateDetail[]
}

export interface SimulationState {
  isLoading: boolean
  error: string | null
  currentStep: number
  totalSteps: number
  isPlaying: boolean
  playbackSpeed: number 
  history: SimulationStep[]
}

const initialState: SimulationState = {
  isLoading: false,
  error: null,
  currentStep: 0,
  totalSteps: 0,
  isPlaying: false,
  playbackSpeed: 1000,
  history: [],
}

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      // Clamp between 0 and max steps
      state.currentStep = Math.max(0, Math.min(action.payload, state.totalSteps - 1))
    },
    stepForward: (state) => {
      if (state.currentStep < state.totalSteps - 1) {
        state.currentStep += 1
      } else {
        state.isPlaying = false // Stop playing if we hit the end
      }
    },
    stepBackward: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1
      }
    },
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload
    },
    setSimulationData: (state, action: PayloadAction<SimulationStep[]>) => {
      state.history = action.payload
      state.totalSteps = action.payload.length
      state.currentStep = 0
    },
    
    // The Action that triggers the Frontend Physics Engine
    runPredictiveSimulation: (state, action: PayloadAction<{qubits: Qubit[], gates: Gate[]}>) => {
      const { qubits, gates } = action.payload;
      
      // Calculate the history using our new utility
      const history = calculateSimulationHistory(qubits, gates);
      
      state.history = history;
      state.totalSteps = history.length;
      state.currentStep = 0;
      state.isPlaying = false;
      state.error = null;
    }
  },
  // --- FIX: Listen for Circuit Changes to prevent crashes ---
  extraReducers: (builder) => {
    builder
      .addCase(addGate, (state) => resetSimulation(state))
      .addCase(removeGate, (state) => resetSimulation(state))
      .addCase(updateGate, (state) => resetSimulation(state))
      .addCase(addQubit, (state) => resetSimulation(state))
      .addCase(removeQubit, (state) => resetSimulation(state))
      .addCase(clearCircuit, (state) => resetSimulation(state))
      .addCase(importCircuit, (state) => resetSimulation(state))
      .addCase(addGates, (state) => resetSimulation(state));
  }
})

// Helper to clear state
const resetSimulation = (state: SimulationState) => {
  state.history = [];
  state.currentStep = 0;
  state.totalSteps = 0;
  state.isPlaying = false;
  state.error = null;
}

export const { 
  setCurrentStep, 
  stepForward, 
  stepBackward, 
  setPlaying, 
  setSimulationData, 
  runPredictiveSimulation 
} = simulationSlice.actions

// Selectors
export const selectIsLoading = (state: RootState) => state.simulation.isLoading
export const selectCurrentStep = (state: RootState) => state.simulation.currentStep
export const selectTotalSteps = (state: RootState) => state.simulation.totalSteps
export const selectIsPlaying = (state: RootState) => state.simulation.isPlaying
export const selectSimulationHistory = (state: RootState) => state.simulation.history
export const selectCurrentStepData = (state: RootState) => state.simulation.history[state.simulation.currentStep]

export default simulationSlice.reducer