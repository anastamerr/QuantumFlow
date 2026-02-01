import { screen } from '@testing-library/react'
import { vi } from 'vitest'
import { renderWithProviders } from '../test-utils'
import MeasurementGate from '../components/gates/MeasurementGate'

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, () => null],
}))

describe('MeasurementGate', () => {
  it('renders measurement gate card', () => {
    renderWithProviders(
      <MeasurementGate
        gate={{
          id: 'measure',
          name: 'Measure',
          symbol: 'M',
          description: 'Measures the qubit',
          category: 'Measurement',
          color: 'gray',
        }}
      />,
    )
    expect(screen.getByText('Measure')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })
})
