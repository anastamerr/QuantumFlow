import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'

// Define types for UI state
export interface UiState {
  selectedGateId: string | null
  // 'chat' removed from activePanel — chat is managed independently via isChatOpen
  activePanel: 'circuit' | 'code' | 'simulation' | 'export' | 'algorithms' | 'puzzles' | 'stats'
  showGateParams: boolean
  codeFormat: 'qiskit' | 'cirq' | 'json'
  isDragging: boolean
  showGrid: boolean
  zoomLevel: number
  showTutorial: boolean
  isFullView: boolean
  // new independent chat flag
  isChatOpen: boolean
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
  isChatOpen: false,
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
    },
    // Chat panel controls (independent)
    openChat: (state) => {
      state.isChatOpen = true
    },
    closeChat: (state) => {
      state.isChatOpen = false
    },
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen
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
  openChat,
  closeChat,
  toggleChat,
  toggleGateParams,
  setCodeFormat,
  setIsDragging,
  toggleGrid,
  setZoomLevel,
  toggleTutorial,
  toggleFullView,
  resetUi,
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
export const selectIsChatOpen = (state: RootState) => state.ui.isChatOpen

// Export the reducer
export default uiSlice.reducer
