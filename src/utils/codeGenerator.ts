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
 * Generate function signature for code generation
 */
interface CodeGenerationResult {
  code: string;
  imports: string[];
  gateSection: string;
  measurementSection: string;
  simulationSection: string;
  visualizationSection: string;
}

/**
 * Common function to prepare gates for code generation
 */
const prepareGatesForCodeGeneration = (
  qubits: Qubit[],
  gates: Gate[],
  optimize: boolean = false,
  optimizationOptions: Partial<OptimizationOptions> = {}
): { 
  processedGates: Gate[],
  imports: string[]
} => {
  // Apply optimization if requested
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  const processedGates = optimize ? optimizeCircuit(gates, options) : gates;

  // Sort gates by position (time)
  const sortedGates = [...processedGates].sort((a, b) => {
    return (a.position || 0) - (b.position || 0);
  });

  // Determine necessary imports
  const imports = ['import numpy as np'];

  if (optimize) {
    if (options.transpileToBackend) {
      imports.push('from qiskit import transpile');
    }
    if (options.enableAdvancedOptimization) {
      imports.push('from qiskit.transpiler import PassManager');
      imports.push('from qiskit.transpiler.passes import *');
    }
  }

  return { 
    processedGates: sortedGates,
    imports: imports 
  };
};

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
    return '# Empty circuit - add gates to generate code';
  }

  // Prepare gates and imports
  const { processedGates, imports } = prepareGatesForCodeGeneration(
    qubits, gates, optimize, optimizationOptions
  );

  // Combine basic Qiskit imports with additional ones
  const basicImports = [
    'from qiskit import QuantumCircuit, Aer, execute',
    'from qiskit.visualization import plot_histogram'
  ];

  const allImports = [...new Set([...basicImports, ...imports])].join('\n');

  let code = '# Generated Qiskit code\n';
  code += allImports + '\n\n';

  // Create the quantum circuit
  code += `# Create a quantum circuit with ${qubits.length} qubits\n`;
  code += `qc = QuantumCircuit(${qubits.length}, ${qubits.length})\n\n`;

  // Add gates to the circuit section
  let gateSection = '# Add gates to the circuit\n';
  processedGates.forEach(gate => {
    switch (gate.type) {
      case 'h':
        gateSection += `qc.h(${gate.qubit})\n`;
        break;
      case 'x':
        gateSection += `qc.x(${gate.qubit})\n`;
        break;
      case 'y':
        gateSection += `qc.y(${gate.qubit})\n`;
        break;
      case 'z':
        gateSection += `qc.z(${gate.qubit})\n`;
        break;
      case 's':
        gateSection += `qc.s(${gate.qubit})\n`;
        break;
      case 't':
        gateSection += `qc.t(${gate.qubit})\n`;
        break;
      case 'rx':
        // Check all possible parameter names for backwards compatibility
        const theta = gate.params?.theta || gate.params?.angle || 0;
        gateSection += `qc.rx(${theta} * np.pi / 180, ${gate.qubit})  # Convert degrees to radians\n`;
        break;
      case 'ry':
        const phi = gate.params?.phi || gate.params?.theta || gate.params?.angle || 0;
        gateSection += `qc.ry(${phi} * np.pi / 180, ${gate.qubit})  # Convert degrees to radians\n`;
        break;
      case 'rz':
        const lambda = gate.params?.lambda || gate.params?.phi || gate.params?.angle || 0;
        gateSection += `qc.rz(${lambda} * np.pi / 180, ${gate.qubit})  # Convert degrees to radians\n`;
        break;
      case 'p':
        const phase = gate.params?.phi || gate.params?.phase || 0;
        gateSection += `qc.p(${phase} * np.pi / 180, ${gate.qubit})  # Convert degrees to radians\n`;
        break;
      case 'cnot':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cx(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cx(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'cz':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cz(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cz(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'swap':
        if (gate.targets && gate.targets.length >= 2) {
          gateSection += `qc.swap(${gate.targets[0]}, ${gate.targets[1]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.swap(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'toffoli':
        if (gate.controls && gate.controls.length >= 2 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.ccx(${gate.controls[0]}, ${gate.controls[1]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.ccx(${gate.qubit}, ${gate.controls[0]}, ${gate.targets[0]})\n`;
        }
        break;
      case 'measure':
        gateSection += `qc.measure(${gate.qubit}, ${gate.qubit})\n`;
        break;
      default:
        // Handle custom or unknown gates
        gateSection += `# Unsupported gate: ${gate.type}\n`;
    }
  });
  code += gateSection + '\n';

  // Add measurement section
  let measurementSection = '';
  if (!processedGates.some(gate => gate.type === 'measure')) {
    measurementSection += '# Measure all qubits\n';
    qubits.forEach(qubit => {
      measurementSection += `qc.measure(${qubit.id}, ${qubit.id})\n`;
    });
    code += measurementSection + '\n';
  }

  // Add advanced optimization transpilation code if requested
  if (optimize && optimizationOptions.enableAdvancedOptimization && optimizationOptions.advancedOptions) {
    let optimizationSection = '# Apply advanced circuit optimizations\n';
    optimizationSection += 'pass_manager = PassManager()\n';
    
    // Add passes based on optimization options
    if (optimizationOptions.advancedOptions.synthesisLevel > 0) {
      optimizationSection += '# Synthesis optimization passes\n';
      optimizationSection += 'pass_manager.append(Unroller())\n';
      optimizationSection += 'pass_manager.append(Optimize1qGates())\n';
      
      if (optimizationOptions.advancedOptions.synthesisLevel >= 2) {
        optimizationSection += 'pass_manager.append(CommutativeCancellation())\n';
      }
      
      if (optimizationOptions.advancedOptions.synthesisLevel >= 3) {
        optimizationSection += 'pass_manager.append(OptimizeSwap())\n';
        optimizationSection += 'pass_manager.append(RemoveResetInZeroState())\n';
      }
    }
    
    if (optimizationOptions.advancedOptions.depthReduction) {
      optimizationSection += '\n# Depth reduction passes\n';
      optimizationSection += 'pass_manager.append(Depth())\n';
      optimizationSection += 'pass_manager.append(FixedPoint("depth"))\n';
      
      if (optimizationOptions.advancedOptions.maxDepth) {
        optimizationSection += `# Target maximum depth: ${optimizationOptions.advancedOptions.maxDepth}\n`;
      }
    }
    
    if (optimizationOptions.advancedOptions.noiseAware) {
      optimizationSection += '\n# Noise-aware optimization passes\n';
      optimizationSection += 'pass_manager.append(NoiseAdaptiveLayout())\n';
      const hardwareModelName = optimizationOptions.advancedOptions.hardwareModel;
      if (hardwareModels[hardwareModelName]) {
        optimizationSection += `# Optimizing for ${hardwareModels[hardwareModelName].name} topology\n`;
      }
    }
    
    if (optimizationOptions.advancedOptions.qubitMapping) {
      optimizationSection += '\n# Qubit mapping passes\n';
      if (optimizationOptions.advancedOptions.preserveLayout) {
        optimizationSection += 'pass_manager.append(TrivialLayout())\n';
      } else {
        optimizationSection += 'pass_manager.append(DenseLayout())\n';
      }
      optimizationSection += 'pass_manager.append(FullAncillaAllocation())\n';
      optimizationSection += 'pass_manager.append(EnlargeWithAncilla())\n';
    }
    
    // Apply pass manager to circuit
    optimizationSection += '\n# Apply the custom pass manager\n';
    optimizationSection += 'optimized_qc = pass_manager.run(qc)\n';
    optimizationSection += '\n# Print circuit statistics before and after optimization\n';
    optimizationSection += 'print(f"Original circuit depth: {qc.depth()}")\n';
    optimizationSection += 'print(f"Original circuit gates: {len(qc.data)}")\n';
    optimizationSection += 'print(f"Optimized circuit depth: {optimized_qc.depth()}")\n';
    optimizationSection += 'print(f"Optimized circuit gates: {len(optimized_qc.data)}")\n\n';
    
    // Use the optimized circuit
    optimizationSection += '# Use the optimized circuit for execution\n';
    optimizationSection += 'qc = optimized_qc\n\n';
    
    code += optimizationSection;
  }
  
  // Add transpilation if requested
  let simulationSection = '';
  if (optimize && optimizationOptions.transpileToBackend) {
    simulationSection += '# Transpile the circuit for the target backend\n';
    simulationSection += `backend = Aer.get_backend('${optimizationOptions.backendName}')\n`;
    
    const optimizationLevel = optimizationOptions.enableAdvancedOptimization ? 3 : 2;
    simulationSection += `transpiled_qc = transpile(qc, backend=backend, optimization_level=${optimizationLevel})\n\n`;
    
    // Add a comment about what transpiling does
    simulationSection += '# Note: transpiling optimizes the circuit for the specific backend\n';
    simulationSection += '# It can reduce gate count and circuit depth\n\n';
    
    // Switch to using the transpiled circuit
    simulationSection += '# Run the simulation using the transpiled circuit\n';
    simulationSection += 'job = execute(transpiled_qc, backend, shots=1024)\n';
  } else {
    // Add code to run the simulation with the original circuit
    simulationSection += '# Run the simulation\n';
    simulationSection += 'simulator = Aer.get_backend(\'qasm_simulator\')\n';
    simulationSection += 'job = execute(qc, simulator, shots=1024)\n';
  }
  
  simulationSection += 'result = job.result()\n';
  simulationSection += 'counts = result.get_counts(qc)\n';
  simulationSection += 'print("Measurement results:", counts)\n\n';
  
  code += simulationSection;

  // Add code to draw the circuit
  let visualizationSection = '# Draw the circuit\n';
  if (optimize && optimizationOptions.transpileToBackend) {
    visualizationSection += 'print("Original Circuit:")\n';
    visualizationSection += 'print(qc.draw())\n';
    visualizationSection += 'print("\\nTranspiled Circuit:")\n';
    visualizationSection += 'print(transpiled_qc.draw())\n\n';
  } else {
    visualizationSection += 'print(qc.draw())\n\n';
  }

  // Add code to plot the histogram
  visualizationSection += '# Plot the results\n';
  visualizationSection += 'plot_histogram(counts)\n';
  
  code += visualizationSection;

  return code;
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
    return '# Empty circuit - add gates to generate code';
  }

  // Prepare gates and imports
  const { processedGates, imports } = prepareGatesForCodeGeneration(
    qubits, gates, optimize, optimizationOptions
  );

  // Add Cirq-specific imports
  const cirqImports = [
    'import cirq',
    ...imports
  ];

  if (optimize) {
    cirqImports.push('from cirq.optimizers import EjectZ, EjectPhasedPaulis, DropEmptyMoments, DropNegligible');
    
    if (optimizationOptions.enableAdvancedOptimization) {
      cirqImports.push('from cirq.optimizers import MergeInteractions, MergeSingleQubitGates');
      cirqImports.push('from cirq.transformers import optimize_for_target_gateset, drop_empty_moments, drop_negligible_operations');
      cirqImports.push('from cirq.contrib import routing');
    }
  }

  let code = '# Generated Cirq code\n';
  code += cirqImports.join('\n') + '\n\n';

  // Define qubits
  code += '# Define qubits\n';
  code += `qubits = [cirq.LineQubit(i) for i in range(${qubits.length})]\n\n`;

  // Create the circuit
  code += '# Create the circuit\n';
  code += 'circuit = cirq.Circuit()\n\n';

  // Sort gates by position (time)
  const sortedGates = [...processedGates].sort((a, b) => {
    return (a.position || 0) - (b.position || 0);
  });

  // Group gates by position for moment-based addition
  const gatesByPosition: Record<number, Gate[]> = {};
  sortedGates.forEach(gate => {
    const pos = gate.position || 0;
    if (!gatesByPosition[pos]) {
      gatesByPosition[pos] = [];
    }
    gatesByPosition[pos].push(gate);
  });

  // Add gates to the circuit by position
  let gateSection = '# Add gates to the circuit\n';
  Object.entries(gatesByPosition).forEach(([position, posGates]) => {
    gateSection += `# Position ${position}\n`;
    posGates.forEach(gate => {
      switch (gate.type) {
        case 'h':
          gateSection += `circuit.append(cirq.H(qubits[${gate.qubit}]))\n`;
          break;
        case 'x':
          gateSection += `circuit.append(cirq.X(qubits[${gate.qubit}]))\n`;
          break;
        case 'y':
          gateSection += `circuit.append(cirq.Y(qubits[${gate.qubit}]))\n`;
          break;
        case 'z':
          gateSection += `circuit.append(cirq.Z(qubits[${gate.qubit}]))\n`;
          break;
        case 's':
          gateSection += `circuit.append(cirq.S(qubits[${gate.qubit}]))\n`;
          break;
        case 't':
          gateSection += `circuit.append(cirq.T(qubits[${gate.qubit}]))\n`;
          break;
        case 'rx':
          const theta = gate.params?.theta || gate.params?.angle || 0;
          gateSection += `circuit.append(cirq.rx(${theta} * np.pi / 180)(qubits[${gate.qubit}]))  # Convert degrees to radians\n`;
          break;
        case 'ry':
          const phi = gate.params?.phi || gate.params?.theta || gate.params?.angle || 0;
          gateSection += `circuit.append(cirq.ry(${phi} * np.pi / 180)(qubits[${gate.qubit}]))  # Convert degrees to radians\n`;
          break;
        case 'rz':
          const lambda = gate.params?.lambda || gate.params?.phi || gate.params?.angle || 0;
          gateSection += `circuit.append(cirq.rz(${lambda} * np.pi / 180)(qubits[${gate.qubit}]))  # Convert degrees to radians\n`;
          break;
        case 'p':
          const phase = gate.params?.phi || gate.params?.phase || 0;
          gateSection += `circuit.append(cirq.ZPowGate(exponent=${phase}/360)(qubits[${gate.qubit}]))  # Convert degrees to turns\n`;
          break;
        case 'cnot':
          if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
            gateSection += `circuit.append(cirq.CNOT(qubits[${gate.controls[0]}], qubits[${gate.targets[0]}]))\n`;
          } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
            gateSection += `circuit.append(cirq.CNOT(qubits[${gate.qubit}], qubits[${gate.targets[0]}]))\n`;
          }
          break;
        case 'cz':
          if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
            gateSection += `circuit.append(cirq.CZ(qubits[${gate.controls[0]}], qubits[${gate.targets[0]}]))\n`;
          } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
            gateSection += `circuit.append(cirq.CZ(qubits[${gate.qubit}], qubits[${gate.targets[0]}]))\n`;
          }
          break;
        case 'swap':
          if (gate.targets && gate.targets.length >= 2) {
            gateSection += `circuit.append(cirq.SWAP(qubits[${gate.targets[0]}], qubits[${gate.targets[1]}]))\n`;
          } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
            gateSection += `circuit.append(cirq.SWAP(qubits[${gate.qubit}], qubits[${gate.targets[0]}]))\n`;
          }
          break;
        case 'toffoli':
          if (gate.controls && gate.controls.length >= 2 && gate.targets && gate.targets.length > 0) {
            gateSection += `circuit.append(cirq.TOFFOLI(qubits[${gate.controls[0]}], qubits[${gate.controls[1]}], qubits[${gate.targets[0]}]))\n`;
          } else if (gate.qubit !== undefined && gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
            gateSection += `circuit.append(cirq.TOFFOLI(qubits[${gate.qubit}], qubits[${gate.controls[0]}], qubits[${gate.targets[0]}]))\n`;
          }
          break;
        case 'measure':
          gateSection += `circuit.append(cirq.measure(qubits[${gate.qubit}], key='q${gate.qubit}'))\n`;
          break;
        default:
          // Handle custom or unknown gates
          gateSection += `# Unsupported gate: ${gate.type}\n`;
      }
    });
  });
  code += gateSection + '\n';

  // Add measurement section if no measurement gates were added
  let measurementSection = '';
  if (!sortedGates.some(gate => gate.type === 'measure')) {
    measurementSection += '# Measure all qubits\n';
    qubits.forEach(qubit => {
      measurementSection += `circuit.append(cirq.measure(qubits[${qubit.id}], key='q${qubit.id}'))\n`;
    });
    code += measurementSection + '\n';
  }

  // Add optimization section if requested
  let optimizationSection = '';
  if (optimize) {
    if (optimizationOptions.enableAdvancedOptimization && optimizationOptions.advancedOptions) {
      optimizationSection += '# Apply advanced circuit optimizations\n';
      
      // Add different optimizers based on advanced options
      if (optimizationOptions.advancedOptions.synthesisLevel > 0) {
        optimizationSection += '# Apply circuit synthesis optimizations\n';
        optimizationSection += 'circuit = cirq.optimize_for_target_gateset(circuit)\n';
        optimizationSection += 'circuit = cirq.merge_single_qubit_gates_into_phased_x_z(circuit)\n';
        
        if (optimizationOptions.advancedOptions.synthesisLevel >= 2) {
          optimizationSection += '# Apply medium-level synthesis optimizations\n';
          optimizationSection += 'circuit = cirq.drop_empty_moments(circuit)\n';
          optimizationSection += 'circuit = cirq.drop_negligible_operations(circuit)\n';
          optimizationSection += 'circuit = cirq.merge_single_qubit_gates_into_phxz(circuit)\n';
        }
        
        if (optimizationOptions.advancedOptions.synthesisLevel >= 3) {
          optimizationSection += '# Apply aggressive synthesis optimizations\n';
          optimizationSection += 'optimizer = EjectPhasedPaulis()\n';
          optimizationSection += 'circuit = optimizer.optimize_circuit(circuit)\n';
        }
      }
      
      if (optimizationOptions.advancedOptions.depthReduction) {
        optimizationSection += '\n# Apply circuit depth reduction\n';
        optimizationSection += 'initial_depth = len(circuit)\n';
        optimizationSection += 'circuit = cirq.merge_interactions(circuit, maximize_distance=True)\n';
        
        if (optimizationOptions.advancedOptions.maxDepth && optimizationOptions.advancedOptions.maxDepth > 0) {
          optimizationSection += `# Target maximum depth: ${optimizationOptions.advancedOptions.maxDepth}\n`;
          optimizationSection += 'circuit = circuit[:min(len(circuit), ' + optimizationOptions.advancedOptions.maxDepth + ')]\n';
        }
      }
      
      if (optimizationOptions.advancedOptions.qubitMapping) {
        optimizationSection += '\n# Apply qubit mapping\n';
        const hardwareModel = optimizationOptions.advancedOptions.hardwareModel;
        
        if (hardwareModels[hardwareModel]) {
          optimizationSection += `# Mapping to ${hardwareModels[hardwareModel].name} topology\n`;
          optimizationSection += 'import networkx as nx\n';
          optimizationSection += 'from cirq.contrib.routing import route_circuit\n';
          
          // Create the device based on the hardware model
          optimizationSection += 'device_graph = nx.Graph()\n';
          
          // Add code to create the device topology
          if (hardwareModel === 'linear') {
            optimizationSection += '# Linear topology\n';
            optimizationSection += 'for i in range(len(qubits) - 1):\n';
            optimizationSection += '    device_graph.add_edge(qubits[i], qubits[i + 1])\n';
          }
          else if (hardwareModel === 'grid') {
            optimizationSection += '# Grid topology\n';
            optimizationSection += 'import math\n';
            optimizationSection += 'grid_size = math.ceil(math.sqrt(len(qubits)))\n';
            optimizationSection += 'for i in range(len(qubits)):\n';
            optimizationSection += '    row, col = i // grid_size, i % grid_size\n';
            optimizationSection += '    if col < grid_size - 1 and i + 1 < len(qubits):\n';
            optimizationSection += '        device_graph.add_edge(qubits[i], qubits[i + 1])\n';
            optimizationSection += '    if row < grid_size - 1 and i + grid_size < len(qubits):\n';
            optimizationSection += '        device_graph.add_edge(qubits[i], qubits[i + grid_size])\n';
          }
          else {
            optimizationSection += '# Custom device topology\n';
            optimizationSection += 'for i in range(len(qubits)):\n';
            optimizationSection += '    for j in range(i + 1, len(qubits)):\n';
            optimizationSection += '        device_graph.add_edge(qubits[i], qubits[j])\n';
          }
          
          // Map the circuit to the device
          optimizationSection += '\n# Map circuit to device topology\n';
          optimizationSection += 'mapped_circuit = route_circuit(circuit, device_graph';
          
          if (optimizationOptions.advancedOptions.preserveLayout) {
            optimizationSection += ', router=cirq.contrib.routing.GreedyRouter()';
          }
          
          optimizationSection += ')\n';
          optimizationSection += 'circuit = mapped_circuit\n';
        }
      }
      
      if (optimizationOptions.advancedOptions.noiseAware) {
        optimizationSection += '\n# Apply noise-aware optimizations\n';
        optimizationSection += '# Note: In a real implementation, you would customize this based on hardware noise characteristics\n';
        optimizationSection += 'from cirq.contrib.noise_models import DepolarizingNoiseModel\n';
        optimizationSection += 'noise_model = DepolarizingNoiseModel(depolarizing_probability=0.001)\n';
        optimizationSection += 'noisy_circuit = cirq.Circuit(noise_model.noisy_moments(circuit.moments, system_qubits=qubits))\n';
        
        // Comment on the noisy circuit, but keep using the optimized one
        optimizationSection += '# Created a noisy circuit model for simulation, but continuing with the optimized circuit\n';
      }
      
      // Print circuit statistics
      optimizationSection += '\n# Print circuit statistics\n';
      optimizationSection += 'print(f"Original circuit length: {len(circuit.moments)}")\n';
      optimizationSection += 'print(f"Original circuit operations: {sum(len(moment) for moment in circuit.moments)}")\n';
      optimizationSection += 'print(f"Optimized circuit length: {len(circuit.moments)}")\n';
      optimizationSection += 'print(f"Optimized circuit operations: {sum(len(moment) for moment in circuit.moments)}")\n';
    }
    // Apply more basic circuit optimization if requested
    else if (optimize) {
      optimizationSection += '\n# Optimize the circuit\n';
      optimizationSection += '# Original circuit size\n';
      optimizationSection += 'print("Original circuit size:", len(circuit))\n\n';
      
      // Add different optimizers based on options
      if (optimizationOptions.consolidateGates || optimizationOptions.cancelAdjacentGates) {
        optimizationSection += '# Apply circuit optimization\n';
        optimizationSection += 'optimizers = []\n';
        
        if (optimizationOptions.cancelAdjacentGates) {
          optimizationSection += 'optimizers.append(EjectZ())\n';
          optimizationSection += 'optimizers.append(EjectPhasedPaulis())\n';
        }
        
        if (optimizationOptions.consolidateGates) {
          optimizationSection += 'optimizers.append(DropEmptyMoments())\n';
          optimizationSection += 'optimizers.append(DropNegligible())\n';
        }
        
        optimizationSection += '\n# Apply each optimizer to the circuit\n';
        optimizationSection += 'for optimizer in optimizers:\n';
        optimizationSection += '    optimizer.optimize_circuit(circuit)\n\n';
        
        optimizationSection += '# Optimized circuit size\n';
        optimizationSection += 'print("Optimized circuit size:", len(circuit))\n';
      }
    }
    
    if (optimizationSection.length > 0) {
      code += optimizationSection + '\n';
    }
  }

  // Add code to run the simulation
  let simulationSection = '# Run the simulation\n';
  simulationSection += 'simulator = cirq.Simulator()\n';
  simulationSection += 'result = simulator.run(circuit, repetitions=1024)\n';
  simulationSection += 'print("Measurement results:")\n';
  simulationSection += 'print(result)\n\n';
  
  code += simulationSection;

  // Add code to print the circuit
  let visualizationSection = '# Print the circuit\n';
  visualizationSection += 'print("Circuit:")\n';
  visualizationSection += 'print(circuit)\n';
  
  code += visualizationSection;

  return code;
};

/**
 * Generates a circuit description in JSON format
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @returns JSON representation of the circuit
 */
export const generateCircuitJSON = (
  qubits: Qubit[],
  gates: Gate[],
  circuitName: string = 'Quantum Circuit',
  circuitDescription: string = ''
): string => {
  if (qubits.length === 0) {
    return JSON.stringify({
      name: circuitName,
      description: circuitDescription || 'Empty circuit',
      qubits: [],
      gates: []
    }, null, 2);
  }

  // Create a cleaned version of the circuit data
  const circuitData = {
    name: circuitName,
    description: circuitDescription || `Quantum circuit with ${qubits.length} qubits and ${gates.length} gates`,
    qubits: qubits.map(q => ({
      id: q.id,
      name: q.name
    })),
    gates: gates.map(g => {
      const cleanedGate: any = {
        id: g.id,
        type: g.type,
        qubit: g.qubit,
        position: g.position
      };

      if (g.params && Object.keys(g.params).length > 0) {
        cleanedGate.params = { ...g.params };
      }

      if (g.targets && g.targets.length > 0) {
        cleanedGate.targets = [...g.targets];
      }

      if (g.controls && g.controls.length > 0) {
        cleanedGate.controls = [...g.controls];
      }

      return cleanedGate;
    }),
    metadata: {
      numQubits: qubits.length,
      numGates: gates.length,
      createdAt: new Date().toISOString(),
      framework: 'QuantumFlow'
    }
  };

  return JSON.stringify(circuitData, null, 2);
};

/**
 * Generates Amazon Braket Python code from the circuit representation
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @param optimize Whether to optimize the circuit before generating code
 * @param optimizationOptions Options for circuit optimization
 * @returns Amazon Braket Python code as a string
 */
export const generateBraketCode = (
  qubits: Qubit[], 
  gates: Gate[], 
  optimize: boolean = false,
  optimizationOptions: Partial<OptimizationOptions> = {}
): string => {
  if (qubits.length === 0 || gates.length === 0) {
    return '# Empty circuit - add gates to generate code';
  }

  // Apply optimization if requested
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  const processedGates = optimize ? optimizeCircuit(gates, options) : gates;

  // Sort gates by position (time)
  const sortedGates = [...processedGates].sort((a, b) => {
    return (a.position || 0) - (b.position || 0);
  });

  let code = '# Generated Amazon Braket code\n';
  code += 'import numpy as np\n';
  code += 'from braket.circuits import Circuit\n';
  code += 'from braket.devices import LocalSimulator\n';
  
  if (optimize) {
    code += 'from braket.circuits.gate_calibrations import Calibrations\n';
    code += 'from braket.circuits.noise_model import GateCalibratedNoiseModel\n';
  }
  
  code += '\n';

  // Create the quantum circuit
  code += `# Create a quantum circuit with ${qubits.length} qubits\n`;
  code += `circuit = Circuit(${qubits.length})\n\n`;

  // Add gates to the circuit
  code += '# Add gates to the circuit\n';
  sortedGates.forEach(gate => {
    switch (gate.type) {
      case 'h':
        code += `circuit.h(${gate.qubit})\n`;
        break;
      case 'x':
        code += `circuit.x(${gate.qubit})\n`;
        break;
      case 'y':
        code += `circuit.y(${gate.qubit})\n`;
        break;
      case 'z':
        code += `circuit.z(${gate.qubit})\n`;
        break;
      case 's':
        code += `circuit.s(${gate.qubit})\n`;
        break;
      case 't':
        code += `circuit.t(${gate.qubit})\n`;
        break;
      case 'rx':
        // Check all possible parameter names for backwards compatibility
        const theta = gate.params?.theta || gate.params?.angle || 0;
        code += `circuit.rx(${gate.qubit}, ${theta} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'ry':
        const phi = gate.params?.phi || gate.params?.theta || gate.params?.angle || 0;
        code += `circuit.ry(${gate.qubit}, ${phi} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'rz':
        const lambda = gate.params?.lambda || gate.params?.phi || gate.params?.angle || 0;
        code += `circuit.rz(${gate.qubit}, ${lambda} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'p':
        const phase = gate.params?.phi || gate.params?.phase || 0;
        code += `circuit.phase_shift(${gate.qubit}, ${phase} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'cnot':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          code += `circuit.cnot(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          code += `circuit.cnot(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'cz':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          code += `circuit.cz(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          code += `circuit.cz(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'swap':
        if (gate.targets && gate.targets.length >= 2) {
          code += `circuit.swap(${gate.targets[0]}, ${gate.targets[1]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          code += `circuit.swap(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'toffoli':
        if (gate.controls && gate.controls.length >= 2 && gate.targets && gate.targets.length > 0) {
          code += `circuit.ccnot(${gate.controls[0]}, ${gate.controls[1]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          code += `circuit.ccnot(${gate.qubit}, ${gate.controls[0]}, ${gate.targets[0]})\n`;
        }
        break;
      default:
        // Handle custom or unknown gates
        code += `# Unsupported gate: ${gate.type}\n`;
    }
  });

  // Add measurement for all qubits
  code += '\n# Measure all qubits\n';
  code += 'circuit.measure_all()\n\n';

  // Add noise model if noise-aware optimization is enabled
  if (optimize && options.enableAdvancedOptimization && options.advancedOptions?.noiseAware) {
    code += '# Apply noise model for more realistic simulation\n';
    code += 'calibrations = Calibrations()\n';
    code += 'calibrations.add_noise(\n';
    code += '    gate_name="h",\n';
    code += '    qubit_range=range(circuit.qubit_count),\n';
    code += '    noise_operations=[("depolarizing", {"probability": 0.005})])\n';
    code += 'calibrations.add_noise(\n';
    code += '    gate_name="cnot",\n';
    code += '    qubit_range=range(circuit.qubit_count),\n';
    code += '    qubit_range2=range(circuit.qubit_count),\n';
    code += '    noise_operations=[("depolarizing", {"probability": 0.01})])\n\n';
    code += 'noise_model = GateCalibratedNoiseModel(calibrations)\n';
    code += 'simulator = LocalSimulator(backend="braket_dm", noise_model=noise_model)\n\n';
  } else {
    code += '# Create a local simulator\n';
    code += 'simulator = LocalSimulator()\n\n';
  }

  // Run the simulation
  code += '# Run the simulation with 1000 shots\n';
  code += 'result = simulator.run(circuit, shots=1000).result()\n';
  code += 'counts = result.measurement_counts\n\n';

  // Print results
  code += '# Print the circuit\n';
  code += 'print(circuit)\n\n';
  code += '# Print the measurement results\n';
  code += 'print("Measurement results:", counts)\n\n';
  code += '# Calculate result probabilities\n';
  code += 'total_shots = sum(counts.values())\n';
  code += 'probabilities = {key: value/total_shots for key, value in counts.items()}\n';
  code += 'print("Result probabilities:", probabilities)\n';

  return code;
};

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
};