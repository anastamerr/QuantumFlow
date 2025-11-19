import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of a single snapshot object (adjust as needed)
interface Snapshot {
  gateName: string;
  stateData: any; // Use a more specific type if known
  timestamp: number;
}

// Define the initial state for this slice
interface DebugState {
  showSnap: boolean;
  snapshots: Snapshot[];
}

const initialState: DebugState = {
  showSnap: false, // Default state: Toggle is OFF
  snapshots: [],
};

export const debugSlice = createSlice({
  name: 'debug',
  initialState,
  reducers: {
    // 1. ACTION TO TOGGLE THE FEATURE UI
    toggleSnapshots: (state) => {
      state.showSnap = !state.showSnap;
    },
    // 2. ACTION TO ADD A NEW STATE SNAPSHOT
    addSnapshot: (state, action: PayloadAction<Snapshot>) => {
      // Limit the number of snapshots to prevent memory issues (optional)
      if (state.snapshots.length >= 100) {
        state.snapshots.shift(); // Remove the oldest snapshot
      }
      state.snapshots.push(action.payload);
    },
    // 3. ACTION TO CLEAR ALL SNAPSHOTS
    clearSnapshots: (state) => {
      state.snapshots = [];
    },
  },
});

// Export the actions for use in components (e.g., Header.tsx)
export const { toggleSnapshots, addSnapshot, clearSnapshots } = debugSlice.actions;

// Export the selectors for accessing state (for Header.tsx and SnapshotViewer)
import { RootState } from '../../store'; // Adjust path to your store type

// Selector for the toggle state (used in Header.tsx)
export const selectShowSnap = (state: RootState) => state.debug.showSnap; 

// Selector for the list of snapshots (used in SnapshotViewer.tsx)
export const selectSnapshots = (state: RootState) => state.debug.snapshots;

// Export the reducer for store.ts
export default debugSlice.reducer;