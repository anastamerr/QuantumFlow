// --- This is the new file: frontend/src/utils/stateWorker.ts ---

// We must import the functions and types we need from the main stateEvolution.ts file.
// Since the worker is a separate module, we use an absolute path for the import.
import { 
    computeStateSnapshots, 
    type CircuitData, 
    type QuantumState 
} from './stateEvolution'; 

/**
 * Type definition for the data expected when the worker is initialized by postMessage.
 */
interface WorkerMessageData {
    circuit: CircuitData;
    numQubits: number;
}

/**
 * Type definition for the result data sent back to the main thread.
 */
interface WorkerResult {
    success: boolean;
    snapshots?: QuantumState[];
    error?: string;
}

// Attach the message listener to the global worker scope.
// The self type is a dedicated type for Web Workers.
self.onmessage = (e: MessageEvent<WorkerMessageData>) => {
    try {
        const { circuit, numQubits } = e.data;

        // 1. Run the heavy computation using the imported function
        // This blocks the worker thread, but not the main UI thread.
        const snapshots = computeStateSnapshots(circuit, numQubits);
        
        // 2. Post the successful result back to the main thread
        const result: WorkerResult = { 
            success: true, 
            snapshots: snapshots 
        };
        self.postMessage(result);
        
    } catch (error) {
        // 3. Post an error message back if anything fails
        console.error('State worker failed:', error);
        const result: WorkerResult = { 
            success: false, 
            error: (error as Error).message || 'Unknown error occurred in worker.' 
        };
        self.postMessage(result);
    }
};