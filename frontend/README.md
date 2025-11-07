# QuantumFlow

A modern, interactive quantum circuit design and simulation platform built with React, TypeScript, and Chakra UI. QuantumFlow provides an intuitive drag-and-drop interface for building quantum circuits with real-time visualization and simulation capabilities.




![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![Chakra UI](https://img.shields.io/badge/Chakra%20UI-2.x-319795)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)

## 🌟 Features

### Circuit Design
- **Drag & Drop Interface**: Visual gate placement with react-dnd
- **Comprehensive Gate Library**: 15+ quantum gates including single-qubit, multi-qubit, and parameterized gates
- **Real-time SVG Visualization**: Professional circuit diagrams with time markers and gate symbols
- **Interactive Gate Parameters**: Sliders and inputs for rotation angles and gate parameters
- **Multi-qubit Operations**: CNOT, CZ, SWAP, and Toffoli gates with automatic target/control assignment

### Quantum Simulation
- **State Vector Simulator**: Custom JavaScript quantum state evolution engine
- **Step-by-step Evolution**: Watch quantum states change as gates are applied
- **Measurement Probabilities**: Real-time probability distribution visualization
- **Bloch Sphere Visualization**: Interactive 3D Bloch sphere using Three.js
- **Circuit Analysis**: Automatic detection of superposition and entanglement

### Code Generation
- **Qiskit Python**: Complete Qiskit code with circuit construction and execution
- **Cirq Python**: Google Cirq code generation with moment-based circuit building
- **JSON Export**: Circuit data in structured JSON format
- **SVG Export**: High-quality circuit diagrams

### Advanced Features
- **Circuit Optimization**: Gate cancellation, consolidation, and sequence conversion
- **Hardware Mapping**: Support for IBM Falcon, Google Sycamore, and linear topologies
- **Noise-aware Optimization**: Circuit optimization for specific quantum hardware
- **Resizable Panels**: Customizable UI layout with drag-to-resize panels
- **Dark/Light Mode**: Full theme support

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- npm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quantumflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## 🎯 Usage Guide

### Building Your First Circuit

1. **Add Qubits**: Click "Add Qubit" in the sidebar (starts with 2 qubits)
2. **Search Gates**: Use the search bar to find specific gates
3. **Drag Gates**: Drag gates from the palette to the circuit grid
4. **Configure Parameters**: Click on parameterized gates to adjust angles
5. **Run Simulation**: Switch to the Simulation panel and click "Run Simulation"

### Available Quantum Gates

| Gate | Symbol | Type | Parameters | Description |
|------|--------|------|------------|-------------|
| Hadamard | H | Single-qubit | None | Creates superposition |
| Pauli-X | X | Single-qubit | None | Bit flip gate |
| Pauli-Y | Y | Single-qubit | None | Y rotation |
| Pauli-Z | Z | Single-qubit | None | Phase flip |
| S Gate | S | Single-qubit | None | 90° Z rotation |
| T Gate | T | Single-qubit | None | 45° Z rotation |
| RX | RX | Rotation | theta (0-360°) | X-axis rotation |
| RY | RY | Rotation | theta (0-360°) | Y-axis rotation |
| RZ | RZ | Rotation | phi (0-360°) | Z-axis rotation |
| Phase | P | Rotation | phi (0-360°) | Phase gate |
| CNOT | CX | Multi-qubit | None | Controlled NOT |
| CZ | CZ | Multi-qubit | None | Controlled Z |
| SWAP | SWAP | Multi-qubit | None | Qubit swap |
| Toffoli | CCX | Multi-qubit | None | Controlled-controlled NOT |
| Measure | M | Measurement | None | Computational basis measurement |

### Example: Bell State Circuit

1. Start with 2 qubits (default)
2. Drag Hadamard (H) to qubit 0, position 0
3. Drag CNOT to qubit 0, position 1 (automatically targets qubit 1)
4. Run simulation to see entangled |00⟩ + |11⟩ state

## 🛠️ Project Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── CircuitCanvas.tsx      # Main circuit grid and visualization
│   │   ├── GridCell.tsx           # Individual grid cells with drop zones
│   │   └── CircuitGate.tsx        # Gate visualization components
│   ├── gates/
│   │   └── GateItem.tsx           # Draggable gate palette items
│   ├── layout/
│   │   ├── Header.tsx             # Top navigation and panel switching
│   │   ├── Sidebar.tsx            # Gate palette and circuit controls
│   │   └── ResizablePanel.tsx     # Custom resizable panel component
│   ├── panels/
│   │   ├── CodePanel.tsx          # Code generation and optimization
│   │   ├── SimulationPanel.tsx    # Quantum simulation interface
│   │   ├── ExportPanel.tsx        # Export options and file generation
│   │   ├── GateParamsPanel.tsx    # Gate parameter configuration
│   │   └── AdvancedOptimizationPanel.tsx # Advanced optimization settings
│   └── visualization/
│       ├── BlochSphereVisualizer.tsx    # 3D Bloch sphere with Three.js
│       ├── QuantumStateVisualizer.tsx   # Step-by-step state evolution
│       └── QubitVisualizer.tsx          # Multi-qubit state visualization
├── store/
│   ├── index.ts                   # Redux store configuration
│   └── slices/
│       ├── circuitSlice.ts        # Circuit state (qubits, gates)
│       └── uiSlice.ts             # UI state (panels, selections)
├── types/
│   └── circuit.ts                 # TypeScript type definitions
├── utils/
│   ├── blochSphereUtils.ts        # Bloch sphere coordinate calculations
│   ├── circuitOptimizer.ts        # Advanced optimization algorithms
│   ├── circuitRenderer.ts         # SVG circuit diagram generation
│   ├── circuitUtils.ts            # Circuit manipulation utilities
│   ├── codeGenerator.ts           # Multi-framework code generation
│   ├── gateLibrary.ts             # Quantum gate definitions
│   └── stateEvolution.ts          # Quantum simulation engine
└── App.tsx                        # Main application with DnD provider
```

## 🧮 Quantum Simulation Engine

### Implementation Details

The quantum simulator is implemented in `stateEvolution.ts` and includes:

- **State Representation**: Complex amplitudes stored as `[real, imaginary]` tuples
- **Gate Operations**: Matrix-free gate application for efficiency
- **Supported Operations**:
  - All single-qubit Pauli gates (X, Y, Z)
  - Hadamard gate with proper superposition
  - Rotation gates (RX, RY, RZ) with degree-to-radian conversion
  - Phase gates (S, T, P) with complex phase tracking
  - Two-qubit gates (CNOT, CZ, SWAP)
  - Three-qubit Toffoli gate

### Accuracy and Limitations

- **Precision**: Double-precision floating-point arithmetic
- **Qubit Limit**: Theoretical limit of ~20 qubits (2^20 states = 1M amplitudes)
- **Practical Limit**: 8-10 qubits for smooth browser performance
- **Memory Usage**: Exponential scaling (2^n complex numbers)

## 🎨 Code Generation

### Qiskit Output Example
```python
# Generated Qiskit code
from qiskit import QuantumCircuit, Aer, execute
import numpy as np

# Create a quantum circuit with 2 qubits
qc = QuantumCircuit(2, 2)

# Add gates to the circuit
qc.h(0)
qc.cx(0, 1)

# Measure all qubits
qc.measure(0, 0)
qc.measure(1, 1)

# Run the simulation
simulator = Aer.get_backend('qasm_simulator')
job = execute(qc, simulator, shots=1024)
result = job.result()
counts = result.get_counts(qc)
print("Measurement results:", counts)
```

### Optimization Features

The code generator includes several optimization options:

1. **Basic Optimizations**:
   - Gate consolidation (combine adjacent rotation gates)
   - Gate cancellation (remove X-X, H-H pairs)
   - Sequence conversion (H-Z-H → X)

2. **Advanced Optimizations** (in `circuitOptimizer.ts`):
   - Circuit synthesis with 4 optimization levels
   - Hardware-aware qubit mapping
   - Noise-aware optimization for specific topologies
   - Circuit depth reduction with parallelization

3. **Hardware Models**:
   - Linear topology (nearest-neighbor)
   - Grid topology (2D lattice)
   - IBM Falcon processor layout
   - Google Sycamore architecture
   - Fully connected (ideal)

## 🔧 Development

### Key Dependencies

```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.2",
  "@chakra-ui/react": "^2.8.0",
  "@reduxjs/toolkit": "^1.9.0",
  "react-dnd": "^16.0.1",
  "three": "^0.128.0",
  "framer-motion": "^6.0.0"
}
```

### Available Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript compilation check
```

### State Management

The application uses Redux Toolkit with two main slices:

- **circuitSlice**: Manages qubits, gates, and circuit data
- **uiSlice**: Handles UI state, panel visibility, and selections

### Adding Custom Gates

To add a new gate, update `gateLibrary.ts`:

```typescript
{
  id: 'custom_gate',
  name: 'Custom Gate',
  symbol: 'CG',
  description: 'Your custom quantum gate',
  category: 'Custom Gates',
  color: 'purple',
  params: [{
    name: 'angle',
    type: 'angle',
    default: 0,
    min: 0,
    max: 360,
    step: 1
  }]
}
```

Then implement the gate operation in `stateEvolution.ts`.

## 🎯 Browser Compatibility

- **Chrome/Edge**: Full support including WebGL for 3D visualization
- **Firefox**: Full support with Three.js
- **Safari**: Supported (may have WebGL limitations)
- **Mobile**: Basic functionality (drag-and-drop limited)

## ⚡ Performance Tips

1. **Large Circuits**: Disable real-time visualization for >6 qubits
2. **Memory**: Clear circuits when switching between large designs
3. **Simulation**: Use "Jump to End" for faster results on complex circuits
4. **Browser**: Use Chrome/Edge for best Three.js performance

## 🐛 Known Issues

- **Multi-touch**: Limited support on mobile devices
- **Large Circuits**: Browser may freeze with >10 qubits
- **Three.js**: Occasional WebGL context loss on some systems
- **Safari**: May not support all advanced optimization features

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Quantum circuit visualization inspired by Qiskit and Cirq
- Three.js community for Bloch sphere rendering techniques
- Chakra UI team for excellent React components
- Redux Toolkit for state management patterns

---

**Start building quantum circuits today!** 🚀⚛️