import { Qubit } from "../types/circuit";

export interface CircuitStats {
  gateCount: number;
  depth: number;
  twoQubitGates: number;
  entangledQubits: number;
  entangledPairs: number;
  entanglementRatio: number; // 0..1 fraction of qubits involved in entangling gates
  complexityScore: number; // 0..100
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type GateLike = {
  qubit?: number;
  position?: number;
  targets?: number[];
  controls?: number[];
};

export function calculateCircuitStats(
  circuit: { qubits: Qubit[]; gates: GateLike[] } & Record<string, any>
): CircuitStats {
  const numQubits = Math.max(1, (circuit.qubits || []).length);
  const gates = (circuit.gates || []) as GateLike[];

  const gateCount = gates.length;

  // Circuit depth: highest position + 1 (positions assumed zero-based)
  const maxPos =
    gates.length > 0
      ? Math.max(
          ...gates.map((g) => (typeof g.position === "number" ? g.position : 0))
        )
      : 0;
  const depth = maxPos + 1;

  // Build graph of multi-qubit interactions
  const pairSet = new Set<string>();
  const engagedQubits = new Set<number>();
  let twoQubitGates = 0;

  gates.forEach((g: GateLike) => {
    const src = typeof g.qubit === "number" ? g.qubit : undefined;

    const targets = g.targets && g.targets.length > 0 ? g.targets : [];
    const controls = g.controls && g.controls.length > 0 ? g.controls : [];

    const multi = targets.length + controls.length;

    if (multi > 0 && typeof src === "number") {
      // Count as a multi-qubit gate
      twoQubitGates += 1;
      // Add edges between src and each target/control
      [...targets, ...controls].forEach((t) => {
        const a = Math.min(src, t);
        const b = Math.max(src, t);
        pairSet.add(`${a}-${b}`);
        engagedQubits.add(a);
        engagedQubits.add(b);
      });
    } else if (multi > 0 && typeof src === "undefined") {
      // Gate lists only targets/controls (rare) — connect all pairs among them
      twoQubitGates += 1;
      const nodes = [...targets, ...controls];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = Math.min(nodes[i], nodes[j]);
          const b = Math.max(nodes[i], nodes[j]);
          pairSet.add(`${a}-${b}`);
          engagedQubits.add(a);
          engagedQubits.add(b);
        }
      }
    }
  });

  const entangledPairs = pairSet.size;
  const entangledQubits = engagedQubits.size;
  const entanglementRatio = numQubits > 0 ? entangledQubits / numQubits : 0;

  // Heuristic normalization for complexity scoring
  // gateNorm: relative to typical upper bound (numQubits * 8)
  const gateNorm = clamp01(gateCount / Math.max(1, numQubits * 8));
  // depthNorm: relative to a soft upper bound (20)
  const depthNorm = clamp01(depth / 20);
  const entNorm = clamp01(entanglementRatio);

  const complexity = clamp01(0.4 * gateNorm + 0.3 * depthNorm + 0.3 * entNorm);
  const complexityScore = Math.round(complexity * 100);

  return {
    gateCount,
    depth,
    twoQubitGates,
    entangledQubits,
    entangledPairs,
    entanglementRatio,
    complexityScore,
  };
}

export default calculateCircuitStats;
