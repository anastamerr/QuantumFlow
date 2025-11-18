import { Gate as StoreGate } from '../store/slices/circuitSlice'
import { Gate as CircuitGate } from '../types/circuit'

export type QuboDict = Record<string, number>

export interface IsingModel {
  offset: number
  h: Record<number, number>
  J: Record<string, number> // key "i,j" with i<j
}

export interface MaxCutEdge {
  u: number
  v: number
  weight?: number
}

export interface KnapsackItem {
  value: number
  weight: number
}

export function buildQuboMaxCut(edges: MaxCutEdge[]): QuboDict {
  const Q: QuboDict = {}
  const add = (i: number, j: number, value: number) => {
    if (i > j) [i, j] = [j, i]
    const key = `${i},${j}`
    Q[key] = (Q[key] ?? 0) + value
  }
  for (const e of edges) {
    const u = e.u
    const v = e.v
    const w = e.weight ?? 1
    add(u, u, -w)
    add(v, v, -w)
    add(u, v, 2 * w)
  }
  return Q
}

export function buildQuboKnapsack(items: KnapsackItem[], capacity: number, penalty?: number): QuboDict {
  const values = items.map(i => i.value)
  const weights = items.map(i => i.weight)
  if (values.length !== weights.length) throw new Error('values and weights length mismatch')
  const n = values.length
  if (n === 0) return {}
  const maxV = Math.max(...values.map(v => Number(v)))
  const lam = penalty ?? (maxV + 1)
  const Q: QuboDict = {}
  const add = (i: number, j: number, value: number) => {
    if (i > j) [i, j] = [j, i]
    const key = `${i},${j}`
    Q[key] = (Q[key] ?? 0) + value
  }
  // objective
  values.forEach((v, i) => add(i, i, -v))
  // penalty (sum w_i x_i - C)^2
  for (let i = 0; i < n; i++) {
    const wi = weights[i]
    const diag = lam * (wi * wi - 2 * capacity * wi)
    add(i, i, diag)
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const wi = weights[i]
      const wj = weights[j]
      add(i, j, 2 * lam * wi * wj)
    }
  }
  return Q
}

export function quboToIsing(Q: QuboDict): IsingModel {
  const diag: Record<number, number> = {}
  const off: Record<string, number> = {}
  for (const [key, value] of Object.entries(Q)) {
    const [iStr, jStr] = key.split(',')
    const i = Number(iStr)
    const j = Number(jStr)
    if (i === j) {
      diag[i] = (diag[i] ?? 0) + value
    } else {
      const k = i < j ? key : `${j},${i}`
      off[k] = (off[k] ?? 0) + value
    }
  }

  let offset = 0
  const h: Record<number, number> = {}
  const J: Record<string, number> = {}

  for (const [iStr, qii] of Object.entries(diag)) {
    const i = Number(iStr)
    offset += qii / 2
    h[i] = (h[i] ?? 0) - qii / 2
  }
  for (const [key, qij] of Object.entries(off)) {
    const [iStr, jStr] = key.split(',')
    const i = Number(iStr)
    const j = Number(jStr)
    const c = qij / 4
    offset += c
    h[i] = (h[i] ?? 0) - c
    h[j] = (h[j] ?? 0) - c
    const k = `${Math.min(i, j)},${Math.max(i, j)}`
    J[k] = (J[k] ?? 0) + c
  }

  return { offset, h, J }
}

export function evaluateBitstring(bitstring: string, Q: QuboDict): number {
  const x = Array.from(bitstring).map(b => (b === '1' ? 1 : 0))
  let energy = 0
  for (const [key, coeff] of Object.entries(Q)) {
    const [iStr, jStr] = key.split(',')
    const i = Number(iStr)
    const j = Number(jStr)
    if (i < x.length && j < x.length) {
      energy += coeff * x[i] * x[j]
    }
  }
  return energy
}

export interface QaoaLayerParams {
  betas: number[]
  gammas: number[]
}

// Build QAOA gates using existing gate type (h, rz, rx, cx)
export function buildQaoaCircuitGates(
  numQubits: number,
  ising: IsingModel,
  p: number,
  params: QaoaLayerParams,
  startPosition = 0,
): StoreGate[] {
  const gates: StoreGate[] = []
  let pos = startPosition

  const makeId = (type: string, qubit: number | undefined, extra: string) =>
    `${type}-${qubit ?? 'x'}-${extra}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // Initial Hadamards
  for (let q = 0; q < numQubits; q++) {
    gates.push({
      id: makeId('h', q, 'init'),
      type: 'h',
      qubit: q,
      position: pos,
    })
  }
  pos += 1

  for (let layer = 0; layer < p; layer++) {
    const beta = params.betas[layer]
    const gamma = params.gammas[layer]

    // Cost unitaries: Z terms (rz) and ZZ terms via cx-rz-cx
    for (const [iStr, hi] of Object.entries(ising.h)) {
      const i = Number(iStr)
      if (Math.abs(hi) < 1e-12) continue
      gates.push({
        id: makeId('rz', i, `lz-${layer}`),
        type: 'rz',
        qubit: i,
        position: pos,
        params: { theta: 2 * gamma * hi },
      })
      pos += 1
    }

    for (const [key, Jij] of Object.entries(ising.J)) {
      const [iStr, jStr] = key.split(',')
      const i = Number(iStr)
      const j = Number(jStr)
      if (Math.abs(Jij) < 1e-12) continue
      // cx(i,j)
      gates.push({
        id: makeId('cx', i, `zz1-${layer}`),
        type: 'cx',
        qubit: i,
        targets: [j],
        position: pos,
      })
      pos += 1
      // rz on j
      gates.push({
        id: makeId('rz', j, `zz2-${layer}`),
        type: 'rz',
        qubit: j,
        position: pos,
        params: { theta: 2 * gamma * Jij },
      })
      pos += 1
      // cx(i,j)
      gates.push({
        id: makeId('cx', i, `zz3-${layer}`),
        type: 'cx',
        qubit: i,
        targets: [j],
        position: pos,
      })
      pos += 1
    }

    // Mixer: RX(2*beta) on all qubits
    for (let q = 0; q < numQubits; q++) {
      gates.push({
        id: makeId('rx', q, `mix-${layer}`),
        type: 'rx',
        qubit: q,
        position: pos,
        params: { theta: 2 * beta },
      })
    }
    pos += 1
  }

  return gates
}
