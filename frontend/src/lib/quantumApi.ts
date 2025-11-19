export function getApiBaseUrl(): string {
  const vite = (typeof import.meta !== "undefined" && (import.meta as any).env)
    ? (import.meta as any).env.VITE_API_BASE_URL
    : undefined;
  
  const globalWin = (typeof window !== "undefined" ? (window as any).ENV?.API_BASE_URL : undefined);
  
  // Get the URL from env, global, or fallback
  let url = vite || globalWin || "http://127.0.0.1:8000/";
  
  // FIX: Force the URL to end with a slash if it doesn't already
  if (url && !url.endsWith('/')) {
    url += '/';
  }
  
  return url;
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

// NOTE: executeCircuit and checkHealth have been removed - all measurement is now local
// Only optimizeCircuitApi remains for circuit optimization (used in Sidebar.tsx)

export type OptimizePayload = {
  num_qubits: number;
  gates: StoreGate[];
};

export async function optimizeCircuitApi(payload: OptimizePayload) {
  const base = getApiBaseUrl();
  
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json() as Promise<{
    num_qubits: number;
    gates: StoreGate[];
  }>;
}

export async function checkHealth(): Promise<boolean> {
  const base = getApiBaseUrl();
  if (!base) return false;
  try {
    const res = await fetch(`${base}health`, { method: 'GET' });
    if (!res.ok) return false;
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
