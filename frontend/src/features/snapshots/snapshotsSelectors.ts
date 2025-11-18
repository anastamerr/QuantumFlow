import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { SnapshotsState } from './snapshotsSlice';

// 1. Input Selector: Get the entire snapshots slice state
const selectSnapshotsState = (state: RootState): SnapshotsState => state.snapshots;

// 2. Selector: Get the raw array of snapshots
export const selectAllSnapshots = createSelector(
    selectSnapshotsState,
    (state) => state.snapshots
);

// 3. Selector: Get the currently selected snapshot ID
export const selectSelectedId = createSelector(
    selectSnapshotsState,
    (state) => state.selectedId
);

// 4. Selector: Get memory usage stats
export const selectMemoryStats = createSelector(
    selectSnapshotsState,
    (state) => {
        const totalBytes = state.totalMemoryUsed;
        const totalKB = totalBytes / 1024;
        const MEMORY_WARNING_THRESHOLD_BYTES = 50000;

        let warningLevel: 'none' | 'moderate' | 'critical' = 'none';

        if (totalBytes > MEMORY_WARNING_THRESHOLD_BYTES) {
            warningLevel = 'critical';
        } else if (totalBytes > MEMORY_WARNING_THRESHOLD_BYTES * 0.5) {
            warningLevel = 'moderate';
        }

        return {
            totalSnapshots: state.snapshots.length,
            memoryUsedBytes: totalBytes,
            memoryUsedKB: totalKB.toFixed(2),
            warningLevel: warningLevel,
            isLoading: state.isLoading,
            error: state.error,
        };
    }
);

// 5. Selector: Get snapshots sorted by timestamp (newest first)
export const selectSnapshotsSorted = createSelector(
    selectAllSnapshots,
    (snapshots) => {
        // Data is added to the front of the array, so it's already sorted newest first.
        // We ensure a copy is returned for immutability best practices.
        return [...snapshots];
    }
);

// 6. Selector: Get the currently selected snapshot object
export const selectCurrentSnapshot = createSelector(
    [selectAllSnapshots, selectSelectedId],
    (snapshots, selectedId) => {
        if (!selectedId) return null;
        return snapshots.find(snap => snap.id === selectedId) || null;
    }
);

// 7. Selector: Get a specific snapshot by ID (Curried/Factory Selector)
export const selectSnapshotById = (id: string) => createSelector(
    selectAllSnapshots,
    (snapshots) => snapshots.find(snap => snap.id === id) || null
);

// 8. Selector: Search snapshots by name (Case-insensitive)
export const selectSnapshotsByName = (search: string) => createSelector(
    selectAllSnapshots,
    (snapshots) => {
        const lowerSearch = search.toLowerCase();
        return snapshots.filter(snap =>
            snap.name.toLowerCase().includes(lowerSearch)
        );
    }
);