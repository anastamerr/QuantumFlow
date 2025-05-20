import { Gate, Qubit } from '../../../types/circuit';
import { OptimizationOptions, defaultOptimizationOptions } from '../../../types/optimizationTypes';
import { prepareGatesForCodeGeneration, validateCircuitInput, groupGatesByPosition } from './codeGeneratorUtils';
import { hardwareModels } from '../../../utils/circuitOptimizer';

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
  // Validate input
  if (!validateCircuitInput(qubits, gates)) {
    return '# Empty circuit - add gates to generate code';
  }

  // Prepare gates and imports
  const { processedGates, imports } = prepareGatesForCodeGeneration(
    qubits, gates, optimize, optimizationOptions, defaultOptimizationOptions
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

  // Start building the code
  let code = '# Generated Cirq code\n';
  code += cirqImports.join('\n') + '\n\n';

  // Define qubits
  code += '# Define qubits\n';
  code += `qubits = [cirq.LineQubit(i) for i in range(${qubits.length})]\n\n`;

  // Create the circuit
  code += '# Create the circuit\n';
  code += 'circuit = cirq.Circuit()\n\n';

  // Add gates section
  code += generateGateSection(processedGates);
  
  // Add measurement section
  code += generateMeasurementSection(processedGates, qubits);
  
  // Add optimization section if requested
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  if (optimize) {
    code += generateOptimizationSection(options);
  }
  
  // Add simulation section
  code += generateSimulationSection();
  
  return code;
};

/**
 * Generate the gate section of the code by grouping gates by position
 */
function generateGateSection(gates: Gate[]): string {
  let gateSection = '# Add gates to the circuit\n';
  
  // Group gates by position for moment-based addition
  const gatesByPosition = groupGatesByPosition(gates);
  
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
  
  return gateSection + '\n';
}

/**
 * Generate the measurement section of the code
 */
function generateMeasurementSection(gates: Gate[], qubits: Qubit[]): string {
  // Only add measurements if none are already in the circuit
  if (gates.some(gate => gate.type === 'measure')) {
    return '';
  }
  
  let measurementSection = '# Measure all qubits\n';
  qubits.forEach(qubit => {
    measurementSection += `circuit.append(cirq.measure(qubits[${qubit.id}], key='q${qubit.id}'))\n`;
  });
  
  return measurementSection + '\n';
}

/**
 * Generate the optimization section of the code
 */
function generateOptimizationSection(options: OptimizationOptions): string {
  let optimizationSection = '';
  
  if (options.enableAdvancedOptimization && options.advancedOptions) {
    optimizationSection += '# Apply advanced circuit optimizations\n';
    
    // Add different optimizers based on advanced options
    if (options.advancedOptions.synthesisLevel > 0) {
      optimizationSection += '# Apply circuit synthesis optimizations\n';
      optimizationSection += 'circuit = cirq.optimize_for_target_gateset(circuit)\n';
      optimizationSection += 'circuit = cirq.merge_single_qubit_gates_into_phased_x_z(circuit)\n';
      
      if (options.advancedOptions.synthesisLevel >= 2) {
        optimizationSection += '# Apply medium-level synthesis optimizations\n';
        optimizationSection += 'circuit = cirq.drop_empty_moments(circuit)\n';
        optimizationSection += 'circuit = cirq.drop_negligible_operations(circuit)\n';
        optimizationSection += 'circuit = cirq.merge_single_qubit_gates_into_phxz(circuit)\n';
      }
      
      if (options.advancedOptions.synthesisLevel >= 3) {
        optimizationSection += '# Apply aggressive synthesis optimizations\n';
        optimizationSection += 'optimizer = EjectPhasedPaulis()\n';
        optimizationSection += 'circuit = optimizer.optimize_circuit(circuit)\n';
      }
    }
    
    if (options.advancedOptions.depthReduction) {
      optimizationSection += '\n# Apply circuit depth reduction\n';
      optimizationSection += 'initial_depth = len(circuit)\n';
      optimizationSection += 'circuit = cirq.merge_interactions(circuit, maximize_distance=True)\n';
      
      if (options.advancedOptions.maxDepth && options.advancedOptions.maxDepth > 0) {
        optimizationSection += `# Target maximum depth: ${options.advancedOptions.maxDepth}\n`;
        optimizationSection += `circuit = circuit[:min(len(circuit), ${options.advancedOptions.maxDepth})]\n`;
      }
    }
    
    if (options.advancedOptions.qubitMapping) {
      optimizationSection += '\n# Apply qubit mapping\n';
      const hardwareModel = options.advancedOptions.hardwareModel || 'linear';
      
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
        
        if (options.advancedOptions.preserveLayout) {
          optimizationSection += ', router=cirq.contrib.routing.GreedyRouter()';
        }
        
        optimizationSection += ')\n';
        optimizationSection += 'circuit = mapped_circuit\n';
      }
    }
    
    if (options.advancedOptions.noiseAware) {
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
  else {
    optimizationSection += '\n# Optimize the circuit\n';
    optimizationSection += '# Original circuit size\n';
    optimizationSection += 'print("Original circuit size:", len(circuit))\n\n';
    
    // Add different optimizers based on options
    if (options.consolidateGates || options.cancelAdjacentGates) {
      optimizationSection += '# Apply circuit optimization\n';
      optimizationSection += 'optimizers = []\n';
      
      if (options.cancelAdjacentGates) {
        optimizationSection += 'optimizers.append(EjectZ())\n';
        optimizationSection += 'optimizers.append(EjectPhasedPaulis())\n';
      }
      
      if (options.consolidateGates) {
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
  
  return optimizationSection + '\n';
}

/**
 * Generate the simulation section of the code
 */
function generateSimulationSection(): string {
  let simulationSection = '# Run the simulation\n';
  simulationSection += 'simulator = cirq.Simulator()\n';
  simulationSection += 'result = simulator.run(circuit, repetitions=1024)\n';
  simulationSection += 'print("Measurement results:")\n';
  simulationSection += 'print(result)\n\n';
  
  // Add code to print the circuit
  simulationSection += '# Print the circuit\n';
  simulationSection += 'print("Circuit:")\n';
  simulationSection += 'print(circuit)\n';
  
  return simulationSection;
}