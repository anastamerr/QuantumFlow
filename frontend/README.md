# QuantumFlow Frontend - Hackathon Developer Guide

Welcome to the QuantumFlow frontend! This guide will help you understand the frontend architecture and get started building new features for the Qiskit Fall Fest 2025.

## Table of Contents
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [Common Tasks](#common-tasks)
- [Component Guide](#component-guide)
- [State Management](#state-management)
- [Adding Features](#adding-features)
- [Styling Guide](#styling-guide)
- [Performance Tips](#performance-tips)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production
```bash
npm run build
npm run preview  # Preview the production build
```

### Linting
```bash
npm run lint
```

---

## Architecture Overview

QuantumFlow frontend is built with:
- **React 18** - UI framework
- **TypeScript 5** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Chakra UI** - Component library
- **Redux Toolkit** - State management
- **react-dnd** - Drag and drop
- **Three.js** - 3D Bloch sphere visualization
- **D3.js** - Data visualization

### Design Philosophy
- **Component-based**: Everything is a React component
- **Type-safe**: TypeScript ensures correctness
- **State-driven**: Redux manages all circuit and UI state
- **Responsive**: Works on desktop and tablet (mobile limited)

---

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── canvas/          # Circuit visualization
│   │   │   ├── CircuitCanvas.tsx      # Main grid and circuit display
│   │   │   ├── GridCell.tsx           # Drop zones for gates
│   │   │   └── CircuitGate.tsx        # Gate rendering
│   │   ├── gates/           # Gate palette
│   │   │   └── GateItem.tsx           # Draggable gate items
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.tsx             # Top navigation
│   │   │   ├── Sidebar.tsx            # Left gate palette
│   │   │   └── ResizablePanel.tsx     # Resizable panels
│   │   ├── panels/          # Feature panels
│   │   │   ├── CodePanel.tsx          # Code generation
│   │   │   ├── SimulationPanel.tsx    # Simulation runner
│   │   │   ├── ExportPanel.tsx        # Export options
│   │   │   └── ...                    # More panels
│   │   ├── visualization/   # Quantum visualizations
│   │   │   ├── BlochSphereVisualizer.tsx  # 3D Bloch sphere
│   │   │   ├── QuantumStateVisualizer.tsx # State evolution
│   │   │   └── QubitVisualizer.tsx        # Multi-qubit display
│   │   ├── common/          # Shared components
│   │   └── generator/       # Code generation system
│   │       ├── generators/
│   │       │   ├── qiskitGenerator.ts     # Qiskit Python
│   │       │   ├── cirqGenerator.ts       # Cirq Python
│   │       │   ├── braketGenerator.ts     # AWS Braket
│   │       │   └── jsonGenerator.ts       # JSON export
│   │       └── optimizers/
│   │           └── circuitOptimizer.ts    # Optimization algorithms
│   │
│   ├── store/               # Redux state
│   │   ├── index.ts                # Store configuration
│   │   └── slices/
│   │       ├── circuitSlice.ts     # Circuit state (qubits, gates)
│   │       └── uiSlice.ts          # UI state (panels, selections)
│   │
│   ├── types/               # TypeScript types
│   │   └── circuit.ts              # Core type definitions
│   │
│   ├── utils/               # Utility functions
│   │   ├── gateLibrary.ts          # Quantum gate definitions
│   │   ├── stateEvolution.ts       # Quantum simulator
│   │   ├── blochSphereUtils.ts     # Bloch sphere math
│   │   ├── circuitUtils.ts         # Circuit helpers
│   │   ├── codeGenerator.ts        # Code generation
│   │   └── algorithmLibrary.ts     # Pre-built algorithms
│   │
│   ├── lib/                 # External integrations
│   │   └── quantumApi.ts           # Backend API client
│   │
│   ├── App.tsx              # Main application
│   ├── main.tsx             # Entry point
│   └── index.html           # HTML template
│
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── .env.example             # Environment variables template
```

---

## Key Concepts

### 1. Circuit State (Redux)

The circuit is stored in Redux with this structure:

```typescript
interface CircuitState {
  qubits: Qubit[]        // Array of qubits
  gates: Gate[]          // Array of gates
  maxPosition: number    // Circuit width
  name: string           // Circuit name
  description: string    // Circuit description
}

interface Qubit {
  id: string            // Unique ID
  name: string          // Display name (e.g., "q0")
}

interface Gate {
  id: string            // Unique ID
  type: string          // Gate type (e.g., "h", "cnot")
  qubit: number         // Target qubit index
  position: number      // Time position
  targets?: number[]    // Multi-qubit gate targets
  params?: Record<string, number>  // Gate parameters
}
```

### 2. Drag and Drop

Gates are dragged from the palette (Sidebar) and dropped onto the circuit grid (CircuitCanvas).

- **DragSource**: `GateItem.tsx` - Gates in the palette
- **DropTarget**: `GridCell.tsx` - Cells in the circuit grid
- **Library**: `react-dnd` with HTML5 backend

### 3. Quantum Simulation

The simulator is in `src/utils/stateEvolution.ts`:

```typescript
// State vector: array of complex amplitudes [real, imaginary]
type StateVector = [number, number][]

// Apply gates sequentially
function evolveState(gates: Gate[], numQubits: number): StateVector
```

**Limitations:**
- Practical limit: 8-10 qubits (browser performance)
- Theoretical limit: ~20 qubits (memory constraints)
- Exponential scaling: 2^n amplitudes

### 4. Code Generation

Each generator in `src/components/generator/generators/` converts the Redux circuit state to code:

```typescript
interface CodeGenerator {
  generate(qubits: Qubit[], gates: Gate[]): string
}
```

Generators:
- `qiskitGenerator.ts` - Qiskit Python
- `cirqGenerator.ts` - Cirq Python
- `braketGenerator.ts` - AWS Braket
- `jsonGenerator.ts` - JSON export

---

## Common Tasks

### Adding a New Quantum Gate

**Step 1**: Add gate definition to `src/utils/gateLibrary.ts`

```typescript
{
  id: 'my_gate',
  name: 'My Custom Gate',
  symbol: 'MG',
  description: 'A custom quantum gate',
  category: 'Custom Gates',
  color: 'purple',
  params: [
    {
      name: 'angle',
      type: 'angle',
      default: 0,
      min: 0,
      max: 360,
      step: 1
    }
  ]
}
```

**Step 2**: Implement gate operation in `src/utils/stateEvolution.ts`

```typescript
function applyMyGate(
  state: StateVector,
  qubit: number,
  angle: number
): StateVector {
  // Your quantum gate logic here
  const rad = (angle * Math.PI) / 180
  // ... matrix operations
  return newState
}

// Add to switch statement in evolveState()
case 'my_gate':
  state = applyMyGate(state, gate.qubit, gate.params?.angle || 0)
  break
```

**Step 3**: Add code generation support in generators

```typescript
// In qiskitGenerator.ts
case 'my_gate':
  return `qc.my_gate(${gate.params?.angle || 0}, ${gate.qubit})`
```

**Step 4**: Test your gate!

---

### Adding a New Panel

**Step 1**: Create component in `src/components/panels/`

```typescript
// MyNewPanel.tsx
import { Box, Heading } from '@chakra-ui/react'

export default function MyNewPanel() {
  return (
    <Box p={4}>
      <Heading size="md">My New Panel</Heading>
      {/* Your panel content */}
    </Box>
  )
}
```

**Step 2**: Register panel in `src/App.tsx`

```typescript
// Add to panel rendering logic
{activePanel === 'mynew' && <MyNewPanel />}
```

**Step 3**: Add button in `src/components/layout/Header.tsx`

```typescript
<Button onClick={() => dispatch(setActivePanel('mynew'))}>
  My Panel
</Button>
```

---

### Calling the Backend API

The API client is in `src/lib/quantumApi.ts`:

```typescript
import { executeCircuit } from '@/lib/quantumApi'

// Example: Execute circuit
const result = await executeCircuit({
  num_qubits: 2,
  gates: [
    { type: 'h', qubit: 0, position: 0 },
    { type: 'cx', qubit: 0, targets: [1], position: 1 }
  ],
  shots: 1024,
  memory: false
})

console.log(result.counts)  // { "00": 500, "11": 524 }
```

**API Endpoints:**
- `GET /health` - Health check
- `POST /api/v1/execute` - Execute circuit

---

### Accessing Circuit State

Use Redux hooks:

```typescript
import { useSelector, useDispatch } from 'react-redux'
import { addGate, removeGate } from '@/store/slices/circuitSlice'
import type { RootState } from '@/store'

function MyComponent() {
  const dispatch = useDispatch()
  const gates = useSelector((state: RootState) => state.circuit.gates)
  const qubits = useSelector((state: RootState) => state.circuit.qubits)

  const handleAddGate = () => {
    dispatch(addGate({
      id: crypto.randomUUID(),
      type: 'h',
      qubit: 0,
      position: 0
    }))
  }

  return <div>{gates.length} gates</div>
}
```

---

## Component Guide

### Canvas Components

#### CircuitCanvas.tsx
Main circuit grid. Renders qubits and gates.

**Key Props:** None (uses Redux state)

**Usage:**
```typescript
<CircuitCanvas />
```

#### GridCell.tsx
Individual cell in the circuit grid. Drop target for gates.

**Key Props:**
- `qubitIndex: number` - Which qubit row
- `position: number` - Which time column

#### CircuitGate.tsx
Renders a gate on the circuit.

**Key Props:**
- `gate: Gate` - Gate data
- `onClick: () => void` - Click handler

---

### Panel Components

#### CodePanel.tsx
Shows generated code with syntax highlighting and optimization options.

**Features:**
- Framework selection (Qiskit, Cirq, Braket, JSON)
- Optimization level controls
- Copy to clipboard

#### SimulationPanel.tsx
Runs quantum simulation and shows results.

**Features:**
- Run simulation button
- Measurement probability charts
- State vector display

#### ExportPanel.tsx
Export circuits in various formats.

**Features:**
- JSON export
- SVG circuit diagram export
- PNG image export (future)

---

### Visualization Components

#### BlochSphereVisualizer.tsx
3D Bloch sphere using Three.js.

**Props:**
- `state: [number, number]` - Qubit state as [real, imag] amplitudes

**Usage:**
```typescript
<BlochSphereVisualizer state={[[1, 0], [0, 0]]} />
```

#### QuantumStateVisualizer.tsx
Step-by-step state evolution display.

**Features:**
- Shows state at each gate application
- Probability bar charts
- Complex amplitude display

---

## State Management

### Circuit Slice

Located in `src/store/slices/circuitSlice.ts`

**Actions:**
```typescript
// Qubit management
dispatch(addQubit())
dispatch(removeQubit(qubitId))

// Gate management
dispatch(addGate({ id, type, qubit, position }))
dispatch(removeGate(gateId))
dispatch(updateGate({ id, params }))

// Circuit management
dispatch(clearCircuit())
dispatch(importCircuit(circuitData))
```

### UI Slice

Located in `src/store/slices/uiSlice.ts`

**Actions:**
```typescript
// Panel management
dispatch(setActivePanel('code'))  // 'code', 'simulation', 'export', etc.
dispatch(setFullView(true))

// Selection management
dispatch(setSelectedGate(gateId))
```

---

## Adding Features

### Example: Add a "Circuit Statistics" Feature

**Goal:** Show circuit depth, gate count, and entanglement metrics.

**Step 1**: Create utility function

```typescript
// src/utils/circuitStats.ts
export function calculateStats(gates: Gate[]) {
  return {
    gateCount: gates.length,
    depth: Math.max(...gates.map(g => g.position)) + 1,
    twoQubitGates: gates.filter(g => g.targets).length,
    // Add more stats...
  }
}
```

**Step 2**: Create component

```typescript
// src/components/panels/StatsPanel.tsx
import { useSelector } from 'react-redux'
import { calculateStats } from '@/utils/circuitStats'

export default function StatsPanel() {
  const gates = useSelector((state: RootState) => state.circuit.gates)
  const stats = calculateStats(gates)

  return (
    <Box>
      <Stat label="Gate Count" value={stats.gateCount} />
      <Stat label="Circuit Depth" value={stats.depth} />
    </Box>
  )
}
```

**Step 3**: Add to UI

Register in `App.tsx` and add button in `Header.tsx`.

---

## Styling Guide

QuantumFlow uses **Chakra UI** for styling.

### Using Chakra Components

```typescript
import { Box, Button, Heading, Text } from '@chakra-ui/react'

function MyComponent() {
  return (
    <Box p={4} bg="gray.100" borderRadius="md">
      <Heading size="md" mb={2}>Title</Heading>
      <Text>Description</Text>
      <Button colorScheme="blue" onClick={...}>
        Click Me
      </Button>
    </Box>
  )
}
```

### Theme Colors

QuantumFlow uses these color schemes:
- **Primary**: `blue` (for main actions)
- **Success**: `green` (for positive actions)
- **Warning**: `yellow` (for cautions)
- **Error**: `red` (for errors)
- **Purple**: For quantum-specific elements

### Responsive Design

Use Chakra's responsive props:

```typescript
<Box
  width={{ base: '100%', md: '50%' }}  // 100% on mobile, 50% on desktop
  display={{ base: 'block', md: 'flex' }}
>
```

---

## Performance Tips

### 1. Optimize Re-renders

Use `React.memo` for expensive components:

```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  // Complex rendering logic
})
```

### 2. Lazy Load Heavy Components

```typescript
const BlochSphere = React.lazy(() => import('./BlochSphereVisualizer'))

// Use with Suspense
<Suspense fallback={<Spinner />}>
  <BlochSphere state={state} />
</Suspense>
```

### 3. Limit Simulation Size

For >8 qubits, warn users about performance:

```typescript
if (numQubits > 8) {
  toast.warning('Large circuits may be slow in browser')
}
```

### 4. Debounce State Updates

For real-time parameter changes:

```typescript
import { debounce } from 'lodash'

const updateParam = debounce((value) => {
  dispatch(updateGate({ id, params: { angle: value } }))
}, 100)
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Module not found` | Run `npm install` |
| `Port already in use` | Kill process on port 5173 or use different port |
| CORS errors | Ensure backend is running and `ALLOWED_ORIGINS` is set |
| Redux state not updating | Check if action is dispatched correctly |
| Chakra styles not working | Import `ChakraProvider` in `App.tsx` |
| Three.js errors | Check WebGL support in browser |

### Debugging

**React DevTools:**
- Install React DevTools browser extension
- Inspect component props and state

**Redux DevTools:**
- Install Redux DevTools extension
- View action history and state changes

**Browser Console:**
- Check for TypeScript errors
- Look for API call failures

**Vite Dev Server:**
- Terminal shows build errors
- Hot module replacement issues

---

## Environment Variables

Create `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
# Optional: Basic Auth for backend (username:password or base64 token)
# VITE_API_BASIC_AUTH=quantum:flow
```

Access in code:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

---

## Testing

Run unit/component tests:

```bash
cd frontend
npm run test
```

**Stack:**
- **Unit + component tests**: Vitest + React Testing Library
- **E2E (optional)**: Playwright (not configured)

---

## Resources

### Documentation
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chakra UI](https://chakra-ui.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Vite](https://vitejs.dev/)

### Tutorials
- [React + TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Redux Toolkit Quick Start](https://redux-toolkit.js.org/tutorials/quick-start)

---

## Contributing

1. Keep code clean and well-commented
2. Use TypeScript types everywhere
3. Follow existing component patterns
4. Test your changes thoroughly
5. Update documentation for new features

---

## Need Help?

- Check existing components for examples
- Ask hackathon mentors
- Review the main README: `../README.md`
- Check backend README: `../backend/README.md`

---

**Happy coding!** Build something amazing for the quantum computing community.
