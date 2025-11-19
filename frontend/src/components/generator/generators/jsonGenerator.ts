import { Gate, Qubit } from '../../../types/circuit';

/**
 * Generates a circuit description in JSON format
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @param circuitName Name of the circuit
 * @param circuitDescription Description of the circuit
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