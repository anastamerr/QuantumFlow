import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'

// Define types for UI state
export interface UiState {
  selectedGateId: string | null
  activePanel:
      | 'circuit'
      | 'code'
      | 'simulation'
      | 'export'
      | 'algorithms'
      | 'ai'
      | 'library'
      | 'projects'
      | 'blochSphere'
      | 'qkd'
  showGateParams: boolean
  codeFormat: 'qiskit' | 'cirq' | 'json'
  isDragging: boolean
  showGrid: boolean
  zoomLevel: number
  showTutorial: boolean
  isFullView: boolean
  tutorialStep: number          // ⬅️ add this line
}


// Define the initial state
const initialState: UiState = {
  selectedGateId: null,
  activePanel: 'circuit',
  showGateParams: false,
  codeFormat: 'qiskit',
  isDragging: false,
  showGrid: true,
  zoomLevel: 1,
  showTutorial: false,
  isFullView: false,
  tutorialStep: 0,              // ⬅️ add this line
}


export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectGate: (state, action: PayloadAction<string | null>) => {
      state.selectedGateId = action.payload
      state.showGateParams = action.payload !== null
    },
    setActivePanel: (state, action: PayloadAction<UiState['activePanel']>) => {
      state.activePanel = action.payload
      // Exit full view when returning to the circuit panel
      if (action.payload === 'circuit' && state.isFullView) {
        state.isFullView = false
      }
      if (action.payload === 'projects' || action.payload === 'library' || action.payload === 'blochSphere') {
        state.showGateParams = false
        state.selectedGateId = null
      }
    },
    setTutorialStep: (state, action: PayloadAction<number>) => {
      state.tutorialStep = action.payload
    },
    toggleGateParams: (state) => {
      state.showGateParams = !state.showGateParams
    },
    setCodeFormat: (state, action: PayloadAction<UiState['codeFormat']>) => {
      state.codeFormat = action.payload
    },
    setIsDragging: (state, action: PayloadAction<boolean>) => {
      state.isDragging = action.payload
    },
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload
    },
    toggleTutorial: (state) => {
      state.showTutorial = !state.showTutorial
    },
    toggleFullView: (state) => {
      state.isFullView = !state.isFullView
    },
    resetUi: () => initialState,
  },
})

// Export actions
export const {
  selectGate,
  setActivePanel,
  toggleGateParams,
  setCodeFormat,
  setIsDragging,
  toggleGrid,
  setZoomLevel,
  toggleTutorial,
  toggleFullView,
  resetUi,
  setTutorialStep,
} = uiSlice.actions

// Export selectors
export const selectSelectedGateId = (state: RootState) => state.ui.selectedGateId
export const selectActivePanel = (state: RootState) => state.ui.activePanel
export const selectShowGateParams = (state: RootState) => state.ui.showGateParams
export const selectCodeFormat = (state: RootState) => state.ui.codeFormat
export const selectIsDragging = (state: RootState) => state.ui.isDragging
export const selectShowGrid = (state: RootState) => state.ui.showGrid
export const selectZoomLevel = (state: RootState) => state.ui.zoomLevel
export const selectShowTutorial = (state: RootState) => state.ui.showTutorial
export const selectIsFullView = (state: RootState) => state.ui.isFullView
export const selectTutorialStep = (state: RootState) => state.ui.tutorialStep

// Export the reducer
export default uiSlice.reducer