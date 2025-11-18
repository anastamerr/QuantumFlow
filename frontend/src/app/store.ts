import { configureStore } from '@reduxjs/toolkit';
import snapshotsReducer from '../features/snapshots/snapshotsSlice';
import debugReducer from '../store/slices/debugSlice'
// Configure the store with the snapshots slice
export const store = configureStore({
  reducer: {
    snapshots: snapshotsReducer,
    debug: debugReducer,
  },
  // Add middleware or enhancers here if needed
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {snapshots: SnapshotsState}
export type AppDispatch = typeof store.dispatch;
// Optional: Enable Redux DevTools logging in development mode
if (process.env.NODE_ENV === 'development') {
    // This line is often included by default in configureStore,
    // but explicit logging can be helpful for debugging
    console.log("Redux Store Initialized.");
}