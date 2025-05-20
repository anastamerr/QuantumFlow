import { Gate, Qubit } from '../../../types/circuit';
import { OptimizationOptions, defaultOptimizationOptions } from '../../../types/optimizationTypes';
import { optimizeCircuit } from '../optimizers/circuitOptimizer';
import { validateCircuitInput } from './codeGeneratorUtils';

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
  // Validate input
  if (!validateCircuitInput(qubits, gates)) {
    return '# Empty circuit - add gates to generate code';
  }

  // Apply optimization if requested
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  const processedGates = optimize ? optimizeCircuit(gates, options) : gates;

  // Sort gates by position (time)
  const sortedGates = [...processedGates].sort((a, b) => {
    return (a.position || 0) - (b.position || 0);
  });

  // Generate code
  let code = generateImports(optimize);
  code += generateCircuitCreation(qubits);
  code += generateGateDefinitions(sortedGates);
  code += generateMeasurements();
  
  if (optimize && options.enableAdvancedOptimization && options.advancedOptions?.noiseAware) {
    code += generateNoiseModel();
  } else {
    code += '# Create a local simulator\n';
    code += 'simulator = LocalSimulator()\n\n';
  }
  
  code += generateSimulation();
  
  return code;
};

/**
 * Generate the imports section
 */
function generateImports(optimize: boolean): string {
  let imports = '# Generated Amazon Braket code\n';
  imports += 'import numpy as np\n';
  imports += 'from braket.circuits import Circuit\n';
  imports += 'from braket.devices import LocalSimulator\n';
  
  if (optimize) {
    imports += 'from braket.circuits.gate_calibrations import Calibrations\n';
    imports += 'from braket.circuits.noise_model import GateCalibratedNoiseModel\n';
  }
  
  imports += '\n';
  
  return imports;
}

/**
 * Generate the circuit creation section
 */
function generateCircuitCreation(qubits: Qubit[]): string {
  let creation = `# Create a quantum circuit with ${qubits.length} qubits\n`;
  creation += `circuit = Circuit(${qubits.length})\n\n`;
  
  return creation;
}

/**
 * Generate the gate definitions section
 */
function generateGateDefinitions(gates: Gate[]): string {
  let gateSection = '# Add gates to the circuit\n';
  
  gates.forEach(gate => {
    switch (gate.type) {
      case 'h':
        gateSection += `circuit.h(${gate.qubit})\n`;
        break;
      case 'x':
        gateSection += `circuit.x(${gate.qubit})\n`;
        break;
      case 'y':
        gateSection += `circuit.y(${gate.qubit})\n`;
        break;
      case 'z':
        gateSection += `circuit.z(${gate.qubit})\n`;
        break;
      case 's':
        gateSection += `circuit.s(${gate.qubit})\n`;
        break;
      case 't':
        gateSection += `circuit.t(${gate.qubit})\n`;
        break;
      case 'rx':
        // Check all possible parameter names for backwards compatibility
        const theta = gate.params?.theta || gate.params?.angle || 0;
        gateSection += `circuit.rx(${gate.qubit}, ${theta} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'ry':
        const phi = gate.params?.phi || gate.params?.theta || gate.params?.angle || 0;
        gateSection += `circuit.ry(${gate.qubit}, ${phi} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'rz':
        const lambda = gate.params?.lambda || gate.params?.phi || gate.params?.angle || 0;
        gateSection += `circuit.rz(${gate.qubit}, ${lambda} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'p':
        const phase = gate.params?.phi || gate.params?.phase || 0;
        gateSection += `circuit.phase_shift(${gate.qubit}, ${phase} * np.pi / 180)  # Convert degrees to radians\n`;
        break;
      case 'cnot':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `circuit.cnot(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `circuit.cnot(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'cz':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `circuit.cz(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `circuit.cz(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'swap':
        if (gate.targets && gate.targets.length >= 2) {
          gateSection += `circuit.swap(${gate.targets[0]}, ${gate.targets[1]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `circuit.swap(${gate.qubit}, ${gate.targets[0]})\n`;
        }
        break;
      case 'toffoli':
        if (gate.controls && gate.controls.length >= 2 && gate.targets && gate.targets.length > 0) {
          gateSection += `circuit.ccnot(${gate.controls[0]}, ${gate.controls[1]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `circuit.ccnot(${gate.qubit}, ${gate.controls[0]}, ${gate.targets[0]})\n`;
        }
        break;
      default:
        // Handle custom or unknown gates
        gateSection += `# Unsupported gate: ${gate.type}\n`;
    }
  });
  
  return gateSection + '\n';
}

/**
 * Generate the measurements section
 */
function generateMeasurements(): string {
  return '# Measure all qubits\ncircuit.measure_all()\n\n';
}

/**
 * Generate the noise model section
 */
function generateNoiseModel(): string {
  let noiseSection = '# Apply noise model for more realistic simulation\n';
  noiseSection += 'calibrations = Calibrations()\n';
  noiseSection += 'calibrations.add_noise(\n';
  noiseSection += '    gate_name="h",\n';
  noiseSection += '    qubit_range=range(circuit.qubit_count),\n';
  noiseSection += '    noise_operations=[("depolarizing", {"probability": 0.005})])\n';
  noiseSection += 'calibrations.add_noise(\n';
  noiseSection += '    gate_name="cnot",\n';
  noiseSection += '    qubit_range=range(circuit.qubit_count),\n';
  noiseSection += '    qubit_range2=range(circuit.qubit_count),\n';
  noiseSection += '    noise_operations=[("depolarizing", {"probability": 0.01})])\n\n';
  noiseSection += 'noise_model = GateCalibratedNoiseModel(calibrations)\n';
  noiseSection += 'simulator = LocalSimulator(backend="braket_dm", noise_model=noise_model)\n\n';
  
  return noiseSection;
}

/**
 * Generate the simulation section
 */
function generateSimulation(): string {
  let simulationSection = '# Run the simulation with 1000 shots\n';
  simulationSection += 'result = simulator.run(circuit, shots=1000).result()\n';
  simulationSection += 'counts = result.measurement_counts\n\n';

  // Print results
  simulationSection += '# Print the circuit\n';
  simulationSection += 'print(circuit)\n\n';
  simulationSection += '# Print the measurement results\n';
  simulationSection += 'print("Measurement results:", counts)\n\n';
  simulationSection += '# Calculate result probabilities\n';
  simulationSection += 'total_shots = sum(counts.values())\n';
  simulationSection += 'probabilities = {key: value/total_shots for key, value in counts.items()}\n';
  simulationSection += 'print("Result probabilities:", probabilities)\n';
  
  return simulationSection;
}