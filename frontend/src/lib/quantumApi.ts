export function getApiBaseUrl(): string {
  const vite = (typeof import.meta !== "undefined" && (import.meta as any).env)
    ? (import.meta as any).env.VITE_API_BASE_URL
    : undefined;
  // Optional fallback to global injection if desired in future
  const globalWin = (typeof window !== "undefined" ? (window as any).ENV?.API_BASE_URL : undefined);
  return vite || globalWin || "";
}

function getBasicAuthHeader(): string | undefined {
  const vite = (typeof import.meta !== "undefined" && (import.meta as any).env)
    ? (import.meta as any).env.VITE_API_BASIC_AUTH
    : undefined;
  if (!vite) return undefined;
  if (vite.startsWith("Basic ")) return vite;
  if (vite.includes(":") && typeof btoa === "function") {
    return `Basic ${btoa(vite)}`;
  }
  return `Basic ${vite}`;
}

export type StoreGate = {
  id?: string;
  type: string;
  qubit?: number;
  position?: number;
  params?: Record<string, number | string | boolean>;
  targets?: number[];
  controls?: number[];
};

export type ExecutePayload = {
  num_qubits: number;
  gates: StoreGate[];
  method?: 'qasm' | 'statevector' | 'noisy';
  shots?: number;
  memory?: boolean;
  backend?: string;
  include_metrics?: boolean;
  cosmic_approach?: 'occurrences' | 'types' | 'q-cosmic';
  measurement_config?: {
    basis: 'z' | 'x' | 'y';
    qubits?: number[];
    classical_bits?: number[];
    reset_after?: boolean;
    mid_circuit?: boolean;
  };
};

export async function executeCircuit(payload: ExecutePayload) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured (VITE_API_BASE_URL)");

  const authHeader = getBasicAuthHeader();
  const res = await fetch(`${base}/api/v1/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json() as Promise<{
    backend: string;
    method?: string;
    shots: number;
    counts: Record<string, number>;
    probabilities: Record<string, number>;
    statevector?: Record<string, [number, number]> | null;
    measurement_basis?: Record<string, string> | null;
    per_qubit_probabilities?: Record<string, Record<string, number>> | null;
    cosmic_metrics?: {
      approach: string;
      entries: number;
      exits: number;
      reads: number;
      writes: number;
      total_cfp: number;
      functional_processes: {
        name: string;
        gate_type: string;
        entries: number;
        exits: number;
        reads: number;
        writes: number;
        cfp: number;
      }[];
    } | null;
    hardware_metrics?: {
      circuit_depth: number;
      circuit_width: number;
      gate_count: Record<string, number>;
      t_count: number;
      t_depth: number;
      cnot_count: number;
      single_qubit_gates: number;
      two_qubit_gates: number;
      multi_qubit_gates: number;
      measurement_count: number;
      entanglement_ratio?: number | null;
      entanglement_depth?: number | null;
      quantum_volume?: number | null;
      estimated_fidelity?: number | null;
    } | null;
    confidence_intervals?: Record<string, [number, number]> | null;
    warnings?: string[] | null;
    memory?: string[] | null;
    status: string;
  }>;
}

export async function fetchCosmicMetrics(payload: ExecutePayload) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured (VITE_API_BASE_URL)");

  const authHeader = getBasicAuthHeader();
  const res = await fetch(`${base}/api/v1/metrics/cosmic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchHardwareMetrics(payload: ExecutePayload) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured (VITE_API_BASE_URL)");

  const authHeader = getBasicAuthHeader();
  const res = await fetch(`${base}/api/v1/metrics/hardware`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  const base = getApiBaseUrl();
  if (!base) return false;
  try {
    const authHeader = getBasicAuthHeader();
    const res = await fetch(`${base}/health`, {
      method: 'GET',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
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
