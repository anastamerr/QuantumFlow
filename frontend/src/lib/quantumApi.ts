 import { setSnapshots, clearSnapshots } from '../features/snapshots/snapshotsSlice';
 import { 
normalizeSnapshot, 
calculateTotalSize, 
shouldAutoCollapse 
} from '../utils/snapshotSafetyUtils';
export function getApiBaseUrl(): string {
  const vite = (typeof import.meta !== "undefined" && (import.meta as any).env)
    ? (import.meta as any).env.VITE_API_BASE_URL
    : undefined;
  // Optional fallback to global injection if desired in future
  const globalWin = (typeof window !== "undefined" ? (window as any).ENV?.API_BASE_URL : undefined);
  return vite || globalWin || "";
}

export type StoreGate = {
  id?: string;
  type: string;
  qubit?: number;
  position?: number;
  params?: Record<string, number | string>;
  targets?: number[];
  controls?: number[];
};

export type ExecutePayload = {
  num_qubits: number;
  gates: StoreGate[];
  shots?: number;
  memory?: boolean;
  backend?: string;
};

export async function executeCircuit(payload: ExecutePayload) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured (VITE_API_BASE_URL)");

  const res = await fetch(`${base}/api/v1/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json() as Promise<{
    backend: string;
    shots: number;
    counts: Record<string, number>;
    probabilities: Record<string, number>;
    memory?: string[] | null;
    status: string;
  }>;
}

export async function checkHealth(): Promise<boolean> {
  const base = getApiBaseUrl();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/health`, { method: 'GET' });
    if (!res.ok) return false;
    // Optional: verify JSON status
    try {
      const data = await res.json();
      return !!data && (data.status === 'ok' || data.qiskit !== false);
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}
export async function getSnapshots(payload: ExecutePayload) { const base =
getApiBaseUrl(); const res = await fetch(`${base}/api/v1/evolution`, { method: "POST",
headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), }); if
(!res.ok) { throw new Error(`Snapshot error ${res.status}`); } return res.json() as
Promise<{ intermediateStates: any[]; status: string; }>; }
