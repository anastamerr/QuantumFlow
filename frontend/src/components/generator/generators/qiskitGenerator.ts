import { Gate, Qubit } from '../../../types/circuit';
import { OptimizationOptions, defaultOptimizationOptions } from '../../../types/optimizationTypes';
import { coerceAngleToRadians, prepareGatesForCodeGeneration, validateCircuitInput } from './codeGeneratorUtils';
import { hardwareModels } from '../../../utils/circuitOptimizer';

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
  // Validate input
  if (!validateCircuitInput(qubits, gates)) {
    return '# Empty circuit - add gates to generate code';
  }

  // Prepare gates and imports
  const { processedGates, imports } = prepareGatesForCodeGeneration(
    qubits, gates, optimize, optimizationOptions, defaultOptimizationOptions
  );

  // Combine basic Qiskit imports with additional ones
  const basicImports = [
    'from qiskit import QuantumCircuit, transpile',
    'from qiskit_aer import Aer, AerSimulator',
    'from qiskit.visualization import plot_histogram',
    'import numpy as np'
  ];

  // Add optimization imports if needed
  if (optimize && optimizationOptions.enableAdvancedOptimization) {
    basicImports.push(
      'from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager'
    );
  }

  const allImports = [...new Set([...basicImports, ...imports])].join('\n');

  let code = '# Generated Qiskit code\n';
  code += allImports + '\n\n';

  // Create the quantum circuit
  code += `# Create a quantum circuit with ${qubits.length} qubits\n`;
  code += `qc = QuantumCircuit(${qubits.length}, ${qubits.length})\n\n`;

  // Add gate section
  code += generateGateSection(processedGates);
  
  // Add measurement section
  code += generateMeasurementSection(processedGates, qubits);
  
  // Add optimization section if requested
  if (optimize && optimizationOptions.enableAdvancedOptimization) {
    code += generateAdvancedOptimizationSection(optimizationOptions);
  }
  
  // Add transpilation section if requested
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  if (optimize && options.transpileToBackend) {
    code += generateTranspilationSection(options);
  } else {
    // Add code to run the simulation with the original circuit
    code += generateSimulationSection();
  }
  
  // Add visualization section
  code += generateVisualizationSection(optimize, options);

  return code;
};

/**
 * Generate the gate section of the code
 */
function generateGateSection(gates: Gate[]): string {
  let gateSection = '# Add gates to the circuit\n';
  
  gates.forEach(gate => {
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
        // RX gate uses theta parameter (rotation around X-axis)
        const rxTheta = Number(gate.params?.theta || gate.params?.angle || 0);
        if (isNaN(rxTheta)) {
          gateSection += `# Warning: Invalid parameter for RX gate, using 0\n`;
          gateSection += `qc.rx(0, ${gate.qubit})\n`;
        } else {
          // Check if value is already in radians (between -2π and 2π) or degrees  
          const rxAngle = coerceAngleToRadians(rxTheta);
          gateSection += `qc.rx(${rxAngle}, ${gate.qubit})\n`;
        }
        break;
      case 'ry':
        // RY gate uses theta parameter (rotation around Y-axis)
        const ryTheta = Number(gate.params?.theta || gate.params?.angle || 0);
        if (isNaN(ryTheta)) {
          gateSection += `# Warning: Invalid parameter for RY gate, using 0\n`;
          gateSection += `qc.ry(0, ${gate.qubit})\n`;
        } else {
          const ryAngle = coerceAngleToRadians(ryTheta);
          gateSection += `qc.ry(${ryAngle}, ${gate.qubit})\n`;
        }
        break;
      case 'rz':
        // RZ gate uses phi parameter (rotation around Z-axis)
        const rzPhi = Number(gate.params?.phi || gate.params?.theta || gate.params?.angle || 0);
        if (isNaN(rzPhi)) {
          gateSection += `# Warning: Invalid parameter for RZ gate, using 0\n`;
          gateSection += `qc.rz(0, ${gate.qubit})\n`;
        } else {
          const rzAngle = coerceAngleToRadians(rzPhi);
          gateSection += `qc.rz(${rzAngle}, ${gate.qubit})\n`;
        }
        break;
      case 'p':
        // Phase gate uses phi parameter
        const phasePhi = Number(gate.params?.phi || gate.params?.phase || 0);
        if (isNaN(phasePhi)) {
          gateSection += `# Warning: Invalid parameter for P gate, using 0\n`;
          gateSection += `qc.p(0, ${gate.qubit})\n`;
        } else {
          const phaseAngle = coerceAngleToRadians(phasePhi);
          const targetQubit = gate.qubit ?? (gate.targets && gate.targets.length > 0 ? gate.targets[0] : undefined);

          if (gate.controls && gate.controls.length > 0) {
            if (targetQubit === undefined) {
              gateSection += `# Warning: Controlled-P gate missing target qubit\n`;
            } else if (gate.controls.length === 1) {
              gateSection += `qc.cp(${phaseAngle}, ${gate.controls[0]}, ${targetQubit})\n`;
            } else {
              gateSection += `qc.mcp(${phaseAngle}, [${gate.controls.join(', ')}], ${targetQubit})\n`;
            }
          } else if (targetQubit === undefined) {
            gateSection += `# Warning: P gate missing target qubit\n`;
          } else {
            gateSection += `qc.p(${phaseAngle}, ${targetQubit})\n`;
          }
        }
        break;
      case 'cnot':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cx(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cx(${gate.qubit}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: CNOT gate missing control or target qubit\n`;
        }
        break;
      case 'cz':
        if (gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cz(${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.cz(${gate.qubit}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: CZ gate missing control or target qubit\n`;
        }
        break;
      case 'swap':
        if (gate.targets && gate.targets.length >= 2) {
          gateSection += `qc.swap(${gate.targets[0]}, ${gate.targets[1]})\n`;
        } else if (gate.qubit !== undefined && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.swap(${gate.qubit}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: SWAP gate needs two qubits\n`;
        }
        break;
      case 'toffoli':
        if (gate.controls && gate.controls.length >= 2 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.ccx(${gate.controls[0]}, ${gate.controls[1]}, ${gate.targets[0]})\n`;
        } else if (gate.qubit !== undefined && gate.controls && gate.controls.length > 0 && gate.targets && gate.targets.length > 0) {
          gateSection += `qc.ccx(${gate.qubit}, ${gate.controls[0]}, ${gate.targets[0]})\n`;
        } else {
          gateSection += `# Warning: Toffoli gate needs 2 control qubits and 1 target qubit\n`;
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
    measurementSection += `qc.measure(${qubit.id}, ${qubit.id})\n`;
  });
  
  return measurementSection + '\n';
}

/**
 * Generate the advanced optimization section of the code
 */
function generateAdvancedOptimizationSection(optimizationOptions: Partial<OptimizationOptions>): string {
  const options = { ...defaultOptimizationOptions, ...optimizationOptions };
  const requestedLevel = options.advancedOptions?.synthesisLevel ?? 1;
  const optimizationLevel = Math.min(3, Math.max(0, requestedLevel));
  
  let optimizationSection = '# Apply advanced circuit optimizations\n';
  optimizationSection += `optimization_level = ${optimizationLevel}\n`;
  optimizationSection += '# Use Qiskit preset pass manager for stability across versions\n';
  optimizationSection += 'pass_manager = generate_preset_pass_manager(optimization_level=optimization_level)\n';
  optimizationSection += 'optimized_qc = pass_manager.run(qc)\n';

  if (options.advancedOptions?.depthReduction) {
    optimizationSection += `# Note: maxDepth=${options.advancedOptions.maxDepth ?? 'unset'} is advisory; preset passes do not enforce hard depth caps.\n`;
  }

  if (options.advancedOptions?.noiseAware) {
    const hardwareModelName = options.advancedOptions.hardwareModel || 'linear';
    if (hardwareModels[hardwareModelName]) {
      optimizationSection += `# Note: noise-aware optimization is approximated; consider calibrating to ${hardwareModels[hardwareModelName].name}.\n`;
    }
  }
  optimizationSection += '\n# Print circuit statistics before and after optimization\n';
  optimizationSection += 'print(f"Original circuit depth: {qc.depth()}")\n';
  optimizationSection += 'print(f"Original circuit gates: {len(qc.data)}")\n';
  optimizationSection += 'print(f"Optimized circuit depth: {optimized_qc.depth()}")\n';
  optimizationSection += 'print(f"Optimized circuit gates: {len(optimized_qc.data)}")\n\n';
  
  // Use the optimized circuit
  optimizationSection += '# Use the optimized circuit for execution\n';
  optimizationSection += 'qc = optimized_qc\n\n';
  
  return optimizationSection;
}

/**
 * Generate the transpilation section of the code
 */
function generateTranspilationSection(options: OptimizationOptions): string {
  let simulationSection = '# Transpile the circuit for the target backend\n';
  simulationSection += `backend_name = '${options.backendName || 'qasm_simulator'}'\n`;
  simulationSection += 'try:\n';
  simulationSection += '    backend = Aer.get_backend(backend_name)\n';
  simulationSection += 'except Exception:\n';
  simulationSection += '    backend = AerSimulator()\n';

  const requestedLevel = options.advancedOptions?.synthesisLevel;
  const optimizationLevel = typeof requestedLevel === 'number'
    ? Math.min(3, Math.max(0, requestedLevel))
    : (options.enableAdvancedOptimization ? 3 : 2);
  simulationSection += `transpiled_qc = transpile(qc, backend=backend, optimization_level=${optimizationLevel})\n\n`;

  // Add a comment about what transpiling does
  simulationSection += '# Note: transpiling optimizes the circuit for the specific backend\n';
  simulationSection += '# It can reduce gate count and circuit depth\n\n';

  // Switch to using the transpiled circuit
  simulationSection += '# Run the simulation using the transpiled circuit\n';
  simulationSection += 'job = backend.run(transpiled_qc, shots=1024)\n';
  simulationSection += 'result = job.result()\n';

  // Get counts from the result
  simulationSection += 'counts = result.get_counts()\n';
  simulationSection += 'print("Measurement results:", counts)\n\n';

  return simulationSection;
}

/**
 * Generate the simulation section of the code
 */
function generateSimulationSection(): string {
  let simulationSection = '# Run the simulation\n';
  simulationSection += 'simulator = AerSimulator()\n';
  simulationSection += 'job = simulator.run(qc, shots=1024)\n';
  simulationSection += 'result = job.result()\n';
  simulationSection += 'counts = result.get_counts()\n';
  simulationSection += 'print("Measurement results:", counts)\n\n';

  return simulationSection;
}

/**
 * Generate the visualization section of the code
 */
function generateVisualizationSection(optimize: boolean, options: OptimizationOptions): string {
  let visualizationSection = '# Draw the circuit\n';
  
  if (optimize && options.transpileToBackend) {
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
  
  return visualizationSection;
}
