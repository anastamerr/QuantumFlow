import { useCallback } from 'react';
import {
    addSnapshot,
    deleteSnapshot,
    clearAllSnapshots,
    loadFullSnapshotData,
    selectSnapshot,
    CreateSnapshotPayload,
    Snapshot
} from '../snapshotsSlice';
import {
    selectSnapshotsSorted,
    selectCurrentSnapshot,
    selectMemoryStats
} from '../snapshotsSelectors';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { CircuitMetadata } from '../snapshotsSlice';

/**
 * Hook for monitoring memory usage and warnings.
 */
export const useMemoryMonitor = () => {
    return useAppSelector(selectMemoryStats);
};

/**
 * Main hook for interacting with the snapshot state and actions.
 */
export const useSnapshots = () => {
    const dispatch = useAppDispatch();
    
    // Selectors
    const snapshots: Snapshot[] = useAppSelector(selectSnapshotsSorted);
    const selectedSnapshot = useAppSelector(selectCurrentSnapshot);
    const { memoryUsedBytes, memoryUsedKB, warningLevel, isLoading, error } = useAppSelector(selectMemoryStats);

    // Actions
    const createSnapshot = useCallback((
        fullData: string,
        name: string,
        metadata: Omit<CircuitMetadata, 'circuitType'> & { circuitType?: string }
    ) => {
        dispatch(addSnapshot({ fullData, name, metadata }));
    }, [dispatch]);

    const deleteSnapshotById = useCallback((id: string) => {
        dispatch(deleteSnapshot(id));
    }, [dispatch]);

    const selectSnapshotById = useCallback((id: string | null) => {
        dispatch(selectSnapshot(id));
    }, [dispatch]);

    const clearAll = useCallback(() => {
        if (window.confirm("Are you sure you want to clear ALL snapshots? This action cannot be undone.")) {
            dispatch(clearAllSnapshots());
        }
    }, [dispatch]);

    const loadFullData = useCallback((id: string) => {
        return dispatch(loadFullSnapshotData(id));
    }, [dispatch]);

    return {
        // State
        snapshots,
        selectedSnapshot,
        memoryUsedBytes,
        memoryUsedKB,
        warningLevel,
        isLoading,
        error,
        
        // Actions
        createSnapshot,
        deleteSnapshot: deleteSnapshotById,
        selectSnapshot: selectSnapshotById,
        clearAllSnapshots: clearAll,
        loadFullSnapshotData: loadFullData,
    };
};