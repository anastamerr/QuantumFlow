 import { createSlice, PayloadAction } from '@reduxjs/toolkit';
 export interface Snapshot {
 id: string;
 gateIndex: number;
 gateName: string;
 statePreview: string;
 fullState: string;
 characterCount: number;
 qubitCount: number;
 isLarge: boolean;
 timestamp: number;
 }
 interface SnapshotsState {
 snapshots: Snapshot[];
 expandedSnapshotId: string | null;
 autoCollapsed: boolean;
totalCharacterCount: number;
 isLoading: boolean;
 }
 const initialState: SnapshotsState = {
 snapshots: [],
 expandedSnapshotId: null,
 autoCollapsed: false,
 totalCharacterCount: 0,
 isLoading: false,
 };
 const snapshotsSlice = createSlice({
 name: 'snapshots',
 initialState,
 reducers: {
 setSnapshots: (state, action: PayloadAction<{
 snapshots: Snapshot[];
 totalCharacterCount: number;
 autoCollapsed: boolean;
 }>) => {
 state.snapshots = action.payload.snapshots;
 state.totalCharacterCount = action.payload.totalCharacterCount;
 state.autoCollapsed = action.payload.autoCollapsed;
 state.isLoading = false;
 },
expandSnapshot: (state, action: PayloadAction<string>) => {
 state.expandedSnapshotId = action.payload;
 },
 collapseSnapshot: (state) => {
 state.expandedSnapshotId = null;
 },
 clearSnapshots: (state) => {
 state.snapshots = [];
 state.expandedSnapshotId = null;
 state.autoCollapsed = false;
 state.totalCharacterCount = 0;
 state.isLoading = false;
 },
 toggleAutoCollapse: (state) => {
 state.autoCollapsed = !state.autoCollapsed;
 },
 setLoading: (state, action: PayloadAction<boolean>) => {
 state.isLoading = action.payload;
 },
 },
 });
export const {
 setSnapshots,
 expandSnapshot,
 collapseSnapshot,
 clearSnapshots,
 toggleAutoCollapse,
 setLoading,
 } = snapshotsSlice.actions;
 export default snapshotsSlice.reducer;