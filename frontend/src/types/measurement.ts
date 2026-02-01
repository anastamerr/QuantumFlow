export type MeasurementBasis = 'z' | 'x' | 'y' | 'custom'

export interface MeasurementConfig {
  basis: MeasurementBasis
  customBasis?: number[][] | [number, number][][]
  qubits: number[]
  classicalBits: number[]
  resetAfter: boolean
  midCircuit: boolean
}

export interface MeasurementResult {
  qubit: number
  classicalBit: number
  outcome: 0 | 1
  probability: number
  basis: string
  timestamp?: number
}

export interface FunctionalProcess {
  name: string
  gateType: string
  entries: number
  exits: number
  reads: number
  writes: number
  cfp: number
}

export interface COSMICMetrics {
  approach: 'occurrences' | 'types' | 'q-cosmic'
  entries: number
  exits: number
  reads: number
  writes: number
  totalCFP: number
  functionalProcesses: FunctionalProcess[]
}

export interface HardwareMetrics {
  circuitDepth: number
  circuitWidth: number
  gateCount: Record<string, number>
  tCount: number
  tDepth: number
  cnotCount: number
  measurementCount: number
  entanglementRatio?: number
  entanglementDepth?: number
  quantumVolume?: number
}

export interface MeasurementSettings {
  overrideEnabled: boolean
  basis: MeasurementBasis
  resetAfter: boolean
  qubits: number[]
}

export interface MeasurementRun {
  timestamp: string
  shots: number
  method: string
  probabilities: Record<string, number>
  counts?: Record<string, number>
  measurementBasis?: Record<string, string>
  perQubitProbabilities?: Record<string, Record<string, number>>
  confidenceIntervals?: Record<string, [number, number]>
  cosmicMetrics?: COSMICMetrics | null
  hardwareMetrics?: HardwareMetrics | null
  measurementOverride?: MeasurementSettings | null
}
