import type { CircuitState, Gate } from '../store/slices/circuitSlice'

export interface GateUsageMatrix {
  gateNames: string[]
  matrix: Record<string, number[]>
  maxCount: number
}

type CircuitLike = Pick<CircuitState, 'gates' | 'qubits'>

/**
 * Compute gate usage counts per qubit for every gate type in a circuit.
 */
export function computeGateUsageMatrix(circuit: CircuitLike): GateUsageMatrix {
  const numQubits = Array.isArray(circuit.qubits) ? circuit.qubits.length : 0
  const matrix: Record<string, number[]> = {}
  let maxCount = 0

  const increment = (gateName: string, qubitIndex: number) => {
    if (qubitIndex < 0 || qubitIndex >= numQubits) return
    if (!matrix[gateName]) {
      matrix[gateName] = Array(numQubits).fill(0)
    }
    matrix[gateName][qubitIndex] += 1
    if (matrix[gateName][qubitIndex] > maxCount) {
      maxCount = matrix[gateName][qubitIndex]
    }
  }

  circuit.gates.forEach((gate: Gate) => {
    const gateName = gate.type || 'unknown'

    const involvedQubits = new Set<number>()
    if (typeof gate.qubit === 'number') {
      involvedQubits.add(gate.qubit)
    }
    gate.targets?.forEach((target) => {
      if (typeof target === 'number') {
        involvedQubits.add(target)
      }
    })
    gate.controls?.forEach((control) => {
      if (typeof control === 'number') {
        involvedQubits.add(control)
      }
    })

    if (involvedQubits.size === 0) {
      increment(gateName, 0)
    } else {
      involvedQubits.forEach((qubitIndex) => increment(gateName, qubitIndex))
    }
  })

  const gateNames = Object.keys(matrix).sort()

  return {
    gateNames,
    matrix,
    maxCount,
  }
}

export default computeGateUsageMatrix

