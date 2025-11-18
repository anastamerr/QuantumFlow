// file: src/utils/generators/qasmGenerator.ts
import { Gate, Qubit } from '../../../types/circuit';
import { validateCircuitInput, prepareGatesForCodeGeneration } from './codeGeneratorUtils';

const DEFAULT_OPT_OPTIONS: any = {
  transpileToBackend: false,
  enableAdvancedOptimization: false,
};

/**
 * Safely convert value to number (handles strings like "0", "q0", etc.)
 */
function toQubitIndex(v: any): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // strip non-digits like 'q' or 'Q'
    const parsed = v.toString().replace(/[^\d-]/g, '');
    const n = Number(parsed);
    return isNaN(n) ? 0 : n;
  }
  return Number(v) || 0;
}

/**
 * Normalize angle: if big assume degrees -> convert to radians
 */
function normalizeAngle(raw: any): number {
  const v = Number(raw);
  if (isNaN(v)) return 0;
  return Math.abs(v) <= 2 * Math.PI ? v : (v * Math.PI / 180);
}

/**
 * Build a canonical list of involved qubit indices for a gate.
 * Returns unique numeric indices.
 */
function involvedQubits(g: Gate): number[] {
  const list: number[] = [];
  if (g.qubit !== undefined) list.push(toQubitIndex(g.qubit));
  if (g.targets?.length) g.targets.forEach(t => list.push(toQubitIndex(t)));
  if (g.controls?.length) g.controls.forEach(c => list.push(toQubitIndex(c)));
  // unique
  return Array.from(new Set(list));
}

/**
 * Build canonical control / target values with sensible fallbacks:
 * - controls: prefer controls array (first entry)
 * - targets: prefer targets array (first entry)
 * - fallback: if gate.qubit present treat it as a single-qubit target or control depending on gate kind
 */
function pickControlTarget(g: Gate) {
  const controls = (g.controls || []).map(toQubitIndex);
  const targets = (g.targets || []).map(toQubitIndex);
  const primary = g.qubit !== undefined ? toQubitIndex(g.qubit) : undefined;
  return { controls, targets, primary };
}

/**
 * Main generator entry
 */
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

  // Prepare gates (shared pipeline with Qiskit generator)
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
    const lowType = (gate.type || '').toLowerCase();

    // ignore non-operational items that some decoders might emit
    if (lowType === 'creg' || lowType === 'draw' || lowType === 'comment') {
      // skip
      return;
    }

    const { controls, targets, primary } = pickControlTarget(gate);
    const involved = involvedQubits(gate);

    // helper to format q[index]
    const qRef = (i: number) => `q[${i}]`;

    switch (lowType) {
      // single-qubit
      case 'h':
      case 'x':
      case 'y':
      case 'z':
      case 's':
      case 't': {
        const idx = primary ?? targets[0] ?? controls[0] ?? (involved[0] ?? 0);
        qasm += `${lowType} ${qRef(idx)};\n`;
        break;
      }

      // rotations: accept theta/angle/phi
      case 'rx': {
        const thetaRaw = gate.params?.theta ?? gate.params?.angle ?? gate.params?.phi ?? 0;
        const theta = normalizeAngle(thetaRaw);
        const idx = primary ?? targets[0] ?? (involved[0] ?? 0);
        qasm += `rx(${theta}) ${qRef(idx)};\n`;
        break;
      }
      case 'ry': {
        const thetaRaw = gate.params?.theta ?? gate.params?.angle ?? gate.params?.phi ?? 0;
        const theta = normalizeAngle(thetaRaw);
        const idx = primary ?? targets[0] ?? (involved[0] ?? 0);
        qasm += `ry(${theta}) ${qRef(idx)};\n`;
        break;
      }
      case 'rz': {
        const phiRaw = gate.params?.phi ?? gate.params?.theta ?? gate.params?.angle ?? 0;
        const phi = normalizeAngle(phiRaw);
        const idx = primary ?? targets[0] ?? (involved[0] ?? 0);
        qasm += `rz(${phi}) ${qRef(idx)};\n`;
        break;
      }
      case 'p': {
        const phiRaw = gate.params?.phi ?? gate.params?.phase ?? 0;
        const phi = normalizeAngle(phiRaw);
        const idx = primary ?? targets[0] ?? (involved[0] ?? 0);
        qasm += `p(${phi}) ${qRef(idx)};\n`;
        break;
      }

      // controlled gates: CNOT / CX
      case 'cnot':
      case 'cx': {
        // prefer explicit controls[0] as control and targets[0] as target
        if (controls.length > 0 && targets.length > 0) {
          qasm += `cx ${qRef(controls[0])}, ${qRef(targets[0])};\n`;
        } else if (controls.length === 0 && targets.length >= 2) {
          // sometimes stored as targets: [control, target]
          qasm += `cx ${qRef(targets[0])}, ${qRef(targets[1])};\n`;
        } else if (primary !== undefined && targets.length > 0) {
          // fallback: primary considered control
          qasm += `cx ${qRef(primary)}, ${qRef(targets[0])};\n`;
        } else {
          qasm += `// Invalid CNOT/CX gate (missing control/target)\n`;
        }
        break;
      }

      case 'cz': {
        if (controls.length > 0 && targets.length > 0) {
          qasm += `cz ${qRef(controls[0])}, ${qRef(targets[0])};\n`;
        } else if (controls.length === 0 && targets.length >= 2) {
          qasm += `cz ${qRef(targets[0])}, ${qRef(targets[1])};\n`;
        } else if (primary !== undefined && targets.length > 0) {
          qasm += `cz ${qRef(primary)}, ${qRef(targets[0])};\n`;
        } else {
          qasm += `// Invalid CZ gate (missing control/target)\n`;
        }
        break;
      }

      case 'swap': {
        if (targets.length >= 2) {
          qasm += `swap ${qRef(targets[0])}, ${qRef(targets[1])};\n`;
        } else if (involved.length >= 2) {
          qasm += `swap ${qRef(involved[0])}, ${qRef(involved[1])};\n`;
        } else if (primary !== undefined && targets.length > 0) {
          qasm += `swap ${qRef(primary)}, ${qRef(targets[0])};\n`;
        } else {
          qasm += `// SWAP requires 2 qubits\n`;
        }
        break;
      }

      case 'toffoli':
      case 'ccx': {
        // need two controls and one target
        if (controls.length >= 2 && targets.length >= 1) {
          qasm += `ccx ${qRef(controls[0])}, ${qRef(controls[1])}, ${qRef(targets[0])};\n`;
        } else if (involved.length >= 3) {
          qasm += `ccx ${qRef(involved[0])}, ${qRef(involved[1])}, ${qRef(involved[2])};\n`;
        } else {
          qasm += `// Invalid Toffoli/CCX gate (needs 2 controls, 1 target)\n`;
        }
        break;
      }

      case 'measure': {
        const idx = primary ?? targets[0] ?? (involved[0] ?? 0);
        qasm += `measure ${qRef(idx)} -> c[${idx}];\n`;
        break;
      }

      default: {
        // unknown gate: if it contains targets single -> emit as single-qubit op,
        // else comment unsupported
        if (involved.length === 1) {
          qasm += `${lowType} ${qRef(involved[0])};\n`;
        } else if (involved.length === 2) {
          qasm += `// Unknown two-qubit gate: ${lowType} on ${qRef(involved[0])}, ${qRef(involved[1])}\n`;
        } else {
          qasm += `// Unsupported gate: ${gate.type}\n`;
        }
      }
    }
  });

  return qasm + '\n';
}

/* --------------------------
   Measurement
---------------------------*/

function generateQasmMeasurementSection(gates: Gate[], qubits: Qubit[]): string {
  if (gates.some(g => (g.type || '').toLowerCase() === 'measure')) return '';

  let qasm = '// Measure all qubits\n';
  qubits.forEach(q => {
    qasm += `measure q[${q.id}] -> c[${q.id}];\n`;
  });

  return qasm + '\n';
}
