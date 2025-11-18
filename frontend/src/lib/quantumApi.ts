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

// AI Chat API
export async function generateCircuitFromChat(
  message: string, 
  numQubits: number = 2,
  currentCircuit?: { qubits: number; gates: any[] },
  conversationHistory?: Array<{ role: string; content: string }>
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/chat/generate-circuit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      message, 
      num_qubits: numQubits,
      current_circuit: currentCircuit,
      conversation_history: conversationHistory,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json() as Promise<{
    response: string;
    gates: StoreGate[];
    explanation: string;
    teaching_note?: string;
    next_suggestions?: string[];
    warnings?: string[];
    praise?: string;
    num_qubits: number;
    status: string;
  }>;
}

// QML API
export async function trainQNN(config: {
  train_data: number[][];
  train_labels: number[];
  num_qubits: number;
  num_layers: number;
  encoding: string;
  learning_rate: number;
  epochs: number;
  shots: number;
  cost_function: string;
}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/qml/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Training error ${res.status}: ${text}`);
  }

  return res.json() as Promise<{
    parameters: number[];
    final_loss: number;
    history: { loss: number[]; epoch: number[] };
    num_params: number;
    epochs_completed: number;
    status: string;
  }>;
}

export async function evaluateQNN(config: {
  test_data: number[][];
  test_labels: number[];
  parameters: number[];
  num_qubits: number;
  num_layers: number;
  encoding: string;
  shots: number;
}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/qml/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evaluation error ${res.status}: ${text}`);
  }

  return res.json() as Promise<{
    accuracy: number;
    mse: number;
    predictions: number[];
    confusion_matrix: { tp: number; tn: number; fp: number; fn: number };
    status: string;
  }>;
}

export async function getQMLTemplates() {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/qml/templates`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Templates error ${res.status}: ${text}`);
  }

  return res.json() as Promise<{
    templates: Array<{
      id: string;
      name: string;
      description: string;
      num_qubits: number;
      num_layers: number;
      encoding: string;
      num_parameters: number;
    }>;
    status: string;
  }>;
}

export async function encodeData(dataPoint: number[], numQubits: number, encoding: string) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/qml/encode-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_point: dataPoint,
      num_qubits: numQubits,
      encoding: encoding,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Encoding error ${res.status}: ${text}`);
  }

  return res.json() as Promise<{
    gates: StoreGate[];
    encoding_method: string;
    status: string;
  }>;
}

// === Lesson API ===

export async function startLesson(lessonId: string, userId: string = "default") {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/lessons/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lesson_id: lessonId,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to start lesson ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getLessonStepGuidance(
  lessonId: string,
  stepNumber: number,
  lessonData: any,
  userId: string = "default"
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/lessons/guidance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lesson_id: lessonId,
      step_number: stepNumber,
      lesson_data: lessonData,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get guidance ${res.status}: ${text}`);
  }

  return res.json();
}

export async function validateLessonStep(
  lessonId: string,
  stepNumber: number,
  userCircuit: any[],
  lessonData: any,
  userId: string = "default"
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/lessons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lesson_id: lessonId,
      step_number: stepNumber,
      user_circuit: userCircuit,
      lesson_data: lessonData,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to validate step ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getLessonHint(
  lessonId: string,
  stepNumber: number,
  lessonData: any,
  userCircuit: any[],
  userId: string = "default"
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/lessons/hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lesson_id: lessonId,
      step_number: stepNumber,
      lesson_data: lessonData,
      user_circuit: userCircuit,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get hint ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getLessonStatus(userId: string = "default") {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/lessons/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get lesson status ${res.status}: ${text}`);
  }

  return res.json();
}

export async function suggestNextAction(
  lessonId: string,
  userCircuit: any[],
  lessonData: any,
  userId: string = "default"
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/lessons/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lesson_id: lessonId,
      user_circuit: userCircuit,
      lesson_data: lessonData,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get suggestion ${res.status}: ${text}`);
  }

  return res.json();
}

export async function fixCircuitIssue(
  lessonId: string,
  stepNumber: number,
  userCircuit: any[],
  lessonData: any,
  issueType: string,
  userId: string = "default"
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL is not configured");

  const res = await fetch(`${base}/api/v1/lessons/fix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lesson_id: lessonId,
      step_number: stepNumber,
      user_circuit: userCircuit,
      lesson_data: lessonData,
      issue_type: issueType,
      user_id: userId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fix issue ${res.status}: ${text}`);
  }

  return res.json();
}

export const quantumApi = {
  executeCircuit,
  generateCircuitFromChat,
  trainQNN,
  evaluateQNN,
  getQMLTemplates,
  encodeData,
  startLesson,
  getLessonStepGuidance,
  validateLessonStep,
  getLessonHint,
  getLessonStatus,
  suggestNextAction,
  fixCircuitIssue,
};
