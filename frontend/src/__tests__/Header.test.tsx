import { screen } from '@testing-library/react'
import Header from '../components/layout/Header'
import { renderWithProviders } from '../test-utils'

describe('Header', () => {
  it('renders the app title', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText('QuantumFlow')).toBeInTheDocument()
  })
})
