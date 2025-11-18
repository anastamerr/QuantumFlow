import { configureStore } from '@reduxjs/toolkit'
import circuitReducer from './slices/circuitSlice'
import uiReducer from './slices/uiSlice'
import simulationReducer from './slices/simulationSlice'

export const store = configureStore({
  reducer: {
    circuit: circuitReducer,
    ui: uiReducer,
    simulation: simulationReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch