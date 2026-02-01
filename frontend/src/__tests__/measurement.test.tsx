import { act, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { renderWithProviders } from '../test-utils'
import SimulationPanel from '../components/panels/SimulationPanel'
import MeasurementVisualizer from '../components/visualization/MeasurementVisualizer'
import { store } from '../store'
import {
  addMeasurementHistoryEntry,
  clearMeasurementHistory,
  setMeasurementSettings,
} from '../store/slices/circuitSlice'

vi.mock('@/lib/quantumApi', () => ({
  executeCircuit: vi.fn(),
  checkHealth: vi.fn().mockResolvedValue(true),
}))

describe('Measurement UI', () => {
  beforeAll(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }),
      })
    }
  })

  it('renders measurement override controls', async () => {
    await act(async () => {
      renderWithProviders(<SimulationPanel />)
      await Promise.resolve()
    })
    expect(screen.getByText('Measurement Override')).toBeInTheDocument()
    expect(screen.getByText('Override circuit measurements')).toBeInTheDocument()
    expect(screen.getByText('Reset after measurement')).toBeInTheDocument()
  })

  it('renders measurement visualization sections', () => {
    renderWithProviders(
      <MeasurementVisualizer
        perQubitProbabilities={{ '0': { '0': 0.7, '1': 0.3 } }}
        measurementBasis={{ '0': 'x' }}
        confidenceIntervals={{ '0': [0.6, 0.8] }}
        stateProbabilities={{ '0': 0.7, '1': 0.3 }}
        measurementTimeline={[{ qubit: 0, position: 2, basis: 'x' }]}
      />,
    )

    expect(screen.getByText('Per-Qubit Measurement')).toBeInTheDocument()
    expect(screen.getByText('Probability Histogram')).toBeInTheDocument()
    expect(screen.getByText('Measurement Timeline')).toBeInTheDocument()
  })

  it('updates measurement state in the store', () => {
    store.dispatch(
      setMeasurementSettings({
        overrideEnabled: true,
        basis: 'y',
        resetAfter: true,
        qubits: [0],
      }),
    )
    store.dispatch(
      addMeasurementHistoryEntry({
        timestamp: Date.now(),
        shots: 128,
        method: 'statevector',
        basis: 'y',
        counts: { '0': 128 },
        probabilities: { '0': 1 },
      }),
    )

    const state = store.getState().circuit
    expect(state.measurementSettings.overrideEnabled).toBe(true)
    expect(state.measurementSettings.basis).toBe('y')
    expect(state.measurementSettings.resetAfter).toBe(true)
    expect(state.measurementHistory.length).toBeGreaterThan(0)

    store.dispatch(
      setMeasurementSettings({
        overrideEnabled: false,
        basis: 'z',
        resetAfter: false,
        qubits: [],
      }),
    )
    store.dispatch(clearMeasurementHistory())
  })
})
