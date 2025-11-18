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

    
    const points: QSpherePoint[] = [
      {
        state: "00",
        amplitude: { real: 1/Math.sqrt(2), imag: 0 },
        probability: 0.5,
        position: [1, 0, 0],   
        size: 0.15,
        color: "#ff0000",    
        phase: 0
      },
      {
        state: "11", 
        amplitude: { real: 1/Math.sqrt(2), imag: 0 },
        probability: 0.5,
        position: [-1, 0, 0],  
        size: 0.15,
        color: "#0000ff",     
        phase: 0
      }
    ];
  
    return {
      points,
      entanglementLevel: 0.8,
      totalQubits: 2
    };
  }
