import { test, expect } from '@playwright/test'

const mockResponse = {
  backend: 'mock',
  method: 'statevector',
  shots: 1024,
  counts: { '0': 512, '1': 512 },
  probabilities: { '0': 0.5, '1': 0.5 },
  measurement_basis: { '0': 'z' },
  per_qubit_probabilities: { '0': { '0': 0.5, '1': 0.5 } },
  cosmic_metrics: {
    approach: 'occurrences',
    entries: 1,
    exits: 1,
    reads: 0,
    writes: 0,
    total_cfp: 2,
    functional_processes: [
      { name: 'h-0', gate_type: 'h', entries: 1, exits: 1, reads: 0, writes: 0, cfp: 2 },
    ],
  },
  hardware_metrics: {
    circuit_depth: 1,
    circuit_width: 1,
    gate_count: { h: 1 },
    t_count: 0,
    t_depth: 0,
    cnot_count: 0,
    single_qubit_gates: 1,
    two_qubit_gates: 0,
    multi_qubit_gates: 0,
    measurement_count: 1,
    entanglement_ratio: 0,
    entanglement_depth: 0,
    quantum_volume: 2,
    estimated_fidelity: null,
  },
  confidence_intervals: { '0': [0.45, 0.55], '1': [0.45, 0.55] },
  warnings: [],
  memory: null,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/health', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ status: 'ok' }) })
  })
  await page.route('**/api/v1/execute', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse),
    })
  })
})

test('simulation renders measurement visuals', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('QuantumFlow')).toBeVisible()

  await page.getByRole('button', { name: 'Simulation' }).click()
  await expect(page.getByRole('heading', { name: 'Quantum Simulation' })).toBeVisible()

  await page.evaluate(() => {
    ;(window as any).ENV = { API_BASE_URL: 'http://localhost:3000' }
  })

  await page.waitForFunction(() => !!(window as any).__quantumflow_store__)
  await page.evaluate(() => {
    const store = (window as any).__quantumflow_store__
    if (store) {
      store.dispatch({
        type: 'circuit/addGate',
        payload: { type: 'h', qubit: 0, position: 0 },
      })
    }
  })
  await page.waitForFunction(() => {
    const store = (window as any).__quantumflow_store__
    return store?.getState?.().circuit?.gates?.length > 0
  })

  const simulationCard = page.getByRole('heading', { name: 'Quantum Simulation' }).locator('..').locator('..')
  const runButton = simulationCard.getByRole('button', { name: 'Run Simulation' })
  await expect(runButton).toBeEnabled()
  await Promise.all([
    page.waitForResponse('**/api/v1/execute'),
    runButton.click(),
  ])
  await expect(page.getByText('Measurement Results')).toBeVisible()
  await expect(page.getByText('Probability Histogram')).toBeVisible()
})
