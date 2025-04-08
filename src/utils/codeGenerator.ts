import { Qubit, Gate } from '../types/circuit'

/**
 * Generates Qiskit Python code from the circuit representation
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @returns Qiskit Python code as a string
 */
export const generateQiskitCode = (qubits: Qubit[], gates: any[]): string => {
  if (qubits.length === 0 || gates.length === 0) {
    return '# Empty circuit - add gates to generate code'
  }

  let code = '# Generated Qiskit code\n'
  code += 'from qiskit import QuantumCircuit, Aer, execute\n'
  code += 'from qiskit.visualization import plot_histogram\n\n'

  // Create the quantum circuit
  code += `# Create a quantum circuit with ${qubits.length} qubits\n`
  code += `qc = QuantumCircuit(${qubits.length}, ${qubits.length})\n\n`

  // Sort gates by position (time)
  const sortedGates = [...gates].sort((a, b) => {
    return (a.position || 0) - (b.position || 0)
  })

  // Add gates to the circuit
  code += '# Add gates to the circuit\n'
  sortedGates.forEach(gate => {
    switch (gate.type) {
      case 'h':
        code += `qc.h(${gate.qubit})\n`
        break
      case 'x':
        code += `qc.x(${gate.qubit})\n`
        break
      case 'y':
        code += `qc.y(${gate.qubit})\n`
        break
      case 'z':
        code += `qc.z(${gate.qubit})\n`
        break
      case 's':
        code += `qc.s(${gate.qubit})\n`
        break
      case 't':
        code += `qc.t(${gate.qubit})\n`
        break
      case 'rx':
        const theta = gate.params?.theta || 0
        code += `qc.rx(${theta}, ${gate.qubit})\n`
        break
      case 'ry':
        const phi = gate.params?.phi || 0
        code += `qc.ry(${phi}, ${gate.qubit})\n`
        break
      case 'rz':
        const lambda = gate.params?.lambda || 0
        code += `qc.rz(${lambda}, ${gate.qubit})\n`
        break
      case 'p':
        const phase = gate.params?.phi || 0
        code += `qc.p(${phase}, ${gate.qubit})\n`
        break
      case 'cnot':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          code += `qc.cx(${gate.controls[0]}, ${gate.targets[0]})\n`
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          code += `qc.cx(${gate.qubit}, ${gate.targets[0]})\n`
        }
        break
      case 'cz':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          code += `qc.cz(${gate.controls[0]}, ${gate.targets[0]})\n`
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          code += `qc.cz(${gate.qubit}, ${gate.targets[0]})\n`
        }
        break
      case 'swap':
        if (gate.targets && gate.targets.length > 1) {
          code += `qc.swap(${gate.targets[0]}, ${gate.targets[1]})\n`
        }
        break
      case 'toffoli':
        if (gate.controls && gate.controls.length > 1 && gate.targets && gate.targets.length > 0) {
          code += `qc.ccx(${gate.controls[0]}, ${gate.controls[1]}, ${gate.targets[0]})\n`
        }
        break
      case 'measure':
        code += `qc.measure(${gate.qubit}, ${gate.qubit})\n`
        break
      default:
        // Handle custom or unknown gates
        code += `# Unsupported gate: ${gate.type}\n`
    }
  })

  // Add measurement for all qubits if no measurement gates were added
  if (!sortedGates.some(gate => gate.type === 'measure')) {
    code += '\n# Measure all qubits\n'
    qubits.forEach(qubit => {
      code += `qc.measure(${qubit.id}, ${qubit.id})\n`
    })
  }

  // Add code to run the simulation
  code += '\n# Run the simulation\n'
  code += 'simulator = Aer.get_backend(\'qasm_simulator\')\n'
  code += 'job = execute(qc, simulator, shots=1024)\n'
  code += 'result = job.result()\n'
  code += 'counts = result.get_counts(qc)\n'
  code += 'print("Measurement results:", counts)\n\n'

  // Add code to draw the circuit
  code += '# Draw the circuit\n'
  code += 'print(qc.draw())\n\n'

  // Add code to plot the histogram
  code += '# Plot the results\n'
  code += 'plot_histogram(counts)\n'

  return code
}

/**
 * Generates Cirq Python code from the circuit representation
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @returns Cirq Python code as a string
 */
export const generateCirqCode = (qubits: Qubit[], gates: any[]): string => {
  if (qubits.length === 0 || gates.length === 0) {
    return '# Empty circuit - add gates to generate code'
  }

  let code = '# Generated Cirq code\n'
  code += 'import cirq\n'
  code += 'import numpy as np\n\n'

  // Define qubits
  code += '# Define qubits\n'
  code += `qubits = [cirq.LineQubit(i) for i in range(${qubits.length})]\n\n`

  // Create the circuit
  code += '# Create the circuit\n'
  code += 'circuit = cirq.Circuit()\n\n'

  // Sort gates by position (time)
  const sortedGates = [...gates].sort((a, b) => {
    return (a.position || 0) - (b.position || 0)
  })

  // Group gates by position for moment-based addition
  const gatesByPosition: Record<number, Gate[]> = {}
  sortedGates.forEach(gate => {
    const pos = gate.position || 0
    if (!gatesByPosition[pos]) {
      gatesByPosition[pos] = []
    }
    gatesByPosition[pos].push(gate)
  })

  // Add gates to the circuit by position
  code += '# Add gates to the circuit\n'
  Object.entries(gatesByPosition).forEach(([position, posGates]) => {
    code += `# Position ${position}\n`
    posGates.forEach(gate => {
      switch (gate.type) {
        case 'h':
          code += `circuit.append(cirq.H(qubits[${gate.qubit}]))\n`
          break
        case 'x':
          code += `circuit.append(cirq.X(qubits[${gate.qubit}]))\n`
          break
        case 'y':
          code += `circuit.append(cirq.Y(qubits[${gate.qubit}]))\n`
          break
        case 'z':
          code += `circuit.append(cirq.Z(qubits[${gate.qubit}]))\n`
          break
        case 's':
          code += `circuit.append(cirq.S(qubits[${gate.qubit}]))\n`
          break
        case 't':
          code += `circuit.append(cirq.T(qubits[${gate.qubit}]))\n`
          break
        case 'rx':
          const theta = gate.params?.theta || 0
          code += `circuit.append(cirq.rx(${theta} * np.pi / 180)(qubits[${gate.qubit}]))\n`
          break
        case 'ry':
          const phi = gate.params?.phi || 0
          code += `circuit.append(cirq.ry(${phi} * np.pi / 180)(qubits[${gate.qubit}]))\n`
          break
        case 'rz':
          const lambda = gate.params?.lambda || 0
          code += `circuit.append(cirq.rz(${lambda} * np.pi / 180)(qubits[${gate.qubit}]))\n`
          break
        case 'p':
          const phase = gate.params?.phi || 0
          code += `circuit.append(cirq.ZPowGate(exponent=${phase}/360)(qubits[${gate.qubit}]))\n`
          break
        case 'cnot':
          if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
            code += `circuit.append(cirq.CNOT(qubits[${gate.controls[0]}], qubits[${gate.targets[0]}]))\n`
          } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
            code += `circuit.append(cirq.CNOT(qubits[${gate.qubit}], qubits[${gate.targets[0]}]))\n`
          }
          break
        case 'cz':
          if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
            code += `circuit.append(cirq.CZ(qubits[${gate.controls[0]}], qubits[${gate.targets[0]}]))\n`
          } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
            code += `circuit.append(cirq.CZ(qubits[${gate.qubit}], qubits[${gate.targets[0]}]))\n`
          }
          break
        case 'swap':
          if (gate.targets && gate.targets.length > 1) {
            code += `circuit.append(cirq.SWAP(qubits[${gate.targets[0]}], qubits[${gate.targets[1]}]))\n`
          }
          break
        case 'toffoli':
          if (gate.controls && gate.controls.length > 1 && gate.targets && gate.targets.length > 0) {
            code += `circuit.append(cirq.TOFFOLI(qubits[${gate.controls[0]}], qubits[${gate.controls[1]}], qubits[${gate.targets[0]}]))\n`
          }
          break
        case 'measure':
          code += `circuit.append(cirq.measure(qubits[${gate.qubit}], key='q${gate.qubit}'))\n`
          break
        default:
          // Handle custom or unknown gates
          code += `# Unsupported gate: ${gate.type}\n`
      }
    })
  })

  // Add measurement for all qubits if no measurement gates were added
  if (!sortedGates.some(gate => gate.type === 'measure')) {
    code += '\n# Measure all qubits\n'
    qubits.forEach(qubit => {
      code += `circuit.append(cirq.measure(qubits[${qubit.id}], key='q${qubit.id}'))\n`
    })
  }

  // Add code to run the simulation
  code += '\n# Run the simulation\n'
  code += 'simulator = cirq.Simulator()\n'
  code += 'result = simulator.run(circuit, repetitions=1024)\n'
  code += 'print("Measurement results:")\n'
  code += 'print(result)\n\n'

  // Add code to print the circuit
  code += '# Print the circuit\n'
  code += 'print("Circuit:")\n'
  code += 'print(circuit)\n'

  return code
}