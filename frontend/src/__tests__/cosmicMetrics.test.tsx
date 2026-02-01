import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import COSMICMetricsPanel from '../components/panels/COSMICMetricsPanel'

describe('COSMICMetricsPanel', () => {
  it('renders metric summary and comparison', () => {
    renderWithProviders(
      <COSMICMetricsPanel
        metrics={{
          approach: 'occurrences',
          entries: 4,
          exits: 4,
          reads: 1,
          writes: 2,
          total_cfp: 11,
          functional_processes: [
            { name: 'h-0', gate_type: 'h', entries: 1, exits: 1, reads: 0, writes: 0, cfp: 2 },
          ],
        }}
        comparison={[
          {
            approach: 'types',
            entries: 2,
            exits: 0,
            reads: 2,
            writes: 3,
            total_cfp: 7,
            functional_processes: [],
          },
        ]}
      />,
    )

    expect(screen.getByText('COSMIC Metrics')).toBeInTheDocument()
    expect(screen.getByText('Entries')).toBeInTheDocument()
    expect(screen.getByText('Approach Comparison')).toBeInTheDocument()
  })
})
