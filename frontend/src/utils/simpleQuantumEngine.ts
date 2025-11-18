import { Gate, Qubit } from '../store/slices/circuitSlice';
import { SimulationStep, BlochVector, QubitStateDetail } from '../store/slices/simulationSlice';

const INITIAL_BLOCH: BlochVector = { x: 0, y: 0, z: 1 };

/**
 * Helper: Converts Bloch coordinates (x,y,z) into Theta, Phi, and Amplitudes
 */
const calculateStateDetails = (id: number, v: BlochVector): QubitStateDetail => {
  // 1. Calculate Theta (0 to PI)
  // z = cos(theta) -> theta = acos(z)
  // Clamp z to -1...1 to avoid floating point errors causing NaN
  const zClamped = Math.max(-1, Math.min(1, v.z));
  const theta = Math.acos(zClamped);

  // 2. Calculate Phi (0 to 2PI)
  // x = sin(theta)cos(phi), y = sin(theta)sin(phi)
  // atan2 handles the quadrants correctly
  let phi = Math.atan2(v.y, v.x);
  if (phi < 0) phi += 2 * Math.PI; // Normalize to 0...2PI
  
  // Handle the North/South pole edge cases where phi is undefined
  if (Math.abs(zClamped) > 0.99) phi = 0;

  // 3. Calculate Complex Amplitudes (alpha, beta)
  // state = cos(theta/2)|0> + e^(i*phi)sin(theta/2)|1>
  const alpha = Math.cos(theta / 2);
  const betaMag = Math.sin(theta / 2);
  
  // Beta is complex: betaMag * (cos(phi) + i*sin(phi))
  const betaRe = betaMag * Math.cos(phi);
  const betaIm = betaMag * Math.sin(phi);

  // Format the complex string nicely
  const formatComplex = (re: number, im: number) => {
    if (Math.abs(im) < 0.01) return `${re.toFixed(2)}`;
    const sign = im >= 0 ? '+' : '-';
    return `${re.toFixed(2)} ${sign} ${Math.abs(im).toFixed(2)}i`;
  };

  // Construct string: "a|0> + b|1>"
  // We check if magnitude is significant to avoid clutter
  let complexStr = "";
  if (Math.abs(alpha) > 0.01) complexStr += `${alpha.toFixed(2)}|0⟩`;
  
  if (betaMag > 0.01) {
    if (complexStr !== "") complexStr += " + ";
    // Wrap beta in parens if it has imaginary part
    const betaStr = formatComplex(betaRe, betaIm);
    const needsParens = Math.abs(betaIm) > 0.01;
    complexStr += needsParens ? `(${betaStr})|1⟩` : `${betaStr}|1⟩`;
  }

  // 4. Vector Text (simplified label)
  let vectorText = "Superposition";
  if (v.z > 0.99) vectorText = "|0⟩";
  else if (v.z < -0.99) vectorText = "|1⟩";
  else if (v.x > 0.99) vectorText = "|+⟩";
  else if (v.x < -0.99) vectorText = "|-⟩";

  return {
    qubitId: id,
    bloch: v,
    vectorText,
    theta,
    phi,
    complexStr
  };
};

export const calculateSimulationHistory = (
  qubits: Qubit[],
  gates: Gate[],
): SimulationStep[] => {
  
  const history: SimulationStep[] = [];
  
  const lastGatePos = gates.length > 0 ? Math.max(...gates.map(g => g.position)) : 0;
  const totalSteps = lastGatePos + 2;

  // Initialize states
  let currentBlochStates: Record<number, BlochVector> = {};
  qubits.forEach(q => { currentBlochStates[q.id] = { ...INITIAL_BLOCH }; });

  for (let step = 0; step < totalSteps; step++) {
    const stepGates = gates.filter(g => g.position === step - 1);
    const stepDetails: QubitStateDetail[] = [];

    qubits.forEach(q => {
      let vector = { ...currentBlochStates[q.id] };
      const gate = stepGates.find(g => g.qubit === q.id);

      if (gate) {
        switch (gate.type.toLowerCase()) {
          case 'x': vector.z = -vector.z; vector.y = -vector.y; break;
          case 'y': vector.z = -vector.z; vector.x = -vector.x; break;
          case 'z': vector.x = -vector.x; vector.y = -vector.y; break;
          case 'h': 
            const oldZ = vector.z; const oldX = vector.x;
            vector.z = oldX; vector.x = oldZ; vector.y = -vector.y;
            break;
          case 's': 
             const sX = vector.x; vector.x = -vector.y; vector.y = sX; 
             break;
          case 't': 
             // T is 45 deg around Z
             // Rotation matrix on (x,y)
             const tCos = Math.cos(Math.PI/4);
             const tSin = Math.sin(Math.PI/4);
             const tX = vector.x * tCos - vector.y * tSin;
             const tY = vector.x * tSin + vector.y * tCos;
             vector.x = tX;
             vector.y = tY;
             break;
        }
      }

      currentBlochStates[q.id] = vector;
      
      // CALCULATE ALL THE NEW PHYSICS VALUES
      stepDetails.push(calculateStateDetails(q.id, vector));
    });

    history.push({
      step: step,
      description: step === 0 ? "Initial" : `Step ${step}`,
      qubitStates: stepDetails // Use the new detailed array
    });
  }

  return history;
};