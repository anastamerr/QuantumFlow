// frontend/src/utils/qmlLessons.ts

export type GateParamMap = Record<string, number>;

export interface LessonGate {
  id: string;
  gateType: string;        // must match gateLibrary gate id, e.g. "RY", "RZ", "CNOT"
  targets: number[];       // qubit indices
  controls: number[];      // control qubit indices (if any)
  params?: GateParamMap;   // e.g. { theta: 0.785 }
  column: number;          // time step
}

export interface LessonStep {
  stepNumber: number;
  title: string;
  instruction: string;
  hint: string;
  expectedGate: LessonGate;
  educationalNote: string;
  whyItMatters: string;
}

export interface LessonCircuit {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  numQubits: number;
  gates: LessonGate[];
  steps: LessonStep[];
  learningObjectives: string[];
  prerequisites: string[];
  estimatedTime: string;
}

export const QML_LESSONS: LessonCircuit[] = [
  // === Lesson 1: Beginner ===
  {
    id: "lesson1_sel_2qubit",
    title: "Lesson 1 – 2-Qubit SEL Block",
    description: "Single strongly-entangling layer on 2 qubits: local RY rotations followed by a CNOT.",
    difficulty: "beginner",
    numQubits: 2,
    estimatedTime: "10 minutes",
    prerequisites: ["Understanding of qubits", "Basic gate operations"],
    learningObjectives: [
      "Learn about rotation gates (RY)",
      "Understand quantum entanglement with CNOT",
      "Build your first strongly-entangling layer"
    ],
    gates: [
      {
        id: "g1",
        gateType: "RY",
        targets: [0],
        controls: [],
        params: { theta: 1.571 },
        column: 0
      },
      {
        id: "g2",
        gateType: "RY",
        targets: [1],
        controls: [],
        params: { theta: 1.571 },
        column: 0
      },
      {
        id: "g3",
        gateType: "CNOT",
        targets: [1],
        controls: [0],
        params: {},
        column: 1
      },
      {
        id: "m0",
        gateType: "MEASURE",
        targets: [0],
        controls: [],
        params: {},
        column: 2
      },
      {
        id: "m1",
        gateType: "MEASURE",
        targets: [1],
        controls: [],
        params: {},
        column: 2
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Add RY Gate to Qubit 0",
        instruction: "Let's start by adding an RY rotation gate to qubit 0 with angle π/2 (1.571 radians)",
        hint: "Look for the RY gate in the gate palette. Drag it to qubit 0 at column 0. Set theta parameter to 1.571",
        expectedGate: {
          id: "g1",
          gateType: "RY",
          targets: [0],
          controls: [],
          params: { theta: 1.571 },
          column: 0
        },
        educationalNote: "🎓 The RY gate rotates a qubit around the Y-axis of the Bloch sphere. At π/2, it creates a superposition state!",
        whyItMatters: "Rotation gates are fundamental for encoding information in quantum circuits. They're like the building blocks of quantum algorithms."
      },
      {
        stepNumber: 2,
        title: "Add RY Gate to Qubit 1",
        instruction: "Now add another RY gate to qubit 1, also with angle π/2 (1.571 radians)",
        hint: "Same as step 1, but place it on qubit 1. Both gates should be in the same column (0)",
        expectedGate: {
          id: "g2",
          gateType: "RY",
          targets: [1],
          controls: [],
          params: { theta: 1.571 },
          column: 0
        },
        educationalNote: "💡 By applying the same rotation to both qubits, we're preparing them in similar states before entangling them.",
        whyItMatters: "Parallel operations on multiple qubits showcase quantum parallelism - a key advantage of quantum computing!"
      },
      {
        stepNumber: 3,
        title: "Create Entanglement with CNOT",
        instruction: "Add a CNOT gate with qubit 0 as control and qubit 1 as target",
        hint: "The CNOT gate needs both a control qubit (0) and target qubit (1). Place it in column 1",
        expectedGate: {
          id: "g3",
          gateType: "CNOT",
          targets: [1],
          controls: [0],
          params: {},
          column: 1
        },
        educationalNote: "🔗 The CNOT gate creates quantum entanglement - a correlation between qubits that has no classical equivalent!",
        whyItMatters: "Entanglement is what makes quantum computers powerful. It allows qubits to be correlated in ways classical bits cannot be."
      },
      {
        stepNumber: 4,
        title: "Measure Qubit 0",
        instruction: "Add a measurement operation to qubit 0",
        hint: "Measurement gates extract classical information from quantum states. Place it in column 2",
        expectedGate: {
          id: "m0",
          gateType: "MEASURE",
          targets: [0],
          controls: [],
          params: {},
          column: 2
        },
        educationalNote: "📊 Measurement collapses the quantum state into a classical 0 or 1. Once measured, the quantum information is lost!",
        whyItMatters: "Measurement is how we read out results from a quantum computer. It's the bridge between quantum and classical."
      },
      {
        stepNumber: 5,
        title: "Measure Qubit 1",
        instruction: "Add a measurement operation to qubit 1",
        hint: "Place the measurement in the same column (2) as the previous measurement",
        expectedGate: {
          id: "m1",
          gateType: "MEASURE",
          targets: [1],
          controls: [],
          params: {},
          column: 2
        },
        educationalNote: "🎉 Because of entanglement, measuring one qubit affects the other! They're correlated.",
        whyItMatters: "You've just built a strongly-entangling layer - the foundation of many quantum machine learning models!"
      }
    ]
  },

  // === Lesson 2: Intermediate ===
  {
    id: "lesson2_sel_3qubit_chain",
    title: "Lesson 2 – 3-Qubit SEL Chain",
    description: "Strongly-entangling layer on 3 qubits with a chain of CNOTs.",
    difficulty: "intermediate",
    numQubits: 3,
    estimatedTime: "15 minutes",
    prerequisites: ["Completed Lesson 1", "Understanding of CNOT gates", "Rotation gates (RY, RZ)"],
    learningObjectives: [
      "Chain multiple entangling operations",
      "Use both RY and RZ rotations",
      "Understand circuit depth and layering"
    ],
    gates: [
      {
        id: "g1",
        gateType: "RY",
        targets: [0],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g2",
        gateType: "RY",
        targets: [1],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g3",
        gateType: "RY",
        targets: [2],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g4",
        gateType: "CNOT",
        targets: [1],
        controls: [0],
        params: {},
        column: 1
      },
      {
        id: "g5",
        gateType: "CNOT",
        targets: [2],
        controls: [1],
        params: {},
        column: 2
      },
      {
        id: "g6",
        gateType: "RZ",
        targets: [0],
        controls: [],
        params: { phi: 1.571 },
        column: 3
      },
      {
        id: "g7",
        gateType: "RZ",
        targets: [1],
        controls: [],
        params: { phi: 1.571 },
        column: 3
      },
      {
        id: "g8",
        gateType: "RZ",
        targets: [2],
        controls: [],
        params: { phi: 1.571 },
        column: 3
      },
      {
        id: "m0",
        gateType: "MEASURE",
        targets: [0],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m1",
        gateType: "MEASURE",
        targets: [1],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m2",
        gateType: "MEASURE",
        targets: [2],
        controls: [],
        params: {},
        column: 4
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Initialize with RY Rotations",
        instruction: "Add RY gates to all 3 qubits with angle π/4 (0.785 radians)",
        hint: "Add three RY gates in column 0, one for each qubit (0, 1, 2), all with theta=0.785",
        expectedGate: {
          id: "g1",
          gateType: "RY",
          targets: [0],
          controls: [],
          params: { theta: 0.785 },
          column: 0
        },
        educationalNote: "🎓 Using π/4 rotation creates a different superposition than π/2. Different angles encode different information!",
        whyItMatters: "In QML, these rotation angles are often the trainable parameters that the algorithm optimizes."
      },
      {
        stepNumber: 2,
        title: "First Entangling Operation",
        instruction: "Add a CNOT from qubit 0 (control) to qubit 1 (target)",
        hint: "Place the CNOT in column 1 connecting qubits 0 and 1",
        expectedGate: {
          id: "g4",
          gateType: "CNOT",
          targets: [1],
          controls: [0],
          params: {},
          column: 1
        },
        educationalNote: "🔗 This begins our entanglement chain. Qubit 0 now influences qubit 1!",
        whyItMatters: "Chaining entanglement operations spreads correlations across multiple qubits."
      },
      {
        stepNumber: 3,
        title: "Second Entangling Operation",
        instruction: "Add a CNOT from qubit 1 (control) to qubit 2 (target)",
        hint: "Place this CNOT in column 2. Notice how we're creating a chain: 0→1→2",
        expectedGate: {
          id: "g5",
          gateType: "CNOT",
          targets: [2],
          controls: [1],
          params: {},
          column: 2
        },
        educationalNote: "⛓️ Now all three qubits are entangled! The chain creates long-range correlations.",
        whyItMatters: "This chain topology is common in QML - it creates global entanglement efficiently."
      },
      {
        stepNumber: 4,
        title: "Add RZ Phase Rotations",
        instruction: "Add RZ gates to all 3 qubits with angle π/2 (1.571 radians)",
        hint: "Add three RZ gates in column 3, one for each qubit, all with phi=1.571",
        expectedGate: {
          id: "g6",
          gateType: "RZ",
          targets: [0],
          controls: [],
          params: { phi: 1.571 },
          column: 3
        },
        educationalNote: "🎭 RZ gates add phase information without changing the measurement probabilities in the Z-basis!",
        whyItMatters: "Phase rotations are crucial for interference effects in quantum algorithms. They're subtle but powerful!"
      },
      {
        stepNumber: 5,
        title: "Measure All Qubits",
        instruction: "Add measurement gates to all 3 qubits",
        hint: "Add three MEASURE gates in column 4",
        expectedGate: {
          id: "m0",
          gateType: "MEASURE",
          targets: [0],
          controls: [],
          params: {},
          column: 4
        },
        educationalNote: "🎉 You've built a 3-qubit strongly-entangling layer with richer expressivity than 2 qubits!",
        whyItMatters: "More qubits mean exponentially larger state space - this is where quantum advantage begins!"
      }
    ]
  },

  // === Lesson 3: Intermediate ===
  {
    id: "lesson3_mini_mera_4qubit",
    title: "Lesson 3 – Mini 4-Qubit MERA",
    description: "Two local entanglers (0–1 and 2–3) followed by a middle entangler (1–2), MERA-style.",
    difficulty: "intermediate",
    numQubits: 4,
    estimatedTime: "20 minutes",
    prerequisites: ["Completed Lesson 2", "Understanding of entanglement patterns"],
    learningObjectives: [
      "Learn MERA (Multi-scale Entanglement Renormalization Ansatz) structure",
      "Understand parallel vs sequential entanglement",
      "Build hierarchical quantum circuits"
    ],
    gates: [
      {
        id: "g1",
        gateType: "RY",
        targets: [0],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g2",
        gateType: "RY",
        targets: [1],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g3",
        gateType: "RY",
        targets: [2],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g4",
        gateType: "RY",
        targets: [3],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g5",
        gateType: "CNOT",
        targets: [1],
        controls: [0],
        params: {},
        column: 1
      },
      {
        id: "g6",
        gateType: "CNOT",
        targets: [3],
        controls: [2],
        params: {},
        column: 1
      },
      {
        id: "g7",
        gateType: "RY",
        targets: [1],
        controls: [],
        params: { theta: 0.785 },
        column: 2
      },
      {
        id: "g8",
        gateType: "RY",
        targets: [2],
        controls: [],
        params: { theta: 0.785 },
        column: 2
      },
      {
        id: "g9",
        gateType: "CNOT",
        targets: [2],
        controls: [1],
        params: {},
        column: 3
      },
      {
        id: "m0",
        gateType: "MEASURE",
        targets: [0],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m1",
        gateType: "MEASURE",
        targets: [1],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m2",
        gateType: "MEASURE",
        targets: [2],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m3",
        gateType: "MEASURE",
        targets: [3],
        controls: [],
        params: {},
        column: 4
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Initialize All 4 Qubits",
        instruction: "Add RY gates to all 4 qubits with angle 0.785",
        hint: "Place four RY gates in column 0, one on each qubit",
        expectedGate: {
          id: "g1",
          gateType: "RY",
          targets: [0],
          controls: [],
          params: { theta: 0.785 },
          column: 0
        },
        educationalNote: "🎓 MERA circuits start with local preparations on all qubits simultaneously.",
        whyItMatters: "This parallel structure exploits quantum parallelism - all qubits are prepared at once!"
      },
      {
        stepNumber: 2,
        title: "Create Local Entanglement Pairs",
        instruction: "Add two CNOT gates in parallel: 0→1 and 2→3",
        hint: "Both CNOTs go in column 1. First: control=0, target=1. Second: control=2, target=3",
        expectedGate: {
          id: "g5",
          gateType: "CNOT",
          targets: [1],
          controls: [0],
          params: {},
          column: 1
        },
        educationalNote: "⚡ Parallel operations! These CNOTs happen simultaneously, entangling local pairs.",
        whyItMatters: "MERA's power comes from this hierarchical structure: local entanglement first, then global."
      },
      {
        stepNumber: 3,
        title: "Rotate Middle Qubits",
        instruction: "Add RY gates to qubits 1 and 2 (the middle qubits)",
        hint: "Place RY gates on qubits 1 and 2 in column 2, both with theta=0.785",
        expectedGate: {
          id: "g7",
          gateType: "RY",
          targets: [1],
          controls: [],
          params: { theta: 0.785 },
          column: 2
        },
        educationalNote: "🔄 After local entanglement, we rotate the middle qubits to prepare for global entanglement.",
        whyItMatters: "This intermediate layer is key to MERA - it creates a bridge between local and global structure."
      },
      {
        stepNumber: 4,
        title: "Create Global Entanglement",
        instruction: "Add a CNOT from qubit 1 to qubit 2",
        hint: "Place CNOT in column 3 with control=1 and target=2",
        expectedGate: {
          id: "g9",
          gateType: "CNOT",
          targets: [2],
          controls: [1],
          params: {},
          column: 3
        },
        educationalNote: "🌐 This central entangler connects the two halves, creating global correlations!",
        whyItMatters: "Now all 4 qubits are interconnected through this hierarchical structure - that's MERA!"
      },
      {
        stepNumber: 5,
        title: "Measure All Qubits",
        instruction: "Add measurements to all 4 qubits",
        hint: "Add four MEASURE gates in column 4",
        expectedGate: {
          id: "m0",
          gateType: "MEASURE",
          targets: [0],
          controls: [],
          params: {},
          column: 4
        },
        educationalNote: "🎉 You've built a MERA-inspired circuit! This structure is used in quantum machine learning and many-body physics.",
        whyItMatters: "MERA circuits can efficiently represent certain quantum states that would require exponentially many classical bits!"
      }
    ]
  },

  // === Lesson 4: Advanced ===
  {
    id: "lesson4_data_encoding_sel_3qubit",
    title: "Lesson 4 – Data Encoding + SEL",
    description: "RZ data-encoding layer followed by a strongly-entangling layer on 3 qubits.",
    difficulty: "advanced",
    numQubits: 3,
    estimatedTime: "20 minutes",
    prerequisites: ["Completed Lessons 1-3", "Understanding of data encoding in QML"],
    learningObjectives: [
      "Learn to encode classical data into quantum states",
      "Understand the role of encoding in quantum machine learning",
      "Combine data encoding with variational layers"
    ],
    gates: [
      {
        id: "g1",
        gateType: "RZ",
        targets: [0],
        controls: [],
        params: { phi: 0.314 },
        column: 0
      },
      {
        id: "g2",
        gateType: "RZ",
        targets: [1],
        controls: [],
        params: { phi: 1.047 },
        column: 0
      },
      {
        id: "g3",
        gateType: "RZ",
        targets: [2],
        controls: [],
        params: { phi: 0.785 },
        column: 0
      },
      {
        id: "g4",
        gateType: "RY",
        targets: [0],
        controls: [],
        params: { theta: 0.785 },
        column: 1
      },
      {
        id: "g5",
        gateType: "RY",
        targets: [1],
        controls: [],
        params: { theta: 0.785 },
        column: 1
      },
      {
        id: "g6",
        gateType: "RY",
        targets: [2],
        controls: [],
        params: { theta: 0.785 },
        column: 1
      },
      {
        id: "g7",
        gateType: "CNOT",
        targets: [1],
        controls: [0],
        params: {},
        column: 2
      },
      {
        id: "g8",
        gateType: "CNOT",
        targets: [2],
        controls: [1],
        params: {},
        column: 3
      },
      {
        id: "m0",
        gateType: "MEASURE",
        targets: [0],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m1",
        gateType: "MEASURE",
        targets: [1],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m2",
        gateType: "MEASURE",
        targets: [2],
        controls: [],
        params: {},
        column: 4
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Encode Data Feature 1",
        instruction: "Add RZ gate to qubit 0 with angle 0.314 (representing first data feature)",
        hint: "This RZ gate encodes classical data into the quantum state. Place it at column 0",
        expectedGate: {
          id: "g1",
          gateType: "RZ",
          targets: [0],
          controls: [],
          params: { phi: 0.314 },
          column: 0
        },
        educationalNote: "📊 Data encoding is how we input classical information into quantum circuits! Each feature becomes a rotation angle.",
        whyItMatters: "In QML, we encode our dataset (images, numbers, etc.) as quantum states using rotations. This is the 'input layer'!"
      },
      {
        stepNumber: 2,
        title: "Encode Data Features 2 and 3",
        instruction: "Add RZ gates to qubits 1 and 2 with angles 1.047 and 0.785",
        hint: "These represent the second and third features of your data point. All in column 0",
        expectedGate: {
          id: "g2",
          gateType: "RZ",
          targets: [1],
          controls: [],
          params: { phi: 1.047 },
          column: 0
        },
        educationalNote: "🔢 Notice the different angles - each represents a different feature value! Different angles encode different information.",
        whyItMatters: "For a 3-feature dataset, we use 3 qubits. More features might need amplitude encoding or other tricks."
      },
      {
        stepNumber: 3,
        title: "Start Variational Layer",
        instruction: "Add RY gates to all 3 qubits with angle 0.785",
        hint: "After encoding, we add trainable gates. These angles will be optimized during training!",
        expectedGate: {
          id: "g4",
          gateType: "RY",
          targets: [0],
          controls: [],
          params: { theta: 0.785 },
          column: 1
        },
        educationalNote: "🎯 These RY gates are TRAINABLE parameters - the heart of quantum machine learning!",
        whyItMatters: "Just like neural network weights, these angles are adjusted during training to minimize loss."
      },
      {
        stepNumber: 4,
        title: "Create Entanglement Chain",
        instruction: "Add CNOT gates chaining qubits 0→1 and 1→2",
        hint: "Two CNOTs: first at column 2 (0→1), second at column 3 (1→2)",
        expectedGate: {
          id: "g7",
          gateType: "CNOT",
          targets: [1],
          controls: [0],
          params: {},
          column: 2
        },
        educationalNote: "🔗 Entanglement allows the model to learn correlations between features!",
        whyItMatters: "This is where quantum ML gets its power - classical NNs can't create these quantum correlations."
      },
      {
        stepNumber: 5,
        title: "Measure and Extract Prediction",
        instruction: "Add measurements to extract the classification result",
        hint: "Measurements in column 4. The probability distribution tells us the model's prediction!",
        expectedGate: {
          id: "m0",
          gateType: "MEASURE",
          targets: [0],
          controls: [],
          params: {},
          column: 4
        },
        educationalNote: "🎉 You've built a complete QML classifier! Data encoding → trainable gates → measurement = quantum neural network!",
        whyItMatters: "This architecture is used in real quantum machine learning research. You're at the cutting edge!"
      }
    ]
  },

  // === Lesson 5: Advanced ===
  {
    id: "lesson5_hybrid_qml_4qubit",
    title: "Lesson 5 – Hybrid QML Block",
    description: "RX data encoding, local entanglers, another SEL layer, and a central entangler.",
    difficulty: "advanced",
    numQubits: 4,
    estimatedTime: "25 minutes",
    prerequisites: ["Completed Lessons 1-4", "Understanding of hybrid quantum-classical algorithms"],
    learningObjectives: [
      "Build complex multi-layer quantum circuits",
      "Use different encoding strategies (RX vs RZ)",
      "Understand deep quantum neural networks"
    ],
    gates: [
      {
        id: "g1",
        gateType: "RX",
        targets: [0],
        controls: [],
        params: { theta: 0.314 },
        column: 0
      },
      {
        id: "g2",
        gateType: "RX",
        targets: [1],
        controls: [],
        params: { theta: 0.785 },
        column: 0
      },
      {
        id: "g3",
        gateType: "RX",
        targets: [2],
        controls: [],
        params: { theta: 1.047 },
        column: 0
      },
      {
        id: "g4",
        gateType: "RX",
        targets: [3],
        controls: [],
        params: { theta: 1.571 },
        column: 0
      },
      {
        id: "g5",
        gateType: "CNOT",
        targets: [1],
        controls: [0],
        params: {},
        column: 1
      },
      {
        id: "g6",
        gateType: "CNOT",
        targets: [3],
        controls: [2],
        params: {},
        column: 1
      },
      {
        id: "g7",
        gateType: "RY",
        targets: [0],
        controls: [],
        params: { theta: 1.047 },
        column: 2
      },
      {
        id: "g8",
        gateType: "RY",
        targets: [1],
        controls: [],
        params: { theta: 1.047 },
        column: 2
      },
      {
        id: "g9",
        gateType: "RY",
        targets: [2],
        controls: [],
        params: { theta: 1.047 },
        column: 2
      },
      {
        id: "g10",
        gateType: "RY",
        targets: [3],
        controls: [],
        params: { theta: 1.047 },
        column: 2
      },
      {
        id: "g11",
        gateType: "CNOT",
        targets: [2],
        controls: [1],
        params: {},
        column: 3
      },
      {
        id: "m0",
        gateType: "MEASURE",
        targets: [0],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m1",
        gateType: "MEASURE",
        targets: [1],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m2",
        gateType: "MEASURE",
        targets: [2],
        controls: [],
        params: {},
        column: 4
      },
      {
        id: "m3",
        gateType: "MEASURE",
        targets: [3],
        controls: [],
        params: {},
        column: 4
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "RX Data Encoding Layer",
        instruction: "Add RX gates to all 4 qubits with angles 0.314, 0.785, 1.047, and 1.571",
        hint: "RX encodes data differently than RZ - it rotates around the X-axis! Place all in column 0",
        expectedGate: {
          id: "g1",
          gateType: "RX",
          targets: [0],
          controls: [],
          params: { theta: 0.314 },
          column: 0
        },
        educationalNote: "🔄 RX encoding creates different quantum states than RZ! Choosing the right encoding matters for performance.",
        whyItMatters: "In quantum ML, the encoding strategy affects what patterns the model can learn. RX might work better for some datasets!"
      },
      {
        stepNumber: 2,
        title: "Parallel Local Entanglement",
        instruction: "Add two CNOTs simultaneously: 0→1 and 2→3",
        hint: "Both CNOTs in column 1. This creates two independent entangled pairs",
        expectedGate: {
          id: "g5",
          gateType: "CNOT",
          targets: [1],
          controls: [0],
          params: {},
          column: 1
        },
        educationalNote: "⚡ Parallel gates showcase quantum hardware efficiency - multiple operations at once!",
        whyItMatters: "This parallel structure reduces circuit depth, which is crucial for noisy near-term quantum devices (NISQ)."
      },
      {
        stepNumber: 3,
        title: "Second Variational Layer",
        instruction: "Add RY gates to all 4 qubits with angle π/3 (1.047 radians)",
        hint: "Four RY gates in column 2, all with theta=1.047. This is our second trainable layer!",
        expectedGate: {
          id: "g7",
          gateType: "RY",
          targets: [0],
          controls: [],
          params: { theta: 1.047 },
          column: 2
        },
        educationalNote: "📚 Multiple variational layers create a 'deep' quantum neural network with more expressivity!",
        whyItMatters: "Like deep classical NNs, deeper quantum circuits can learn more complex patterns. But they're harder to train!"
      },
      {
        stepNumber: 4,
        title: "Global Bridging Entangler",
        instruction: "Add a CNOT from qubit 1 to qubit 2 to connect the two halves",
        hint: "This central CNOT in column 3 creates global entanglement across all 4 qubits",
        expectedGate: {
          id: "g11",
          gateType: "CNOT",
          targets: [2],
          controls: [1],
          params: {},
          column: 3
        },
        educationalNote: "🌉 This bridge entangler creates long-range correlations across the entire circuit!",
        whyItMatters: "Global entanglement lets the model learn relationships between distant features in your data."
      },
      {
        stepNumber: 5,
        title: "Final Measurements",
        instruction: "Add measurements to all 4 qubits to extract predictions",
        hint: "Four MEASURE gates in column 4. The measurement statistics give us the model output!",
        expectedGate: {
          id: "m0",
          gateType: "MEASURE",
          targets: [0],
          controls: [],
          params: {},
          column: 4
        },
        educationalNote: "🎊 Congratulations! You've mastered quantum circuit design for machine learning!",
        whyItMatters: "This hybrid architecture combines ideas from MERA, variational circuits, and deep learning. You're ready for real QML research!"
      }
    ]
  }
];

export function getLessonById(id: string): LessonCircuit | undefined {
  return QML_LESSONS.find((lesson) => lesson.id === id);
}

export function getLessonsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): LessonCircuit[] {
  return QML_LESSONS.filter((lesson) => lesson.difficulty === difficulty);
}

export function getNextLesson(currentLessonId: string): LessonCircuit | undefined {
  const currentIndex = QML_LESSONS.findIndex((lesson) => lesson.id === currentLessonId);
  if (currentIndex >= 0 && currentIndex < QML_LESSONS.length - 1) {
    return QML_LESSONS[currentIndex + 1];
  }
  return undefined;
}
