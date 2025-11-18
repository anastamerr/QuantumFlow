// src/utils/qSphereCalculations.ts
export interface Complex {
  real: number;
  imag: number;
}

export interface QSpherePoint {
  state: string;
  amplitude: Complex;
  probability: number;
  position: [number, number, number];
  size: number;
  color: string;
  phase: number;
}

export interface QSphereData {
  points: QSpherePoint[];
  entanglementLevel: number;
  totalQubits: number;
}

export function convertToQSphereData(
  stateVector: { [basisState: string]: Complex } | Complex[],
  numQubits?: number
): QSphereData {
  // For now, return a Bell state visualization
  // This will be replaced with real calculations tomorrow
  const points: QSpherePoint[] = [
    {
      state: "00",
      amplitude: { real: 1/Math.sqrt(2), imag: 0 },
      probability: 0.5,
      position: [0, 0, 1],  // Position on sphere
      size: 0.15,
      color: "#ff0000",     // Red
      phase: 0
    },
    {
      state: "11", 
      amplitude: { real: 1/Math.sqrt(2), imag: 0 },
      probability: 0.5,
      position: [-1, 0, 0], // Opposite side
      size: 0.15,
      color: "#0000ff",     // Blue
      phase: 0
    }
  ];

  return {
    points,
    entanglementLevel: 0.8, // High entanglement for Bell state
    totalQubits: 2
  };
}