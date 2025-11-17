import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type {
  GameMode,
  NewGamePayload,
  PlayCardPayload,
  QubitGameState,
} from '../../types/qubitTouchdown'
import { getApiBaseUrl } from '@/lib/quantumApi'
import { get } from 'http'

const API_BASE_URL = getApiBaseUrl();
interface QubitTouchdownSliceState {
  game: QubitGameState | null
  loading: boolean
  error: string | null
}

const initialState: QubitTouchdownSliceState = {
  game: null,
  loading: false,
  error: null,
}

// =============== Thunks ===============

export const startNewGame = createAsyncThunk<
  QubitGameState,
  NewGamePayload
>('qubitTouchdown/startNewGame', async (payload, { rejectWithValue }) => {
  try {
    const body: { mode: GameMode; player1_name?: string; player2_name?: string } = {
      mode: payload.mode,
    }

    if (payload.player1Name) {
      body.player1_name = payload.player1Name
    }
    if (payload.player2Name) {
      body.player2_name = payload.player2Name
    }
    if (!API_BASE_URL) throw new Error("API base URL is not configured (VITE_API_BASE_URL)");
    const res = await fetch(`${API_BASE_URL}/api/v1/qubit-touchdown/new-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      const message: string =
        (errorBody && (errorBody.detail as string)) ||
        'Failed to start Qubit Touchdown game'
      return rejectWithValue(message)
    }

    const data = (await res.json()) as QubitGameState
    return data
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to start Qubit Touchdown game'
    return rejectWithValue(message)
  }
})

export const playCard = createAsyncThunk<
  QubitGameState,
  PlayCardPayload
>('qubitTouchdown/playCard', async (payload, { rejectWithValue }) => {
  try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured (VITE_API_BASE_URL)");
    
      const res = await fetch(`${API_BASE_URL}/api/v1/qubit-touchdown/play-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: payload.gameId,
        player_id: payload.playerId,
        card_id: payload.cardId,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      const message: string =
        (errorBody && (errorBody.detail as string)) ||
        'Failed to play card'
      return rejectWithValue(message)
    }

    const data = (await res.json()) as QubitGameState
    return data
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to play card'
    return rejectWithValue(message)
  }
})

// =============== Slice ===============

const qubitTouchdownSlice = createSlice({
  name: 'qubitTouchdown',
  initialState,
  reducers: {
    resetGame(state) {
      state.game = null
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // startNewGame
    builder
      .addCase(startNewGame.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        startNewGame.fulfilled,
        (state, action: PayloadAction<QubitGameState>,
      ) => {
        state.loading = false
        state.game = action.payload
      },
      )
      .addCase(startNewGame.rejected, (state, action) => {
        state.loading = false
        state.error =
          (action.payload as string) ||
          action.error.message ||
          'Failed to start game'
      })

    // playCard
    builder
      .addCase(playCard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        playCard.fulfilled,
        (state, action: PayloadAction<QubitGameState>,
      ) => {
        state.loading = false
        state.game = action.payload
      },
      )
      .addCase(playCard.rejected, (state, action) => {
        state.loading = false
        state.error =
          (action.payload as string) ||
          action.error.message ||
          'Failed to play card'
      })
  },
})

export const { resetGame } = qubitTouchdownSlice.actions

// Selector
export const selectQubitTouchdown = (state: RootState) => state.qubitTouchdown

export default qubitTouchdownSlice.reducer
