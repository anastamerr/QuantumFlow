import { Gate, Qubit } from '../../../types/circuit';
import { validateCircuitInput, prepareGatesForCodeGeneration } from './codeGeneratorUtils';


const DEFAULT_OPT_OPTIONS: any = {
  transpileToBackend: false,
  enableAdvancedOptimization: false,
  // add other options if they exist
};

export const generateQasmCode = (
  qubits: Qubit[],
  gates: Gate[],
  optimize: boolean = false,
  optimizationOptions: any = {}
): string => {

  // Validate circuit
  if (!validateCircuitInput(qubits, gates)) {
    return '// Empty circuit - add gates to generate QASM';
  }

  // Prepare gates (same pipeline as Qiskit generator)
  const { processedGates } = prepareGatesForCodeGeneration(
    qubits, gates, optimize, optimizationOptions, DEFAULT_OPT_OPTIONS
  );

  let code = '';
  code += '// Generated OpenQASM 2.0 code\n';
  code += 'OPENQASM 2.0;\n';
  code += 'include "qelib1.inc";\n\n';

  // Declare qubit + classical registers
  code += `qreg q[${qubits.length}];\n`;
  code += `creg c[${qubits.length}];\n\n`;

  // Insert gate operations
  code += generateQasmGateSection(processedGates);

  // Auto-add measurement if needed
  code += generateQasmMeasurementSection(processedGates, qubits);

  return code;
};

/* --------------------------
   Gate generation
---------------------------*/

function generateQasmGateSection(gates: Gate[]): string {
  let qasm = '// Gates\n';

  gates.forEach(gate => {
    switch (gate.type) {
      case 'h':
      case 'x':
      case 'y':
      case 'z':
      case 's':
      case 't':
        qasm += `${gate.type} q[${gate.qubit}];\n`;
        break;

      case 'rx': {
        const theta = normalizeAngle(gate.params?.theta ?? gate.params?.angle ?? 0);
        qasm += `rx(${theta}) q[${gate.qubit}];\n`;
        break;
      }

      case 'ry': {
        const theta = normalizeAngle(gate.params?.theta ?? gate.params?.angle ?? 0);
        qasm += `ry(${theta}) q[${gate.qubit}];\n`;
        break;
      }

      case 'rz': {
        const phi = normalizeAngle(gate.params?.phi ?? gate.params?.theta ?? gate.params?.angle ?? 0);
        qasm += `rz(${phi}) q[${gate.qubit}];\n`;
        break;
      }

      case 'p': {
        const phi = normalizeAngle(gate.params?.phi ?? gate.params?.phase ?? 0);
        qasm += `p(${phi}) q[${gate.qubit}];\n`;
        break;
      }

      case 'cnot':
      case 'cx': {
        if (gate.controls?.length && gate.targets?.length)
          qasm += `cx q[${gate.controls[0]}], q[${gate.targets[0]}];\n`;
        else
          qasm += `// Invalid CNOT gate\n`;
        break;
      }

      case 'cz': {
        if (gate.controls?.length && gate.targets?.length)
          qasm += `cz q[${gate.controls[0]}], q[${gate.targets[0]}];\n`;
        else
          qasm += `// Invalid CZ gate\n`;
        break;
      }

      case 'swap': {
        if (gate.targets?.length >= 2)
          qasm += `swap q[${gate.targets[0]}], q[${gate.targets[1]}];\n`;
        else
          qasm += `// SWAP requires 2 targets\n`;
        break;
      }

      case 'toffoli':
      case 'ccx': {
        if (gate.controls?.length >= 2 && gate.targets?.length === 1) {
          qasm += `ccx q[${gate.controls[0]}], q[${gate.controls[1]}], q[${gate.targets[0]}];\n`;
        } else {
          qasm += `// Invalid Toffoli (needs 2 controls, 1 target)\n`;
        }
        break;
      }

      case 'measure':
        qasm += `measure q[${gate.qubit}] -> c[${gate.qubit}];\n`;
        break;

      default:
        qasm += `// Unsupported gate: ${gate.type}\n`;
    }
  });

  return qasm + '\n';
}

/* --------------------------
   Measurement
---------------------------*/

function generateQasmMeasurementSection(gates: Gate[], qubits: Qubit[]): string {
  if (gates.some(g => g.type === 'measure')) return '';

  let qasm = '// Measure all qubits\n';
  qubits.forEach(q => {
    qasm += `measure q[${q.id}] -> c[${q.id}];\n`;
  });

  return qasm + '\n';
}

/* --------------------------
   Helpers
---------------------------*/

function normalizeAngle(raw: any): number {
  const v = Number(raw);
  if (isNaN(v)) return 0;

  // If value is small, treat as radians. If large, assume degrees.
  return Math.abs(v) <= 2 * Math.PI ? v : (v * Math.PI / 180);
}
