import {
  calculateEntropy,
  calculateMean,
  calculateVariance,
  chiSquaredTest,
  calculateQubitCorrelations,
  confidenceIntervalsFromCounts,
  wilsonInterval,
} from '../utils/measurementStats'

describe('measurementStats', () => {
  it('computes entropy for uniform distribution', () => {
    const entropy = calculateEntropy({ '0': 0.5, '1': 0.5 })
    expect(entropy).toBeCloseTo(1, 5)
  })

  it('computes mean and variance', () => {
    const mean = calculateMean({ '0': 0.25, '1': 0.75 })
    const variance = calculateVariance({ '0': 0.25, '1': 0.75 })
    expect(mean).toBeCloseTo(0.75, 5)
    expect(variance).toBeCloseTo(0.1875, 5)
  })

  it('computes chi-squared p-value', () => {
    const result = chiSquaredTest({ '0': 50, '1': 50 }, { '0': 0.5, '1': 0.5 })
    expect(result.statistic).toBeCloseTo(0, 5)
    expect(result.pValue).not.toBeNull()
    if (result.pValue !== null) {
      expect(result.pValue).toBeGreaterThan(0.5)
    }
  })

  it('computes chi-squared for small deviations', () => {
    const result = chiSquaredTest({ '0': 55, '1': 45 }, { '0': 0.5, '1': 0.5 })
    expect(result.statistic).toBeGreaterThan(0)
    expect(result.pValue).not.toBeNull()
  })

  it('computes chi-squared for large deviations', () => {
    const result = chiSquaredTest({ '0': 90, '1': 10 }, { '0': 0.5, '1': 0.5 })
    expect(result.statistic).toBeGreaterThan(10)
    expect(result.pValue).not.toBeNull()
  })

  it('returns defaults when chi-squared has no expected states', () => {
    const result = chiSquaredTest({ '0': 10 }, {})
    expect(result.statistic).toBe(0)
    expect(result.dof).toBe(0)
    expect(result.pValue).toBeNull()
  })

  it('computes qubit correlations', () => {
    const probabilities = { '00': 0.5, '11': 0.5 }
    const { correlations } = calculateQubitCorrelations(probabilities, 2)
    const pair = correlations.find((entry) => entry.pair === 'q0-q1')
    expect(pair).toBeDefined()
    expect(pair?.value).toBeCloseTo(1, 5)
  })

  it('returns empty correlations when no probabilities provided', () => {
    const result = calculateQubitCorrelations({}, 2)
    expect(result.correlations).toHaveLength(0)
    expect(result.numQubits).toBe(0)
  })

  it('computes confidence intervals', () => {
    const interval = wilsonInterval(50, 100)
    expect(interval[0]).toBeLessThan(interval[1])
    const intervals = confidenceIntervalsFromCounts({ '0': 50, '1': 50 }, 100)
    expect(intervals['0']).toBeDefined()
  })
})
