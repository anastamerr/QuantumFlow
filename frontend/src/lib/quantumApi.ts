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

// NOTE: executeCircuit and checkHealth have been removed - all measurement is now local
// Only optimizeCircuitApi remains for circuit optimization (used in Sidebar.tsx)

export type OptimizePayload = {
  num_qubits: number;
  gates: StoreGate[];
};

export async function optimizeCircuitApi(payload: OptimizePayload) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured (VITE_API_BASE_URL)");

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
