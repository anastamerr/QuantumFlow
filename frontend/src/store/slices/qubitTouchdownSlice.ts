import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createNewGame, playCardLogic } from '../../logic/qubit_logic'; 
import { GameMode, QubitTouchdownState } from '@/types/qubitTouchdown'; 

interface SliceState {
  game: QubitTouchdownState | null;
  loading: boolean;
  error: string | null;
}

const initialState: SliceState = {
  game: null,
  loading: false,
  error: null,
};

export const qubitTouchdownSlice = createSlice({
  name: 'qubitTouchdown',
  initialState,
  reducers: {
    startNewGame: (state, action: PayloadAction<{ mode: GameMode }>) => {
      state.game = createNewGame(action.payload.mode);
      state.loading = false;
      state.error = null;
    },
    playCard: (state, action: PayloadAction<{ gameId: string; playerId: number; cardId: string }>) => {
      if (!state.game) return;
      // Call logic function
      const newState = playCardLogic(state.game, action.payload.playerId, action.payload.cardId);
      if (newState.error) {
          state.error = newState.error;
      } else {
          state.game = newState;
          state.error = null;
      }
    },
    resolveRoll: (state) => {
        if (!state.game || !state.game.pendingMove) return;
        const p = state.game.pendingMove;

        state.game = {
            ...state.game,
            isDiceRolling: false,
            pendingMove: null,
            // Apply deferred changes
            ballPosition: p.newPos, 
            current_player_id: p.nextPid, 
            lastAction: p.newLastAction, 
            players: p.updatedPlayers, // Ensure players array is updated correctly
            is_over: p.isOver,
            deck: p.newDeck,
        };
    },
    clearError: (state) => {
        state.error = null;
    }
  },
});

export const { startNewGame, playCard, resolveRoll, clearError } = qubitTouchdownSlice.actions;
export const selectQubitTouchdown = (state: any) => state.qubitTouchdown;
export default qubitTouchdownSlice.reducer;