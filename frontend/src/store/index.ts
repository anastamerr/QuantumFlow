import { configureStore } from '@reduxjs/toolkit'
import circuitReducer from './slices/circuitSlice'
import uiReducer from './slices/uiSlice'
import aiChatReducer from './slices/aiChatSlice'

export const store = configureStore({
  reducer: {
    circuit: circuitReducer,
    ui: uiReducer,
    aiChat: aiChatReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch