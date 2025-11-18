import { Gate, Qubit } from "../../../types/circuit";
import {
  OptimizationOptions,
  defaultOptimizationOptions,
} from "../../../types/optimizationTypes";
import { optimizeCircuit } from "../optimizers/circuitOptimizer";
import { validateCircuitInput } from "./codeGeneratorUtils";

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
    return "# Empty circuit - add gates to generate code";
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

  if (
    optimize &&
    options.enableAdvancedOptimization &&
    options.advancedOptions?.noiseAware
  ) {
    code += generateNoiseModel();
  } else {
    code += "# Create a local simulator\n";
    code += "simulator = LocalSimulator()\n\n";
  }

  code += generateSimulation();

  return code;
};

/**
 * Generate the imports section
 */
function generateImports(optimize: boolean): string {
  let imports = "# Generated Amazon Braket code\n";
  imports += "import numpy as np\n";
  imports += "from braket.circuits import Circuit\n";
  imports += "from braket.devices import LocalSimulator\n";

  if (optimize) {
    imports += "from braket.circuits.gate_calibrations import Calibrations\n";
    imports +=
      "from braket.circuits.noise_model import GateCalibratedNoiseModel\n";
  }

  imports += "\n";

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
  let gateSection = "# Add gates to the circuit\n";

  gates.forEach((gate) => {
    switch (gate.type) {
      case "h":
        gateSection += `circuit.h(${gate.qubit})\n`;
        break;
      case "x":
        gateSection += `circuit.x(${gate.qubit})\n`;
        break;
      case "y":
        gateSection += `circuit.y(${gate.qubit})\n`;
        break;
      case "z":
        gateSection += `circuit.z(${gate.qubit})\n`;
        break;
      case "s":
        gateSection += `circuit.s(${gate.qubit})\n`;
        break;
      case "t":
        gateSection += `circuit.t(${gate.qubit})\n`;
        break;
      case "rx":
        // RX gate uses theta parameter (rotation around X-axis)
        const rxTheta = Number(gate.params?.theta || gate.params?.angle || 0);
        if (isNaN(rxTheta)) {
          gateSection += `# Warning: Invalid parameter for RX gate, using 0\n`;
          gateSection += `circuit.rx(${gate.qubit}, 0)\n`;
        } else {
          // Check if value is already in radians (between -2π and 2π) or degrees
          const rxAngle =
            Math.abs(rxTheta) <= 2 * Math.PI
              ? rxTheta
              : (rxTheta * Math.PI) / 180;
          gateSection += `circuit.rx(${gate.qubit}, ${rxAngle})\n`;
        }
        break;
      case "ry":
        // RY gate uses theta parameter (rotation around Y-axis)
        const ryTheta = Number(gate.params?.theta || gate.params?.angle || 0);
        if (isNaN(ryTheta)) {
          gateSection += `# Warning: Invalid parameter for RY gate, using 0\n`;
          gateSection += `circuit.ry(${gate.qubit}, 0)\n`;
        } else {
          const ryAngle =
            Math.abs(ryTheta) <= 2 * Math.PI
              ? ryTheta
              : (ryTheta * Math.PI) / 180;
          gateSection += `circuit.ry(${gate.qubit}, ${ryAngle})\n`;
        }
        break;
      case "rz":
        // RZ gate uses phi parameter (rotation around Z-axis)
        const rzPhi = Number(
          gate.params?.phi || gate.params?.theta || gate.params?.angle || 0
        );
        if (isNaN(rzPhi)) {
          gateSection += `# Warning: Invalid parameter for RZ gate, using 0\n`;
          gateSection += `circuit.rz(${gate.qubit}, 0)\n`;
        } else {
          const rzAngle =
            Math.abs(rzPhi) <= 2 * Math.PI ? rzPhi : (rzPhi * Math.PI) / 180;
          gateSection += `circuit.rz(${gate.qubit}, ${rzAngle})\n`;
        }
        break;
      case "p":
        // Phase gate uses phi parameter
        const phasePhi = Number(gate.params?.phi || gate.params?.phase || 0);
        if (isNaN(phasePhi)) {
          gateSection += `# Warning: Invalid parameter for P gate, using 0\n`;
          gateSection += `circuit.phaseshift(${gate.qubit}, 0)\n`;
        } else {
          const phaseAngle =
            Math.abs(phasePhi) <= 2 * Math.PI
              ? phasePhi
              : (phasePhi * Math.PI) / 180;
          gateSection += `circuit.phaseshift(${gate.qubit}, ${phaseAngle})\n`;
        }
        break;
      case "cnot":
        if (
          gate.controls &&
          gate.controls.length > 0 &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.cnot(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (
          gate.qubit !== undefined &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.cnot(${gate.qubit}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: CNOT gate missing control or target qubit\n`;
        }
        break;
      case "cz":
        if (
          gate.controls &&
          gate.controls.length > 0 &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.cz(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (
          gate.qubit !== undefined &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.cz(${gate.qubit}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: CZ gate missing control or target qubit\n`;
        }
        break;
      case "cp":
        const cpPhi = Number(
          gate.params?.phi || gate.params?.theta || gate.params?.angle || 0
        );
        let cpAngle = 0;
        if (isNaN(cpPhi)) {
          gateSection += `# Warning: Invalid parameter for CP gate, using 0\n`;
        } else {
          cpAngle =
            Math.abs(cpPhi) <= 2 * Math.PI ? cpPhi : (cpPhi * Math.PI) / 180;
        }

        if (
          gate.controls &&
          gate.controls.length > 0 &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.cphaseshift(${gate.controls[0]}, ${gate.targets[0]}, ${cpAngle})\n`;
        } else if (
          gate.qubit !== undefined &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.cphaseshift(${gate.qubit}, ${gate.targets[0]}, ${cpAngle})\n`;
        } else {
          gateSection += `# Warning: CP gate missing control or target qubit\n`;
        }
        break;
      case "swap":
        if (gate.targets && gate.targets.length >= 2) {
          gateSection += `circuit.swap(${gate.targets[0]}, ${gate.targets[1]})\n`;
        } else if (
          gate.qubit !== undefined &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.swap(${gate.qubit}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: SWAP gate needs two qubits\n`;
        }
        break;
      case "toffoli":
        if (
          gate.controls &&
          gate.controls.length >= 2 &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.ccnot(${gate.controls[0]}, ${gate.controls[1]}, ${gate.targets[0]})\n`;
        } else if (
          gate.qubit !== undefined &&
          gate.controls &&
          gate.controls.length > 0 &&
          gate.targets &&
          gate.targets.length > 0
        ) {
          gateSection += `circuit.ccnot(${gate.qubit}, ${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: Toffoli gate needs 2 control qubits and 1 target qubit\n`;
        }
        break;
      default:
        // Handle custom or unknown gates
        gateSection += `# Unsupported gate: ${gate.type}\n`;
    }
  });

  return gateSection + "\n";
}

/**
 * Generate the measurements section
 */
function generateMeasurements(): string {
  return "# Measure all qubits\ncircuit.measure_all()\n\n";
}

/**
 * Generate the noise model section
 */
function generateNoiseModel(): string {
  let noiseSection = "# Apply noise model for more realistic simulation\n";
  noiseSection += "calibrations = Calibrations()\n";
  noiseSection += "calibrations.add_noise(\n";
  noiseSection += '    gate_name="h",\n';
  noiseSection += "    qubit_range=range(circuit.qubit_count),\n";
  noiseSection +=
    '    noise_operations=[("depolarizing", {"probability": 0.005})])\n';
  noiseSection += "calibrations.add_noise(\n";
  noiseSection += '    gate_name="cnot",\n';
  noiseSection += "    qubit_range=range(circuit.qubit_count),\n";
  noiseSection += "    qubit_range2=range(circuit.qubit_count),\n";
  noiseSection +=
    '    noise_operations=[("depolarizing", {"probability": 0.01})])\n\n';
  noiseSection += "noise_model = GateCalibratedNoiseModel(calibrations)\n";
  noiseSection +=
    'simulator = LocalSimulator(backend="braket_dm", noise_model=noise_model)\n\n';

  return noiseSection;
}

/**
 * Generate the simulation section
 */
function generateSimulation(): string {
  let simulationSection = "# Run the simulation with 1000 shots\n";
  simulationSection += "result = simulator.run(circuit, shots=1000).result()\n";
  simulationSection += "counts = result.measurement_counts\n\n";

  // Print results
  simulationSection += "# Print the circuit\n";
  simulationSection += "print(circuit)\n\n";
  simulationSection += "# Print the measurement results\n";
  simulationSection += 'print("Measurement results:", counts)\n\n';
  simulationSection += "# Calculate result probabilities\n";
  simulationSection += "total_shots = sum(counts.values())\n";
  simulationSection +=
    "probabilities = {key: value/total_shots for key, value in counts.items()}\n";
  simulationSection += 'print("Result probabilities:", probabilities)\n';

  return simulationSection;
}
