import { Gate as CircuitGate } from '../../../types/circuit'
import { StoreGate } from '../../../store/slices/circuitSlice'

export interface Qubit {
  id: number
  name: string
}

export interface Gate {
  id: string
  type: string
  qubit: number
  targets: number[]
  controls: number[]
  params: Record<string, number | string>
  position: number
}

export interface DecodedCircuit {
  qubits: Qubit[]
  gates: Gate[]
  maxPosition: number
  name: string
  description: string
}

/**
 * Transform a CircuitGate or library gate back into the StoreGate format
 */
const transformCircuitGateToStoreGate = (gate: CircuitGate): StoreGate => {
  const qubitNumber = gate.qubit ?? gate.targets?.[0] ?? 0
  const targets = gate.targets?.map(Number) ?? []
  const controls = gate.controls?.map(Number) ?? []

  return {
    id: gate.id ?? `${gate.type}_${Math.random().toString(36).substring(2, 8)}`,
    type: gate.type.toLowerCase(),
    qubit: qubitNumber,
    targets,
    controls,
    params: gate.params ?? {}
  }
}

/**
 * Normalize decoded gates
 */
const normalizeDecodedGates = (gates: Gate[]): Gate[] => {
  return gates.map(g => {
    const qubit = g.qubit ?? g.targets?.[0] ?? 0
    const targets = g.targets?.map(t => Number(t)) ?? []
    const controls = g.controls?.map(c => Number(c)) ?? []
    return { ...g, qubit, targets, controls }
  })
}

/**
 * Helper to create DecodedCircuit
 */
const createDecodedCircuit = (qubits: Qubit[], gates: Gate[], name = "Imported Circuit", description = ""): DecodedCircuit => {
  const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 5 : 10
  console.log(`[Decoder] Created circuit "${name}" with ${qubits.length} qubits and ${gates.length} gates.`)
  gates.forEach(g => console.log(`[Decoder] Gate: ${g.type} q:${g.qubit} pos:${g.position} targets:${g.targets} controls:${g.controls}`))
  return { qubits, gates: normalizeDecodedGates(gates), maxPosition, name, description }
}

/**
 * Decode JSON
 */
export const decodeJSON = (json: string): DecodedCircuit => {
  try {
    const parsed = JSON.parse(json)
    const qubits: Qubit[] = (parsed.qubits || []).map((q: string, i: number) => ({ id: i, name: q }))
    const gates: Gate[] = (parsed.gates || []).map((g: any, index: number) => ({
      id: g.id ?? `${g.type}_${Math.random().toString(36).substring(2, 8)}`,
      type: g.type,
      qubit: g.qubit ?? 0,
      targets: g.targets ?? [],
      controls: g.controls ?? [],
      params: g.params ?? {},
      position: g.position ?? index
    }))
    return createDecodedCircuit(qubits, gates, parsed.name, parsed.description)
  } catch (e) {
    console.error('Failed to decode JSON:', e)
    return createDecodedCircuit([], [])
  }
}

export const decodeQiskit = (code: string): DecodedCircuit => {
  const qubits: Qubit[] = [];
  const gates: Gate[] = [];
  const positions: Record<number, number> = {};

  // Detect number of qubits
  let numQubits = 0;
  const qcMatch = code.match(/QuantumCircuit\((\d+)/);
  if (qcMatch) numQubits = parseInt(qcMatch[1], 10);

  if (numQubits === 0) {
    const qMatches = [...code.matchAll(/q\[(\d+)\]/g)];
    numQubits = qMatches.length > 0 ? Math.max(...qMatches.map(m => parseInt(m[1]))) + 1 : 1;
  }

  for (let i = 0; i < numQubits; i++) {
    qubits.push({ id: i, name: `q${i}` });
    positions[i] = 0;
  }

  const gateRegex = /qc\.([a-zA-Z]+)\(([^)]*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = gateRegex.exec(code)) !== null) {
    const [, gateName, args] = match;
    const lname = gateName.toLowerCase();

    const argList = args.split(',').map(a => a.trim());
    const controls: number[] = [];
    const targets: number[] = [];
    const params: Record<string, number | string> = {};

    // Detect multi-qubit controlled gates
    if (lname === 'cx' || lname === 'cnot' || lname === 'cz') {
      const control = parseInt(argList[0]) ?? 0;
      const target = parseInt(argList[1]) ?? 0;
      controls.push(control);
      targets.push(target);
    } else if (lname === 'ccx' || lname === 'toffoli') {
      controls.push(parseInt(argList[0]) ?? 0, parseInt(argList[1]) ?? 0);
      targets.push(parseInt(argList[2]) ?? 0);
    } else if (lname === 'swap') {
      targets.push(parseInt(argList[0]) ?? 0, parseInt(argList[1]) ?? 0);
    } else if (['rx','ry','rz','p'].includes(lname)) {
      const qubit = parseInt(argList[argList.length - 1]) ?? 0;
      targets.push(qubit);
      const val = parseFloat(argList[0]) ?? 0;
      if (lname === 'rx' || lname === 'ry') params.theta = val;
      else params.phi = val;
    } else if (['h','x','y','z','s','t'].includes(lname)) {
      const qubit = parseInt(argList[0]) ?? 0;
      targets.push(qubit);
    } else if (lname === 'measure') {
      // Only parse as gate if arg0 === arg1 to avoid duplicate measures
      const qubit0 = parseInt(argList[0]) ?? 0;
      const qubit1 = parseInt(argList[1]) ?? 0;
      if (qubit0 === qubit1) targets.push(qubit0);
      else continue; // skip if it's a classical register measure
    } else {
      const qubit = parseInt(argList[0]) ?? 0;
      targets.push(qubit);
    }

    // Determine main qubit and remove overlap
    const uniqueTargets = targets.filter(t => !controls.includes(t));
    const qubitIndex = controls.length > 0 ? controls[0] : uniqueTargets[0] ?? 0;

    // Compute max position among involved qubits
    const involvedQubits = [...controls, ...uniqueTargets];
    let maxPos = 0;
    involvedQubits.forEach(q => {
      const pos = positions[q] ?? 0;
      if (pos > maxPos) maxPos = pos;
    });
    involvedQubits.forEach(q => positions[q] = maxPos + 1);

    gates.push({
      id: `${lname}_${Math.random().toString(36).substring(2, 8)}`,
      type: lname,
      qubit: qubitIndex,
      targets: uniqueTargets,
      controls,
      params,
      position: maxPos
    });
  }

  return createDecodedCircuit(qubits, gates);
};



/**
 * Decode Cirq
 */
export const decodeCirq = (code: string): DecodedCircuit => {
  const qubits: Qubit[] = []
  const gates: Gate[] = []
  const positions: Record<number, number> = {}

  const qubitMatch = code.match(/range\((\d+)\)/)
  if (qubitMatch) {
    const numQubits = parseInt(qubitMatch[1])
    for (let i = 0; i < numQubits; i++) {
      qubits.push({ id: i, name: `q${i}` })
      positions[i] = 0
    }
  }

  const gateRegex = /cirq\.([a-zA-Z]+)\(([^)]*)\)/gi
  let match
  while ((match = gateRegex.exec(code)) !== null) {
    const [_, name, args] = match
    const targets: number[] = []
    const controls: number[] = []
    const params: Record<string, number | string> = {}

    args.split(',').map(a => a.trim()).forEach((a, i) => {
      const qMatch = a.match(/q\[(\d+)\]/)
      if (qMatch) targets.push(Number(qMatch[1]))
      else if (!isNaN(Number(a))) params[`param${i}`] = Number(a)
    })

    const qubitIndex = targets[0] ?? 0
    const pos = positions[qubitIndex] ?? 0
    positions[qubitIndex] = pos + 1

    gates.push({
      id: `${name}_${Math.random().toString(36).substring(2, 8)}`,
      type: name.toLowerCase(),
      qubit: qubitIndex,
      targets,
      controls,
      params,
      position: pos
    })
  }

  return createDecodedCircuit(qubits, gates)
}

/**
 * Decode QASM
 */
export const decodeQASM = (qasm: string): DecodedCircuit => {
  const qubits: Qubit[] = []
  const gates: Gate[] = []
  const positions: Record<number, number> = {}

  const lines = qasm.split('\n').map(l => l.trim()).filter(Boolean)
  const qRegRegex = /qreg\s+(\w+)\[(\d+)\];/
  const gateRegex = /^([a-zA-Z]+)\s+([\w\[\],\s\+\-\.]+);/

  for (const line of lines) {
    if (line.startsWith('creg') || line.startsWith('measure')) continue

    // Qubit register
    const regMatch = qRegRegex.exec(line)
    if (regMatch) {
      const [, regName, sizeStr] = regMatch
      const size = parseInt(sizeStr, 10)
      for (let i = 0; i < size; i++) {
        qubits.push({ id: i, name: `${regName}${i}` })
        positions[i] = 0
      }
      continue
    }

    // Gate line
    const gateMatch = gateRegex.exec(line)
    if (!gateMatch) continue
    let [, gateName, args] = gateMatch
    let lname = gateName.toLowerCase()

    // Normalize some gates
    if (lname === 'cx') lname = 'cnot'
    else if (lname === 'ccx') lname = 'toffoli'

    const argList = args.split(',').map(a => a.trim())
    const controls: number[] = []
    const targets: number[] = []
    const params: Record<string, number | string> = {}

    // Multi-qubit controlled gates
    if (['cnot', 'cy', 'cz', 'toffoli'].includes(lname)) {
      const indices = argList.map(a => parseInt(a.match(/\w+\[(\d+)\]/)?.[1] ?? '0'))

      if (lname === 'toffoli') {
        controls.push(indices[0], indices[1])
        targets.push(indices[2])
      } else {
        controls.push(indices[0])
        targets.push(indices[1])
      }
    } else if (lname === 'swap') {
      const indices = argList.map(a => parseInt(a.match(/\w+\[(\d+)\]/)?.[1] ?? '0'))
      targets.push(...indices)
    } else {
      // Single-qubit gates (and parameterized gates)
      argList.forEach((a, i) => {
        const m = a.match(/\w+\[(\d+)\]/)
        if (m) targets.push(parseInt(m[1], 10))
        else if (!isNaN(Number(a))) params[`param${Object.keys(params).length}`] = Number(a)
      })
    }

    // Remove overlapping qubits
    const uniqueTargets = targets.filter(t => !controls.includes(t))
    // Main qubit: first control if exists, else first target
    const qubitIndex = controls.length > 0 ? controls[0] : uniqueTargets[0] ?? 0

    // Compute max position
    const involvedQubits = [...controls, ...uniqueTargets]
    let maxPos = 0
    involvedQubits.forEach(q => {
      const pos = positions[q] ?? 0
      if (pos > maxPos) maxPos = pos
    })
    // Update positions for next gate
    involvedQubits.forEach(q => positions[q] = maxPos + 1)

    gates.push({
      id: `${lname}_${Math.random().toString(36).substring(2, 8)}`,
      type: lname,
      qubit: qubitIndex,
      targets: uniqueTargets,
      controls,
      params,
      position: maxPos
    })
  }

  return createDecodedCircuit(qubits, gates)
}



/**
 * Unified decoder
 */
export const decodeCircuitCode = (code: string, format: 'qiskit' | 'cirq' | 'json' | 'qasm'): DecodedCircuit => {
  console.log(`[Decoder] Decoding format: ${format}`)
  switch (format) {
    case 'json': return decodeJSON(code)
    case 'qiskit': return decodeQiskit(code)
    case 'cirq': return decodeCirq(code)
    case 'qasm': return decodeQASM(code)
    default:
      console.warn('[Decoder] Unknown format, returning empty circuit')
      return createDecodedCircuit([], [])
  }
}
