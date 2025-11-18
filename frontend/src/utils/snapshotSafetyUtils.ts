 import { Snapshot } from '../features/snapshots/snapshotsSlice';
 /**
 * Truncates a state string to maximum length
 */
 export const truncateState = (stateString: string | any, maxChars: number = 300): string => {
 if (!stateString) return '';
 // Convert to string if it's an object or array
 const stateStr = typeof stateString === 'string' 
? stateString 
: JSON.stringify(stateString, null, 2);
 if (stateStr.length <= maxChars) {
 return stateStr;
 }
 return stateStr.slice(0, maxChars) + '...';
 };
 /**
 * Determines if snapshots should be auto-collapsed
*/
 export const shouldAutoCollapse = (snapshots: Snapshot[]): boolean => {
 if (!snapshots || snapshots.length === 0) return false;
 // Rule 1: More than 20 snapshots
 if (snapshots.length > 20) return true;
 // Rule 2: Any single snapshot exceeds 50,000 characters
 const hasHugeSnapshot = snapshots.some(snap => snap.characterCount > 50000);
 if (hasHugeSnapshot) return true;
 // Rule 3: Total characters exceed 500,000
 const totalChars = calculateTotalSize(snapshots);
 if (totalChars > 500000) return true;
 // Rule 4: Any snapshot has 10+ qubits
 const hasLargeQubitCount = snapshots.some(snap => snap.qubitCount >= 10);
 if (hasLargeQubitCount) return true;
 // Rule 5: Low-end device detection
 if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
 if (navigator.hardwareConcurrency < 4 && snapshots.length > 10) {
 return true;
 }
 }
return false;
 };
 /**
 * Calculates total character count across all snapshots
 */
 export const calculateTotalSize = (snapshots: Snapshot[]): number => {
 if (!snapshots || snapshots.length === 0) return 0;
 return snapshots.reduce((sum, snapshot) => {
 return sum + (snapshot.characterCount || 0);
 }, 0);
 };
 /**
 * Normalizes a raw snapshot from backend
 */
 export const normalizeSnapshot = (rawSnapshot: any, index: number): Snapshot => {
 // Extract state from various possible field names
 let stateData = rawSnapshot.state 
|| rawSnapshot.stateVector 
|| rawSnapshot.amplitudes 
|| rawSnapshot.raw
 || rawSnapshot.quantumState
 || '';
// Convert to string if it's an object/array
 const stateString = typeof stateData === 'string'
 ? stateData
 : JSON.stringify(stateData, null, 2);
 const characterCount = stateString.length;
 const isLarge = characterCount > 10000;
 // Calculate qubit count from state size (2^n amplitudes)
 let qubitCount = 0;
 if (rawSnapshot.qubitCount) {
 qubitCount = rawSnapshot.qubitCount;
 } else if (Array.isArray(stateData)) {
 qubitCount = Math.log2(stateData.length);
 }
 return {
 id: rawSnapshot.id || `snapshot-${index}`,
 gateIndex: rawSnapshot.gateIndex ?? index,
 gateName: rawSnapshot.gateName || rawSnapshot.gate || `Gate ${index}`,
 statePreview: truncateState(stateString, 300),
 fullState: stateString,
 characterCount,
 qubitCount,
 isLarge,
 timestamp: rawSnapshot.timestamp || Date.now(),
};
 };
 /**
 * Formats large numbers with commas
 */
 export const formatCharacterCount = (num: number): string => {
 if (!num) return '0';
 return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
 };
 /**
 * Estimates memory usage in MB
 */
 export const estimateMemoryUsage = (characterCount: number): string => {
 // Rough estimate: 2 bytes per character in JavaScript
 const bytes = characterCount * 2;
 const megabytes = bytes / (1024 * 1024);
 if (megabytes < 1) {
 return `${(megabytes * 1024).toFixed(1)} KB`;
 }
 return `${megabytes.toFixed(1)} MB`;
 };
/**
 * Sanitizes state string by removing potentially dangerous characters
 */
 export const sanitizeState = (state: string): string => {
 if (!state) return '';
 // Remove any HTML tags
 let sanitized = state.replace(/<[^>]*>/g, '');
 // Remove any script content
 sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
 return sanitized;
 };
 /**
 * Detects device tier for performance optimization
 */
 export const detectDeviceTier = (): 'low' | 'medium' | 'high' => {
 if (typeof navigator === 'undefined') return 'medium';
 const ram = (navigator as any).deviceMemory || 4;
 const cores = navigator.hardwareConcurrency || 2;
 if (ram <= 2 || cores <= 2) return 'low';
 if (ram <= 4 || cores <= 4) return 'medium';
return 'high';
 };