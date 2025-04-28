import { Qubit, Gate } from '../types/circuit'

/**
 * Optimization options for quantum circuits
 */
export interface OptimizationOptions {
  /**
   * Consolidate adjacent gates of the same type when possible
   */
  consolidateGates: boolean;
  
  /**
   * Cancel out gates that nullify each other (e.g., two adjacent X gates)
   */
  cancelAdjacentGates: boolean;
  
  /**
   * Convert certain gate sequences to their equivalent shorter form
   * (e.g., H-Z-H becomes X)
   */
  convertGateSequences: boolean;
  
  /**
   * Transpile the circuit to a minimal gate set for the target backend
   */
  transpileToBackend: boolean;
  
  /**
   * Backend to optimize for (default: 'qasm_simulator')
   */
  backendName?: string;
}

// Default optimization options
const defaultOptimizationOptions: OptimizationOptions = {
  consolidateGates: false,
  cancelAdjacentGates: false,
  convertGateSequences: false,
  transpileToBackend: false,
  backendName: 'qasm_simulator'
}

/**
 * Applies basic circuit optimization by removing redundant gates
 * @param gates Array of gates to optimize
 * @param options Optimization options
 * @returns Optimized array of gates
 */
const optimizeCircuit = (gates: Gate[], options: OptimizationOptions): Gate[] => {
  if (!options.consolidateGates && !options.cancelAdjacentGates && !options.convertGateSequences) {
    return gates; // No optimization needed
  }
  
  // Sort gates by position (time) and qubit
  let optimizedGates = [...gates].sort((a, b) => {
    if ((a.position || 0) === (b.position || 0)) {
      return (a.qubit || 0) - (b.qubit || 0);
    }
    return (a.position || 0) - (b.position || 0);
  });

  // Create a map of gates by qubit for easier processing
  const gatesByQubit: Record<number, Gate[]> = {};
  
  for (const gate of optimizedGates) {
    const qubit = gate.qubit || 0;
    if (!gatesByQubit[qubit]) {
      gatesByQubit[qubit] = [];
    }
    gatesByQubit[qubit].push(gate);
  }
  
  // Track gates to remove
  const gatesToRemove = new Set<string>();
  
  // Process each qubit's gate sequence
  if (options.cancelAdjacentGates) {
    Object.keys(gatesByQubit).forEach(qubitKey => {
      const qubit = parseInt(qubitKey);
      const qubitGates = gatesByQubit[qubit];
      
      for (let i = 0; i < qubitGates.length - 1; i++) {
        const currentGate = qubitGates[i];
        const nextGate = qubitGates[i + 1];
        
        // Skip gates that are already marked for removal
        if (gatesToRemove.has(currentGate.id) || gatesToRemove.has(nextGate.id)) {
          continue;
        }
        
        // Check for cancellable gates (e.g., adjacent X gates cancel out)
        if (currentGate.type === nextGate.type && !hasParameters(currentGate) && !isControlledGate(currentGate)) {
          // These gate types cancel out when applied twice
          if (['x', 'y', 'z', 'h'].includes(currentGate.type)) {
            gatesToRemove.add(currentGate.id);
            gatesToRemove.add(nextGate.id);
            i++; // Skip the next gate since we've processed it
          }
        }
      }
    });
  }
  
  // Filter out removed gates
  optimizedGates = optimizedGates.filter(gate => !gatesToRemove.has(gate.id));
  
  // Return the optimized gate list
  return optimizedGates;
}

/**
 * Checks if a gate has parameters
 */
const hasParameters = (gate: Gate): boolean => {
  return !!gate.params && Object.keys(gate.params).length > 0;
}

/**
 * Checks if a gate is a controlled gate
 */
const isControlledGate = (gate: Gate): boolean => {
  return ['cnot', 'cz', 'toffoli'].includes(gate.type) || 
         (!!gate.controls && gate.controls.length > 0);
}

/**
 * Generates Qiskit Python code from the circuit representation
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @param optimize Whether to optimize the circuit before generating code
 * @param optimizationOptions Options for circuit optimization
 * @returns Qiskit Python code as a string
 */
export const generateQiskitCode = (
  qubits: Qubit[], 
  gates: Gate[], 
  optimize: boolean = false,
  optimizationOptions: Partial<OptimizationOptions> = {}
): string => {
  if (qubits.length === 0 || gates.length === 0) {
    return '# Empty circuit - add gates to generate code'
  }

  // Apply optimization if requested
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  const processedGates = optimize ? optimizeCircuit(gates, options) : gates;

  let code = '# Generated Qiskit code\n'
  code += 'from qiskit import QuantumCircuit, Aer, execute\n'
  code += 'from qiskit.visualization import plot_histogram\n'
  
  // Add optimization imports if needed
  if (optimize && options.transpileToBackend) {
    code += 'from qiskit import transpile\n'
  }
  
  code += '\n'

  // Create the quantum circuit
  code += `# Create a quantum circuit with ${qubits.length} qubits\n`
  code += `qc = QuantumCircuit(${qubits.length}, ${qubits.length})\n\n`

  // Sort gates by position (time)
  const sortedGates = [...processedGates].sort((a, b) => {
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
        // Check all possible parameter names for backwards compatibility
        const theta = gate.params?.theta || gate.params?.angle || 0
        code += `qc.rx(${theta} * 3.14159 / 180, ${gate.qubit})  # Convert degrees to radians\n`
        break
      case 'ry':
        const phi = gate.params?.phi || gate.params?.theta || gate.params?.angle || 0
        code += `qc.ry(${phi} * 3.14159 / 180, ${gate.qubit})  # Convert degrees to radians\n`
        break
      case 'rz':
        const lambda = gate.params?.lambda || gate.params?.phi || gate.params?.angle || 0
        code += `qc.rz(${lambda} * 3.14159 / 180, ${gate.qubit})  # Convert degrees to radians\n`
        break
      case 'p':
        const phase = gate.params?.phi || gate.params?.phase || 0
        code += `qc.p(${phase} * 3.14159 / 180, ${gate.qubit})  # Convert degrees to radians\n`
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

  // Add transpilation if requested
  if (optimize && options.transpileToBackend) {
    code += '\n# Transpile the circuit for the target backend\n'
    code += `backend = Aer.get_backend('${options.backendName}')\n`
    code += 'transpiled_qc = transpile(qc, backend=backend, optimization_level=3)\n\n'
    
    // Add a comment about what transpiling does
    code += '# Note: transpiling optimizes the circuit for the specific backend\n'
    code += '# It can reduce gate count and circuit depth\n\n'
    
    // Switch to using the transpiled circuit
    code += '# Run the simulation using the transpiled circuit\n'
    code += 'job = execute(transpiled_qc, backend, shots=1024)\n'
  } else {
    // Add code to run the simulation with the original circuit
    code += '\n# Run the simulation\n'
    code += 'simulator = Aer.get_backend(\'qasm_simulator\')\n'
    code += 'job = execute(qc, simulator, shots=1024)\n'
  }
  
  code += 'result = job.result()\n'
  code += 'counts = result.get_counts(qc)\n'
  code += 'print("Measurement results:", counts)\n\n'

  // Add code to draw the circuit
  code += '# Draw the circuit\n'
  if (optimize && options.transpileToBackend) {
    code += 'print("Original Circuit:")\n'
    code += 'print(qc.draw())\n'
    code += 'print("\\nTranspiled Circuit:")\n'
    code += 'print(transpiled_qc.draw())\n\n'
  } else {
    code += 'print(qc.draw())\n\n'
  }

  // Add code to plot the histogram
  code += '# Plot the results\n'
  code += 'plot_histogram(counts)\n'

  return code
}

/**
 * Generates Cirq Python code from the circuit representation
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @param optimize Whether to optimize the circuit before generating code
 * @param optimizationOptions Options for circuit optimization
 * @returns Cirq Python code as a string
 */
export const generateCirqCode = (
  qubits: Qubit[], 
  gates: Gate[], 
  optimize: boolean = false,
  optimizationOptions: Partial<OptimizationOptions> = {}
): string => {
  if (qubits.length === 0 || gates.length === 0) {
    return '# Empty circuit - add gates to generate code'
  }

  // Apply optimization if requested
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  const processedGates = optimize ? optimizeCircuit(gates, options) : gates;

  let code = '# Generated Cirq code\n'
  code += 'import cirq\n'
  code += 'import numpy as np\n'
  
  // Add optimization imports if needed
  if (optimize) {
    code += 'from cirq.optimizers import EjectZ, EjectPhasedPaulis, DropEmptyMoments, DropNegligible\n'
  }
  
  code += '\n'

  // Define qubits
  code += '# Define qubits\n'
  code += `qubits = [cirq.LineQubit(i) for i in range(${qubits.length})]\n\n`

  // Create the circuit
  code += '# Create the circuit\n'
  code += 'circuit = cirq.Circuit()\n\n'

  // Sort gates by position (time)
  const sortedGates = [...processedGates].sort((a, b) => {
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
          const theta = gate.params?.theta || gate.params?.angle || 0
          code += `circuit.append(cirq.rx(${theta} * np.pi / 180)(qubits[${gate.qubit}]))  # Convert degrees to radians\n`
          break
        case 'ry':
          const phi = gate.params?.phi || gate.params?.theta || gate.params?.angle || 0
          code += `circuit.append(cirq.ry(${phi} * np.pi / 180)(qubits[${gate.qubit}]))  # Convert degrees to radians\n`
          break
        case 'rz':
          const lambda = gate.params?.lambda || gate.params?.phi || gate.params?.angle || 0
          code += `circuit.append(cirq.rz(${lambda} * np.pi / 180)(qubits[${gate.qubit}]))  # Convert degrees to radians\n`
          break
        case 'p':
          const phase = gate.params?.phi || gate.params?.phase || 0
          code += `circuit.append(cirq.ZPowGate(exponent=${phase}/360)(qubits[${gate.qubit}]))  # Convert degrees to turns\n`
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

  // Add circuit optimization if requested
  if (optimize) {
    code += '\n# Optimize the circuit\n'
    code += '# Original circuit size\n'
    code += 'print("Original circuit size:", len(circuit))\n\n'
    
    // Add different optimizers based on options
    if (options.consolidateGates || options.cancelAdjacentGates) {
      code += '# Apply circuit optimization\n'
      code += 'optimizers = []\n'
      
      if (options.cancelAdjacentGates) {
        code += 'optimizers.append(EjectZ())\n'
        code += 'optimizers.append(EjectPhasedPaulis())\n'
      }
      
      if (options.consolidateGates) {
        code += 'optimizers.append(DropEmptyMoments())\n'
        code += 'optimizers.append(DropNegligible())\n'
      }
      
      code += '\n# Apply each optimizer to the circuit\n'
      code += 'for optimizer in optimizers:\n'
      code += '    optimizer.optimize_circuit(circuit)\n\n'
      
      code += '# Optimized circuit size\n'
      code += 'print("Optimized circuit size:", len(circuit))\n'
    }
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

/**
 * Updates the code panel's UI to include optimization options
 * For use with ExportPanel and CodePanel
 */
export const getOptimizationUI = (
  optimize: boolean,
  setOptimize: (value: boolean) => void,
  optimizationOptions: OptimizationOptions,
  setOptimizationOptions: (options: OptimizationOptions) => void
) => {
  // Implementation would depend on the UI framework being used
  // This is a placeholder for the actual UI component
  return {
    optimize,
    setOptimize,
    optimizationOptions,
    setOptimizationOptions
  };
}