// src/utils/mathHelpers.ts

export type Complex = { real: number; imag: number };

export const C = (real: number, imag: number = 0): Complex => ({ real, imag });

export const add = (a: Complex, b: Complex): Complex => ({ 
  real: a.real + b.real, 
  imag: a.imag + b.imag 
});

export const mul = (a: Complex, b: Complex): Complex => ({
  real: a.real * b.real - a.imag * b.imag,
  imag: a.real * b.imag + a.imag * b.real
});

export const mag = (c: Complex): number => Math.sqrt(c.real * c.real + c.imag * c.imag);

// Exponent of imaginary: e^(i*theta) = cos(theta) + i*sin(theta)
export const expImag = (theta: number): Complex => ({
  real: Math.cos(theta),
  imag: Math.sin(theta)
});

// --- MATRIX GENERATION (Single Qubit Only for VCR) ---

// Identity 2x2
const ID_2x2 = [C(1), C(0), C(0), C(1)];
const INV_SQRT_2 = 1 / Math.sqrt(2);

// Fixed Matrices (Flat array [00, 01, 10, 11])
const FIXED_GATES: Record<string, [Complex, Complex, Complex, Complex]> = {
  x: [C(0), C(1), C(1), C(0)],
  y: [C(0), C(0, -1), C(0, 1), C(0)],
  z: [C(1), C(0), C(0), C(-1)],
  h: [C(INV_SQRT_2), C(INV_SQRT_2), C(INV_SQRT_2), C(-INV_SQRT_2)],
  s: [C(1), C(0), C(0), C(0, 1)],
  t: [C(1), C(0), C(0), C(INV_SQRT_2, INV_SQRT_2)], 
};

/**
 * Generates the 2x2 matrix for a specific gate and parameters.
 */
export const getGateMatrix = (type: string, params?: { theta?: string | number; phi?: string | number }) => {
  const t = type.toLowerCase();

  const parseAngle = (val: string | number | undefined) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (!num) return 0;
    return (num * Math.PI) / 180;
  };

  if (FIXED_GATES[t]) return FIXED_GATES[t];

  if (t === 'rx') {
    const theta = parseAngle(params?.theta);
    const cos = Math.cos(theta / 2);
    const sin = Math.sin(theta / 2);
    return [C(cos), C(0, -sin), C(0, -sin), C(cos)];
  }

  if (t === 'ry') {
    const theta = parseAngle(params?.theta);
    const cos = Math.cos(theta / 2);
    const sin = Math.sin(theta / 2);
    return [C(cos), C(-sin), C(sin), C(cos)];
  }

  if (t === 'rz') {
    const phi = parseAngle(params?.phi);
    const halfPhi = phi / 2;
    return [expImag(-halfPhi), C(0), C(0), expImag(halfPhi)];
  }

  if (t === 'p' || t === 'phase') {
    const phi = parseAngle(params?.phi);
    return [C(1), C(0), C(0), expImag(phi)];
  }

  return ID_2x2;
};

export const applyGateMatrix = (matrix: any[], state: [Complex, Complex]): [Complex, Complex] => {
  const [alpha, beta] = state;
  const newAlpha = add(mul(matrix[0], alpha), mul(matrix[1], beta));
  const newBeta  = add(mul(matrix[2], alpha), mul(matrix[3], beta));
  return [newAlpha, newBeta];
};

export const stateToBloch = (alpha: Complex, beta: Complex) => {
  const alpha_conj = { real: alpha.real, imag: -alpha.imag };
  const product = mul(alpha_conj, beta);
  return {
    x: 2 * product.real,
    y: 2 * product.imag,
    z: mag(alpha) ** 2 - mag(beta) ** 2
  };
};