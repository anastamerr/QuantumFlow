import { Gate as CircuitGate } from '../../../types/circuit'
import { StoreGate } from '../../../store/slices/circuitSlice'

export interface DecodedCircuit {
  qubits: string[]
  gates: StoreGate[]
}

/**
 * Transform a CircuitGate or library gate back into the StoreGate format
 * Converts qubit references to numbers for Redux slice compatibility
 */
const transformCircuitGateToStoreGate = (gate: CircuitGate): StoreGate => {
  const qubitNumber = gate.qubit !== undefined
    ? gate.qubit
    : gate.targets?.[0] !== undefined
    ? Number(gate.targets[0])
    : 0

  const targets = gate.targets?.map(t => Number(t)) || []
  const controls = gate.controls?.map(c => Number(c)) || []

  return {
    id: gate.id || `${gate.type}_${Math.random().toString(36).substring(2, 8)}`,
    type: gate.type.toLowerCase(),
    qubit: qubitNumber,
    targets,
    controls,
    params: gate.params || {}
  }
}

/**
 * Normalize decoded gates from any decoder
 * Converts "q0" style strings to numeric indices
 */
const normalizeDecodedGates = (gates: StoreGate[]): StoreGate[] => {
  return gates.map(g => {
    const qubit = g.qubit !== undefined
      ? g.qubit
      : g.targets?.[0] !== undefined
      ? Number(g.targets[0].toString().replace('q', ''))
      : 0

    const targets = g.targets?.map(t => Number(t.toString().replace('q', '')))
    const controls = g.controls?.map(c => Number(c.toString().replace('q', '')))

    return { ...g, qubit, targets, controls }
  })
}

/**
 * Decode JSON string
 */
export const decodeJSON = (json: string): DecodedCircuit => {
  try {
    const parsed = JSON.parse(json)
    const qubits: string[] = parsed.qubits || []
    const gates: StoreGate[] = (parsed.gates || []).map((g: any) => ({
      id: g.id,
      type: g.type,
      qubit: g.qubit,
      targets: g.targets,
      controls: g.controls,
      params: g.params || {}
    }))
    return { qubits, gates: normalizeDecodedGates(gates) }
  } catch (e) {
    console.error('Failed to decode JSON:', e)
    return { qubits: [], gates: [] }
  }
}

/**
 * Decode Qiskit Python code
 */
export const decodeQiskit = (code: string): DecodedCircuit => {
  const qubits: string[] = []
  const gates: StoreGate[] = []

  const qubitMatch = code.match(/QuantumCircuit\((\d+)\)/)
  if (qubitMatch) {
    const numQubits = parseInt(qubitMatch[1])
    for (let i = 0; i < numQubits; i++) qubits.push(`q${i}`)
  }

  const gateRegex = /qc\.([a-z]+)\(([^)]*)\)/gi
  let match
  while ((match = gateRegex.exec(code)) !== null) {
    const [_, name, args] = match
    const targets: number[] = []
    const controls: number[] = []
    const params: { [key: string]: number } = {}

    args.split(',').map(a => a.trim()).forEach((a, i) => {
      const qMatch = a.match(/q\[(\d+)\]/)
      if (qMatch) targets.push(Number(qMatch[1]))
      else if (!isNaN(Number(a))) params[`param${i}`] = Number(a)
    })

    gates.push({
      id: `${name}_${Math.random().toString(36).substring(2, 8)}`,
      type: name.toLowerCase(),
      qubit: targets[0] || 0,
      targets,
      controls,
      params
    })
  }

  return { qubits, gates: normalizeDecodedGates(gates) }
}

/**
 * Decode Cirq Python code
 */
export const decodeCirq = (code: string): DecodedCircuit => {
  const qubits: string[] = []
  const gates: StoreGate[] = []

  const qubitMatch = code.match(/range\((\d+)\)/)
  if (qubitMatch) {
    const numQubits = parseInt(qubitMatch[1])
    for (let i = 0; i < numQubits; i++) qubits.push(`q${i}`)
  }

  const gateRegex = /cirq\.([a-zA-Z]+)\(([^)]*)\)/gi
  let match
  while ((match = gateRegex.exec(code)) !== null) {
    const [_, name, args] = match
    const targets: number[] = []
    const controls: number[] = []
    const params: { [key: string]: number } = {}

    args.split(',').map(a => a.trim()).forEach((a, i) => {
      const qMatch = a.match(/q\[(\d+)\]/)
      if (qMatch) targets.push(Number(qMatch[1]))
      else if (!isNaN(Number(a))) params[`param${i}`] = Number(a)
    })

    gates.push({
      id: `${name}_${Math.random().toString(36).substring(2, 8)}`,
      type: name.toLowerCase(),
      qubit: targets[0] || 0,
      targets,
      controls,
      params
    })
  }

  return { qubits, gates: normalizeDecodedGates(gates) }
}

/**
 * Decode QASM string
 */
export const decodeQASM = (qasm: string): DecodedCircuit => {
  const qubits: string[] = []
  const gates: StoreGate[] = []

  const lines = qasm.split('\n').map(l => l.trim()).filter(Boolean)
  const qRegRegex = /qreg\s+(\w+)\[(\d+)\];/
  const gateRegex = /^([a-zA-Z]+)\s+([\w\[\], ]+);/

  lines.forEach(line => {
    let match
    if ((match = qRegRegex.exec(line))) {
      const [_, name, size] = match
      for (let i = 0; i < parseInt(size); i++) qubits.push(`${name}${i}`)
    } else if ((match = gateRegex.exec(line))) {
      const [_, name, args] = match

      const targets: number[] = []
      const controls: number[] = []

      args.split(',').map(a => a.trim()).forEach(arg => {
        const qMatch = arg.match(/\w+\[(\d+)\]/) // extract number inside brackets
        if (qMatch) {
          targets.push(Number(qMatch[1]))
        } else if (!isNaN(Number(arg))) {
          // param
        }
      })

      gates.push({
        id: `${name}_${Math.random().toString(36).substring(2, 8)}`,
        type: name.toLowerCase(),
        qubit: targets.length > 0 ? targets[0] : undefined, // use first target if available
        targets,
        controls,
        params: {}
      })
    }
  })

  return { qubits, gates: normalizeDecodedGates(gates) }
}


/**
 * Unified decoder
 */

export const decodeCircuitCode = (code: string, format: 'qiskit' | 'cirq' | 'json' | 'qasm'): DecodedCircuit => {
  switch (format) {
    case 'json': return decodeJSON(code)
    case 'qiskit': return decodeQiskit(code)
    case 'cirq': return decodeCirq(code)
    case 'qasm': return decodeQASM(code)
    default: return { qubits: [], gates: [] }
  }
}
