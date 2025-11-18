import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'

// Message types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  gates?: any[]  // Generated gates if applicable
  explanation?: string
}

// Define types for AI Chat state
export interface AIChatState {
  isVisible: boolean
  isMinimized: boolean
  position: { x: number; y: number }
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  numQubits: number
}

// Define the initial state
const initialState: AIChatState = {
  isVisible: false,
  isMinimized: false,
  position: { x: window.innerWidth - 420, y: 100 }, // Default to bottom-right
  messages: [],
  isLoading: false,
  error: null,
  numQubits: 2,
}

export const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState,
  reducers: {
    toggleChatVisibility: (state) => {
      state.isVisible = !state.isVisible
      if (!state.isVisible) {
        state.isMinimized = false
      }
    },
    setChatVisibility: (state, action: PayloadAction<boolean>) => {
      state.isVisible = action.payload
      if (!action.payload) {
        state.isMinimized = false
      }
    },
    toggleMinimize: (state) => {
      state.isMinimized = !state.isMinimized
    },
    setPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.position = action.payload
    },
    addMessage: (state, action: PayloadAction<Omit<ChatMessage, 'id' | 'timestamp'>>) => {
      const newMessage: ChatMessage = {
        ...action.payload,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      }
      state.messages.push(newMessage)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
      state.error = null
    },
    setNumQubits: (state, action: PayloadAction<number>) => {
      state.numQubits = action.payload
    },
    resetChat: () => initialState,
  },
})

// Export actions
export const {
  toggleChatVisibility,
  setChatVisibility,
  toggleMinimize,
  setPosition,
  addMessage,
  setLoading,
  setError,
  clearMessages,
  setNumQubits,
  resetChat,
} = aiChatSlice.actions

// Export selectors
export const selectChatVisible = (state: RootState) => state.aiChat.isVisible
export const selectChatMinimized = (state: RootState) => state.aiChat.isMinimized
export const selectChatPosition = (state: RootState) => state.aiChat.position
export const selectChatMessages = (state: RootState) => state.aiChat.messages
export const selectChatLoading = (state: RootState) => state.aiChat.isLoading
export const selectChatError = (state: RootState) => state.aiChat.error
export const selectChatNumQubits = (state: RootState) => state.aiChat.numQubits

// Export the reducer
export default aiChatSlice.reducer
