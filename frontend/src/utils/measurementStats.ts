export function calculateEntropy(probabilities: Record<string, number>): number {
  const entries = Object.values(probabilities).filter((p) => p > 0)
  return entries.reduce((sum, p) => sum - p * Math.log2(p), 0)
}

function normalizeStateKey(state: string): string {
  return state.replace(/\s+/g, '').replace(/^0+/, '') || '0'
}

export function calculateMean(probabilities: Record<string, number>): number {
  return Object.entries(probabilities).reduce((sum, [state, p]) => {
    const value = parseInt(normalizeStateKey(state), 2)
    return sum + value * p
  }, 0)
}

export function calculateVariance(probabilities: Record<string, number>): number {
  const mean = calculateMean(probabilities)
  return Object.entries(probabilities).reduce((sum, [state, p]) => {
    const value = parseInt(normalizeStateKey(state), 2)
    const delta = value - mean
    return sum + delta * delta * p
  }, 0)
}

function gammaln(z: number): number {
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.001208650973866179,
    -0.000005395239384953,
  ]
  let x = z
  let y = x
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < cof.length; j += 1) {
    y += 1
    ser += cof[j] / y
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x)
}

function gammaP(a: number, x: number): number {
  const itmax = 100
  const eps = 3e-7
  if (x <= 0) return 0
  let ap = a
  let sum = 1 / a
  let del = sum
  for (let n = 1; n <= itmax; n += 1) {
    ap += 1
    del *= x / ap
    sum += del
    if (Math.abs(del) < Math.abs(sum) * eps) {
      return sum * Math.exp(-x + a * Math.log(x) - gammaln(a))
    }
  }
  return sum * Math.exp(-x + a * Math.log(x) - gammaln(a))
}

function gammaQ(a: number, x: number): number {
  const itmax = 100
  const eps = 3e-7
  const fpmin = 1e-30
  if (x <= 0) return 1
  if (x < a + 1) {
    return 1 - gammaP(a, x)
  }

  let b = x + 1 - a
  let c = 1 / fpmin
  let d = 1 / b
  let h = d
  for (let i = 1; i <= itmax; i += 1) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < fpmin) d = fpmin
    c = b + an / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < eps) break
  }
  return Math.exp(-x + a * Math.log(x) - gammaln(a)) * h
}

export function chiSquaredTest(
  counts: Record<string, number>,
  expectedProbabilities: Record<string, number>,
) {
  const states = Object.keys(expectedProbabilities).filter((state) => expectedProbabilities[state] > 0)
  if (states.length === 0) {
    return { statistic: 0, dof: 0, pValue: null }
  }

  const shots = Object.values(counts).reduce((sum, value) => sum + value, 0)
  let statistic = 0
  states.forEach((state) => {
    const expected = expectedProbabilities[state] * shots
    if (expected <= 0) return
    const observed = counts[state] ?? 0
    const delta = observed - expected
    statistic += (delta * delta) / expected
  })

  const dof = Math.max(states.length - 1, 1)
  const pValue = gammaQ(dof / 2, statistic / 2)
  return { statistic, dof, pValue }
}

export function calculateQubitCorrelations(
  probabilities: Record<string, number>,
  numQubits?: number,
) {
  const keys = Object.keys(probabilities)
  if (keys.length === 0) {
    return { correlations: [], numQubits: 0 }
  }

  const maxBits = numQubits ?? Math.max(...keys.map((key) => key.replace(/\s+/g, '').length))
  const means = Array.from({ length: maxBits }, () => 0)
  const vars = Array.from({ length: maxBits }, () => 0)

  keys.forEach((state) => {
    const prob = probabilities[state]
    const bits = state.replace(/\s+/g, '').padStart(maxBits, '0')
    for (let i = 0; i < maxBits; i += 1) {
      const bit = bits[bits.length - 1 - i] === '1' ? 1 : 0
      means[i] += prob * bit
    }
  })

  keys.forEach((state) => {
    const prob = probabilities[state]
    const bits = state.replace(/\s+/g, '').padStart(maxBits, '0')
    for (let i = 0; i < maxBits; i += 1) {
      const bit = bits[bits.length - 1 - i] === '1' ? 1 : 0
      const delta = bit - means[i]
      vars[i] += prob * delta * delta
    }
  })

  const correlations: { pair: string; value: number; i: number; j: number }[] = []
  for (let i = 0; i < maxBits; i += 1) {
    for (let j = i + 1; j < maxBits; j += 1) {
      let covariance = 0
      keys.forEach((state) => {
        const prob = probabilities[state]
        const bits = state.replace(/\s+/g, '').padStart(maxBits, '0')
        const bitI = bits[bits.length - 1 - i] === '1' ? 1 : 0
        const bitJ = bits[bits.length - 1 - j] === '1' ? 1 : 0
        covariance += prob * (bitI - means[i]) * (bitJ - means[j])
      })
      const denom = Math.sqrt(vars[i] * vars[j])
      const value = denom > 0 ? covariance / denom : 0
      correlations.push({ pair: `q${i}-q${j}`, value, i, j })
    }
  }

  return { correlations, numQubits: maxBits }
}

export function wilsonInterval(count: number, shots: number, z = 1.96): [number, number] {
  if (shots <= 0) return [0, 0]
  const p = count / shots
  const z2 = z * z
  const denom = 1 + z2 / shots
  const center = (p + z2 / (2 * shots)) / denom
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * shots)) / shots)) / denom
  return [Math.max(0, center - margin), Math.min(1, center + margin)]
}

export function confidenceIntervalsFromCounts(
  counts: Record<string, number>,
  shots: number,
  z = 1.96,
): Record<string, [number, number]> {
  const intervals: Record<string, [number, number]> = {}
  Object.entries(counts).forEach(([state, count]) => {
    intervals[state] = wilsonInterval(count, shots, z)
  })
  return intervals
}
