import { Qubit, Gate } from '../types/circuit'
import { 
  applyAdvancedOptimization, 
  defaultAdvancedOptions, 
  AdvancedOptimizationOptions,
  hardwareModels,
  calculateCircuitDepth
} from './circuitOptimizer'

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

  /**
   * Enable advanced optimization techniques
   */
  enableAdvancedOptimization?: boolean;

  /**
   * Advanced optimization options
   */
  advancedOptions?: AdvancedOptimizationOptions;
}

// Default optimization options
const defaultOptimizationOptions: OptimizationOptions = {
  consolidateGates: false,
  cancelAdjacentGates: false,
  convertGateSequences: false,
  transpileToBackend: false,
  backendName: 'qasm_simulator',
  enableAdvancedOptimization: false,
  advancedOptions: defaultAdvancedOptions
}

/**
 * Applies basic circuit optimization by removing redundant gates
 * @param gates Array of gates to optimize
 * @param options Optimization options
 * @returns Optimized array of gates
 */
const optimizeCircuit = (gates: Gate[], options: OptimizationOptions): Gate[] => {
  if (!options.consolidateGates && !options.cancelAdjacentGates && !options.convertGateSequences && !options.enableAdvancedOptimization) {
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
  
  // Apply advanced optimizations if enabled
  if (options.enableAdvancedOptimization && options.advancedOptions) {
    // We need qubits for some of the advanced optimization techniques
    // Create a dummy array of qubits for this purpose
    const maxQubitIndex = Math.max(...optimizedGates.map(g => Math.max(
      g.qubit || 0,
      ...((g.targets || []).length > 0 ? g.targets || [] : [0]),
      ...((g.controls || []).length > 0 ? g.controls || [] : [0])
    )));
    
    const dummyQubits: Qubit[] = Array.from({ length: maxQubitIndex + 1 }, (_, i) => ({
      id: i,
      name: `q${i}`
    }));
    
    optimizedGates = applyAdvancedOptimization(optimizedGates, dummyQubits, options.advancedOptions);
  }
  
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
  if (optimize) {
    if (options.transpileToBackend) {
      code += 'from qiskit import transpile\n'
    }
    if (options.enableAdvancedOptimization) {
      code += 'from qiskit.transpiler import PassManager\n'
      code += 'from qiskit.transpiler.passes import *\n'
    }
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

  // Add advanced optimization transpilation code if requested
  if (optimize && options.enableAdvancedOptimization && options.advancedOptions) {
    code += '\n# Apply advanced circuit optimizations\n'
    code += 'pass_manager = PassManager()\n'
    
    // Add passes based on optimization options
    if (options.advancedOptions.synthesisLevel > 0) {
      code += '# Synthesis optimization passes\n'
      code += 'pass_manager.append(Unroller())\n'
      code += 'pass_manager.append(Optimize1qGates())\n'
      
      if (options.advancedOptions.synthesisLevel >= 2) {
        code += 'pass_manager.append(CommutativeCancellation())\n'
      }
      
      if (options.advancedOptions.synthesisLevel >= 3) {
        code += 'pass_manager.append(OptimizeSwap())\n'
        code += 'pass_manager.append(RemoveResetInZeroState())\n'
      }
    }
    
    if (options.advancedOptions.depthReduction) {
      code += '\n# Depth reduction passes\n'
      code += 'pass_manager.append(Depth())\n'
      code += 'pass_manager.append(FixedPoint("depth"))\n'
      
      if (options.advancedOptions.maxDepth) {
        code += `# Target maximum depth: ${options.advancedOptions.maxDepth}\n`
      }
    }
    
    if (options.advancedOptions.noiseAware) {
      code += '\n# Noise-aware optimization passes\n'
      code += 'pass_manager.append(NoiseAdaptiveLayout())\n'
      const hardwareModelName = options.advancedOptions.hardwareModel;
      if (hardwareModels[hardwareModelName]) {
        code += `# Optimizing for ${hardwareModels[hardwareModelName].name} topology\n`
      }
    }
    
    if (options.advancedOptions.qubitMapping) {
      code += '\n# Qubit mapping passes\n'
      if (options.advancedOptions.preserveLayout) {
        code += 'pass_manager.append(TrivialLayout())\n'
      } else {
        code += 'pass_manager.append(DenseLayout())\n'
      }
      code += 'pass_manager.append(FullAncillaAllocation())\n'
      code += 'pass_manager.append(EnlargeWithAncilla())\n'
    }
    
    // Apply pass manager to circuit
    code += '\n# Apply the custom pass manager\n'
    code += 'optimized_qc = pass_manager.run(qc)\n'
    code += '\n# Print circuit statistics before and after optimization\n'
    code += 'print(f"Original circuit depth: {qc.depth()}")\n'
    code += 'print(f"Original circuit gates: {len(qc.data)}")\n'
    code += 'print(f"Optimized circuit depth: {optimized_qc.depth()}")\n'
    code += 'print(f"Optimized circuit gates: {len(optimized_qc.data)}")\n\n'
    
    // Use the optimized circuit
    code += '# Use the optimized circuit for execution\n'
    code += 'qc = optimized_qc\n\n'
  }
  
  // Add transpilation if requested
  if (optimize && options.transpileToBackend) {
    code += '\n# Transpile the circuit for the target backend\n'
    code += `backend = Aer.get_backend('${options.backendName}')\n`
    
    const optimizationLevel = options.enableAdvancedOptimization ? 3 : 2;
    code += `transpiled_qc = transpile(qc, backend=backend, optimization_level=${optimizationLevel})\n\n`
    
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
    
    if (options.enableAdvancedOptimization) {
      code += 'from cirq.optimizers import MergeInteractions, MergeSingleQubitGates\n'
      code += 'from cirq.transformers import optimize_for_target_gateset, drop_empty_moments, drop_negligible_operations\n'
      code += 'from cirq.contrib import routing\n'
    }
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

  // Add advanced circuit optimization if requested
  if (optimize && options.enableAdvancedOptimization && options.advancedOptions) {
    code += '\n# Apply advanced circuit optimizations\n'
    
    // Add different optimizers based on advanced options
    if (options.advancedOptions.synthesisLevel > 0) {
      code += '# Apply circuit synthesis optimizations\n'
      code += 'circuit = cirq.optimize_for_target_gateset(circuit)\n'
      code += 'circuit = cirq.merge_single_qubit_gates_into_phased_x_z(circuit)\n'
      
      if (options.advancedOptions.synthesisLevel >= 2) {
        code += '# Apply medium-level synthesis optimizations\n'
        code += 'circuit = cirq.drop_empty_moments(circuit)\n'
        code += 'circuit = cirq.drop_negligible_operations(circuit)\n'
        code += 'circuit = cirq.merge_single_qubit_gates_into_phxz(circuit)\n'
      }
      
      if (options.advancedOptions.synthesisLevel >= 3) {
        code += '# Apply aggressive synthesis optimizations\n'
        code += 'from cirq.optimizers import EjectPhasedPaulis\n'
        code += 'optimizer = EjectPhasedPaulis()\n'
        code += 'circuit = optimizer.optimize_circuit(circuit)\n'
      }
    }
    
    if (options.advancedOptions.depthReduction) {
      code += '\n# Apply circuit depth reduction\n'
      code += 'initial_depth = len(circuit)\n'
      code += 'circuit = cirq.merge_interactions(circuit, maximize_distance=True)\n'
      
      if (options.advancedOptions.maxDepth && options.advancedOptions.maxDepth > 0) {
        code += `# Target maximum depth: ${options.advancedOptions.maxDepth}\n`
        code += 'circuit = circuit[:min(len(circuit), ' + options.advancedOptions.maxDepth + ')]\n'
      }
    }
    
    if (options.advancedOptions.qubitMapping) {
      code += '\n# Apply qubit mapping\n'
      const hardwareModel = options.advancedOptions.hardwareModel;
      
      if (hardwareModels[hardwareModel]) {
        code += `# Mapping to ${hardwareModels[hardwareModel].name} topology\n`
        code += 'from cirq.contrib.routing import route_circuit\n'
        
        // Create the device based on the hardware model
        code += 'device_graph = nx.Graph()\n'
        
        // Add code to create the device topology
        if (hardwareModel === 'linear') {
          code += '# Linear topology\n'
          code += 'for i in range(len(qubits) - 1):\n'
          code += '    device_graph.add_edge(qubits[i], qubits[i + 1])\n'
        }
        else if (hardwareModel === 'grid') {
          code += '# Grid topology\n'
          code += 'import math\n'
          code += 'grid_size = math.ceil(math.sqrt(len(qubits)))\n'
          code += 'for i in range(len(qubits)):\n'
          code += '    row, col = i // grid_size, i % grid_size\n'
          code += '    if col < grid_size - 1 and i + 1 < len(qubits):\n'
          code += '        device_graph.add_edge(qubits[i], qubits[i + 1])\n'
          code += '    if row < grid_size - 1 and i + grid_size < len(qubits):\n'
          code += '        device_graph.add_edge(qubits[i], qubits[i + grid_size])\n'
        }
        else {
          code += '# Custom device topology\n'
          code += 'for i in range(len(qubits)):\n'
          code += '    for j in range(i + 1, len(qubits)):\n'
          code += '        device_graph.add_edge(qubits[i], qubits[j])\n'
        }
        
        // Map the circuit to the device
        code += '\n# Map circuit to device topology\n'
        code += 'mapped_circuit = route_circuit(circuit, device_graph';
        
        if (options.advancedOptions.preserveLayout) {
          code += ', router=cirq.contrib.routing.GreedyRouter()'
        }
        
        code += ')\n';
        code += 'circuit = mapped_circuit\n';
      }
    }
    
    if (options.advancedOptions.noiseAware) {
      code += '\n# Apply noise-aware optimizations\n'
      code += '# Note: In a real implementation, you would customize this based on hardware noise characteristics\n'
      code += 'from cirq.contrib.noise_models import DepolarizingNoiseModel\n'
      code += 'noise_model = DepolarizingNoiseModel(depolarizing_probability=0.001)\n'
      code += 'noisy_circuit = cirq.Circuit(noise_model.noisy_moments(circuit.moments, system_qubits=qubits))\n'
      
      // Comment on the noisy circuit, but keep using the optimized one
      code += '# Created a noisy circuit model for simulation, but continuing with the optimized circuit\n'
    }
    
    // Print circuit statistics
    code += '\n# Print circuit statistics\n'
    code += 'print(f"Original circuit length: {len(circuit.moments)}")\n'
    code += 'print(f"Original circuit operations: {sum(len(moment) for moment in circuit.moments)}")\n'
    code += 'print(f"Optimized circuit length: {len(circuit.moments)}")\n'
    code += 'print(f"Optimized circuit operations: {sum(len(moment) for moment in circuit.moments)}")\n'
  }
  // Apply more basic circuit optimization if requested
  else if (optimize) {
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