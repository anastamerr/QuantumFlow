export interface AIChatRequest {
  history: { role: string; content: string }[]
  message: string
  model?: string
  // include the current circuit state for context and validation
  circuit?: {
    qubits: { id: number; name: string }[]
    gates: any[]
    maxPosition?: number
    name?: string
    description?: string
  }
}

export const aiChat = async (req: AIChatRequest) => {
  // Allow overriding API base in dev via VITE_API_BASE (set in vite config or env).
  // Build the URL robustly so trailing/leading slashes don't produce `//`.
  const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? ''
  const buildUrl = (p: string) => {
    const base = String(API_BASE).replace(/\/+$/g, '')
    const path = String(p).replace(/^\/+/, '')
    return base ? `${base}/${path}` : `/${path}`
  }

  const resp = await fetch(buildUrl('/api/v1/ai/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  })
  if (!resp.ok) {
    const text = await resp.text()
    // Try to parse JSON error bodies from FastAPI (e.g. { detail: '...' })
    try {
      const parsed = JSON.parse(text)
      const detail = parsed?.detail || parsed?.message || JSON.stringify(parsed)
      throw new Error(`AI request failed (status ${resp.status}): ${detail || text || resp.statusText}`)
    } catch (e) {
      // If parsing failed, include raw text and status to aid debugging
      throw new Error(`AI request failed (status ${resp.status}): ${text || resp.statusText || 'no response body'}`)
    }
  }
  return resp.json()
}

export default { aiChat }
