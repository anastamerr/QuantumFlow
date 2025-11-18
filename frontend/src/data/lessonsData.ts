import { Gate } from "../store/slices/circuitSlice";

export interface LessonChallenge {
  id: string;
  title: string;
  description: string;
  circuit: Omit<Gate, "id">[];
  expectedResult: {
    type: "circuit" | "state" | "measurement";
    description: string;
    /**
     * Returns true if the user's circuit meets the criteria.
     * @param currentCircuit
     * @param qubits
     */
    validation: (currentCircuit: Gate[], qubits: number) => boolean;
  };
  hints: string[];
  solution: {
    description: string;
    circuit: Omit<Gate, "id">[];
  };
  difficulty: "easy" | "medium" | "hard";
}

export interface ConceptCheck {
  question: string;
  options: string[];
  correctAnswer: number; // index
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: "beginner" | "intermediate" | "advanced";
  theory: {
    content: string;
    equations?: string[];
    visualizations?: string[];
  };
  conceptChecks?: ConceptCheck[];
  examples: {
    title: string;
    circuit: Omit<Gate, "id">[];
    explanation: string;
  }[];
  challenges: LessonChallenge[];
  prerequisites: string[];
  learningObjectives: string[];
  estimatedTime: number;
}

const countGate = (c: Gate[], type: string, qubit?: number) =>
  c.filter((g) => g.type === type && (qubit === undefined || g.qubit === qubit))
    .length;

const hasControlTargetPair = (
  c: Gate[],
  control: number,
  target: number,
  gateType: "cnot" | "cx" | "cz" | "cp" | "swap"
) =>
  c.some(
    (g) =>
      g.type === gateType &&
      g.qubit === control &&
      Array.isArray(g.targets) &&
      g.targets.includes(target)
  );

const isOrdered = (c: Gate[], typeA: string, typeB: string, qubit: number) => {
  const gateA = c.find((g) => g.type === typeA && g.qubit === qubit);
  const gateB = c.find((g) => g.type === typeB && g.qubit === qubit);
  return gateA && gateB && gateA.position < gateB.position;
};

export const lessonsData: Lesson[] = [
  // ===========================================================================
  // BEGINNER SECTION
  // ===========================================================================
  {
    id: "circuit-basics",
    title: "Circuit Basics: Qubits & Gates",
    description:
      "Learn the fundamentals of quantum circuits, including qubits, classical bits, and basic quantum gates.",
    category: "beginner",
    theory: {
      content: `A quantum circuit is a model for quantum computation. Information is held in **qubits**, the quantum analogue of classical bits.

**Key Concepts:**
• **Qubits**: Can be in state $|0\\rangle$, $|1\\rangle$, or a superposition $\\alpha|0\\rangle + \\beta|1\\rangle$.
• **The X-Gate**: Often called the quantum NOT gate. It acts on a single qubit and flips its state ($|0\\rangle \\to |1\\rangle$ and vice versa).
• **Circuit Diagram**: Time flows from left to right. Horizontal lines represent qubits.`,
      equations: [
        "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle",
        "X|0\\rangle = |1\\rangle",
        "X|1\\rangle = |0\\rangle",
      ],
    },
    conceptChecks: [
      {
        question: "What is the effect of the X-gate on the state |0⟩?",
        options: [
          "It remains |0⟩",
          "It becomes |1⟩",
          "It becomes a superposition",
          "It destroys the qubit",
        ],
        correctAnswer: 1,
        explanation:
          "The X-gate acts as a quantum NOT gate, flipping |0⟩ to |1⟩ and vice versa.",
      },
      {
        question:
          "In a quantum circuit diagram, which direction does time flow?",
        options: [
          "Right to Left",
          "Top to Bottom",
          "Left to Right",
          "Bottom to Top",
        ],
        correctAnswer: 2,
        explanation:
          "By convention, quantum circuits are read from left to right, with operations applied in that order.",
      },
    ],
    examples: [
      {
        title: "Single Qubit Identity",
        circuit: [],
        explanation:
          "A single qubit line initialized to $|0\\rangle$. Without gates, it remains $|0\\rangle$.",
      },
    ],
    challenges: [
      {
        id: "add-qubit",
        title: "Add a Qubit",
        description:
          "A quantum circuit needs qubits to function. Add at least one qubit to the board.",
        circuit: [],
        expectedResult: {
          type: "circuit",
          description: "The circuit must contain at least 1 qubit line.",
          validation: (_, qubits) => qubits >= 1,
        },
        hints: ["Look for the '+' or 'Add Qubit' button in the interface."],
        solution: {
          description:
            "Adding a qubit creates a new register initialized to state |0>.",
          circuit: [],
        },
        difficulty: "easy",
      },
      {
        id: "place-x-gate",
        title: "The Quantum NOT Gate",
        description:
          "Place an X-gate on the first qubit (q0) to flip its state from $|0\\rangle$ to $|1\\rangle$.",
        circuit: [],
        expectedResult: {
          type: "state",
          description: "Exactly one X-gate on qubit 0.",
          validation: (c) => countGate(c, "x", 0) === 1,
        },
        hints: [
          "Drag the 'X' gate from the toolbox.",
          "Drop it onto the top line (q0).",
        ],
        solution: {
          description:
            "The X-gate rotates the qubit around the X-axis of the Bloch sphere, effectively flipping the bit value.",
          circuit: [{ type: "x", qubit: 0, position: 0 }],
        },
        difficulty: "easy",
      },
    ],
    prerequisites: [],
    learningObjectives: [
      "Understand the visual representation of a qubit.",
      "Perform a basic bit-flip using the X-gate.",
    ],
    estimatedTime: 10,
  },

  {
    id: "hadamard-superposition",
    title: "Hadamard & Superposition",
    description:
      "Unlock the power of quantum mechanics by creating superposition states using the Hadamard gate.",
    category: "beginner",
    theory: {
      content: `Superposition allows a qubit to exist in a combination of $|0\\rangle$ and $|1\\rangle$ simultaneously. 
      
The **Hadamard Gate (H)** is used to create superposition:
• Applied to $|0\\rangle$, it creates the $|+\\rangle$ state: equal probability of measuring 0 or 1.
• Applied to $|1\\rangle$, it creates the $|-\\rangle$ state: equal probability, but with a different phase.`,
      equations: [
        "H|0\\rangle = |+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}",
        "H|1\\rangle = |-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}",
      ],
    },
    conceptChecks: [
      {
        question:
          "If you measure a qubit in the |+⟩ state, what is the probability of getting 0?",
        options: ["0%", "50%", "100%", "25%"],
        correctAnswer: 1,
        explanation:
          "The |+⟩ state is an equal superposition, so there is a 50% chance of measuring 0 and a 50% chance of measuring 1.",
      },
      {
        question: "What is the difference between the |+⟩ and |−⟩ states?",
        options: [
          "They have different measurement probabilities.",
          "One is entangled, the other is not.",
          "They differ only by a relative phase.",
          "They are the same state.",
        ],
        correctAnswer: 2,
        explanation:
          "Both have 50/50 measurement probabilities, but |−⟩ has a negative phase on the |1⟩ component.",
      },
    ],
    examples: [
      {
        title: "Entering Superposition",
        circuit: [{ type: "h", qubit: 0, position: 0 }],
        explanation:
          "An H-gate on q0 puts the qubit into the $|+\\rangle$ state.",
      },
    ],
    challenges: [
      {
        id: "create-plus-state",
        title: "Create the |+⟩ State",
        description:
          "Start with $|0\\rangle$ and apply a Hadamard gate to create the $|+\\rangle$ state.",
        circuit: [],
        expectedResult: {
          type: "state",
          description: "One H-gate on qubit 0.",
          validation: (c) => countGate(c, "h", 0) === 1,
        },
        hints: ["The qubit starts at 0. Just add an H-gate."],
        solution: {
          description: "H|0> creates the superposition state |+>.",
          circuit: [{ type: "h", qubit: 0, position: 0 }],
        },
        difficulty: "easy",
      },
      {
        id: "create-minus-state",
        title: "Create the |−⟩ State",
        description:
          "To create $|-\\rangle$, the qubit must be in state $|1\\rangle$ before applying the Hadamard. Construct this circuit.",
        circuit: [],
        expectedResult: {
          type: "state",
          description: "An X-gate followed by an H-gate on qubit 0.",
          validation: (c) =>
            countGate(c, "x", 0) === 1 &&
            countGate(c, "h", 0) === 1 &&
            isOrdered(c, "x", "h", 0),
        },
        hints: [
          "Flip the qubit to |1> first using X.",
          "Then apply H to create the minus phase.",
        ],
        solution: {
          description:
            "First X|0> -> |1>. Then H|1> -> |->. The order matters significantly.",
          circuit: [
            { type: "x", qubit: 0, position: 0 },
            { type: "h", qubit: 0, position: 1 },
          ],
        },
        difficulty: "medium",
      },
    ],
    prerequisites: ["circuit-basics"],
    learningObjectives: [
      "Understand what superposition is.",
      "Distinguish between |+> and |-> states.",
      "Recognize the importance of gate order.",
    ],
    estimatedTime: 15,
  },

  {
    id: "bell-states",
    title: "Entanglement & Bell States",
    description:
      "Learn to entangle two qubits, making their states dependent on each other regardless of distance.",
    category: "beginner",
    theory: {
      content: `Entanglement links qubits together. The most famous entangled states are the **Bell States**.
      
To create the Bell State $|\\Phi^+\\rangle$:
1. Put the first qubit in superposition (H-gate).
2. Use a **CNOT** (Controlled-NOT) gate.
   - **Control**: The qubit with the H-gate.
   - **Target**: The second qubit (initialized to 0).
   
The CNOT flips the target only if the control is $|1\\rangle$. Since the control is in superposition, the target enters a superposition *dependent* on the control.`,
      equations: [
        "CNOT|00\\rangle = |00\\rangle",
        "CNOT|10\\rangle = |11\\rangle",
        "|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}",
      ],
    },
    conceptChecks: [
      {
        question: "In a CNOT gate, when does the target qubit flip?",
        options: [
          "Always",
          "When the control qubit is |0⟩",
          "When the control qubit is |1⟩",
          "Randomly",
        ],
        correctAnswer: 2,
        explanation:
          "The CNOT (Controlled-NOT) gate flips the target qubit only if the control qubit is in the state |1⟩.",
      },
      {
        question:
          "What is a key characteristic of an entangled state like a Bell State?",
        options: [
          "The qubits are independent.",
          "Measuring one qubit instantly tells you the state of the other.",
          "It requires 3 or more qubits.",
          "It cannot be created with simple gates.",
        ],
        correctAnswer: 1,
        explanation:
          "In a Bell state, the measurement outcomes are perfectly correlated. Knowing one result reveals the other.",
      },
    ],
    examples: [
      {
        title: "CNOT Logic",
        circuit: [
          { type: "x", qubit: 0, position: 0 },
          { type: "cnot", qubit: 0, targets: [1], position: 1 },
        ],
        explanation:
          "Here, q0 is flipped to 1. The CNOT sees q0 is 1, so it flips q1. Result: |11>.",
      },
    ],
    challenges: [
      {
        id: "make-bell-state",
        title: "Construct a Bell State",
        description:
          "Build the circuit for $|\\Phi^+\\rangle$ using 2 qubits, an H-gate, and a CNOT gate.",
        circuit: [],
        expectedResult: {
          type: "state",
          description: "H on q0, then CNOT with Control q0 and Target q1.",
          validation: (c) => {
            const h = c.find((g) => g.type === "h" && g.qubit === 0);
            const cx = c.find(
              (g) =>
                (g.type === "cnot" || g.type === "cx") &&
                g.qubit === 0 &&
                g.targets?.includes(1)
            );
            return !!(h && cx && h.position < cx.position);
          },
        },
        hints: [
          "Apply H to the control qubit (q0).",
          "Apply CNOT from q0 to q1.",
        ],
        solution: {
          description:
            "This circuit creates perfect correlation. If q0 is measured as 0, q1 is 0. If q0 is 1, q1 is 1.",
          circuit: [
            { type: "h", qubit: 0, position: 0 },
            { type: "cnot", qubit: 0, targets: [1], position: 1 },
          ],
        },
        difficulty: "medium",
      },
    ],
    prerequisites: ["hadamard-superposition"],
    learningObjectives: [
      "Understand the CNOT gate.",
      "Create the standard Bell State.",
      "Grasp basic entanglement correlation.",
    ],
    estimatedTime: 20,
  },

  // ===========================================================================
  // INTERMEDIATE SECTION
  // ===========================================================================
  {
    id: "qft-basics",
    title: "Quantum Fourier Transform (QFT)",
    description:
      "Implement the QFT, the engine behind Shor's Algorithm and Quantum Phase Estimation.",
    category: "intermediate",
    theory: {
      content: `The QFT transforms a quantum state from the computational basis to the Fourier basis.
      
**Pattern for N qubits:**
1. **Hadamard** on the most significant qubit ($j$).
2. **Controlled-Phase (CP)** rotations from subsequent qubits ($k$) onto qubit $j$.
   - Angle $\\theta_k = \\pi / 2^{k-j}$.
3. Repeat for all qubits.
4. **SWAP** gates at the end to reverse the order of qubits.`,
      equations: [
        "QFT|x\\rangle = \\frac{1}{\\sqrt{N}} \\sum_{k=0}^{N-1} e^{2\\pi i x k / N} |k\\rangle",
      ],
    },
    conceptChecks: [
      {
        question: "What does the Quantum Fourier Transform (QFT) do?",
        options: [
          "It measures the qubits.",
          "It transforms a state from the computational basis to the Fourier basis.",
          "It clones the quantum state.",
          "It performs classical addition.",
        ],
        correctAnswer: 1,
        explanation:
          "The QFT is the quantum analogue of the discrete Fourier transform, mapping computational basis states to Fourier basis states.",
      },
      {
        question: "Which gates are primarily used to construct the QFT?",
        options: [
          "X and Z gates",
          "Hadamard and Controlled-Phase gates",
          "CNOT and Toffoli gates",
          "SWAP gates only",
        ],
        correctAnswer: 1,
        explanation:
          "The QFT is built using a sequence of Hadamard gates for superposition and Controlled-Phase gates for relative phase shifts.",
      },
    ],
    examples: [
      {
        title: "1-Qubit QFT",
        circuit: [{ type: "h", qubit: 0, position: 0 }],
        explanation: "For a single qubit, the QFT is simply the Hadamard gate.",
      },
    ],
    challenges: [
      {
        id: "qft-2-qubit",
        title: "2-Qubit QFT",
        description:
          "Build a QFT circuit for 2 qubits. Order: H(q0), CP(q1->q0), H(q1), then SWAP(q0, q1).",
        circuit: [],
        expectedResult: {
          type: "circuit",
          description: "H(0), CP(1->0), H(1), SWAP(0,1) in correct sequence.",
          validation: (c) => {
            const h0 = c.find((g) => g.type === "h" && g.qubit === 0);
            const cp = c.find(
              (g) => g.type === "cp" && g.qubit === 1 && g.targets?.includes(0)
            );
            const h1 = c.find((g) => g.type === "h" && g.qubit === 1);
            const swap = c.find(
              (g) =>
                g.type === "swap" &&
                ((g.qubit === 0 && g.targets?.includes(1)) ||
                  (g.qubit === 1 && g.targets?.includes(0)))
            );

            if (!h0 || !cp || !h1 || !swap) return false;
            return (
              h0.position < cp.position &&
              cp.position < h1.position &&
              h1.position < swap.position
            );
          },
        },
        hints: [
          "Start with H on q0.",
          "Add Controlled-Phase from q1 (control) to q0 (target). Angle is π/2.",
          "Then H on q1.",
          "Finally, SWAP q0 and q1.",
        ],
        solution: {
          description:
            "The 2-qubit QFT creates constructive/destructive interference patterns needed for period finding.",
          circuit: [
            { type: "h", qubit: 0, position: 0 },
            {
              type: "cp",
              qubit: 1,
              targets: [0],
              position: 1,
              params: { angle: "π/2" },
            },
            { type: "h", qubit: 1, position: 2 },
            { type: "swap", qubit: 0, targets: [1], position: 3 },
          ],
        },
        difficulty: "hard",
      },
    ],
    prerequisites: ["bell-states"],
    learningObjectives: [
      "Understand the recursive pattern of QFT.",
      "Use Controlled-Phase and SWAP gates.",
    ],
    estimatedTime: 30,
  },

  {
    id: "grover-search",
    title: "Grover's Algorithm",
    description:
      "Learn how quantum computers can search unstructured databases quadratically faster than classical computers.",
    category: "intermediate",
    theory: {
      content: `Grover's algorithm finds a marked item in a list. It consists of two steps repeated $\\approx \\sqrt{N}$ times:
      
1. **Oracle**: Marks the solution by flipping its phase (multiplying by -1).
2. **Diffuser**: Inverts all amplitudes about the mean. This amplifies the probability of the marked item.

**The Diffuser Circuit ($U_s$)**:
$H^{\\otimes n} \\to X^{\\otimes n} \\to \\text{Multi-Controlled Z} \\to X^{\\otimes n} \\to H^{\\otimes n}$.`,
      equations: [
        "U_w |x\\rangle = (-1)^{f(x)}|x\\rangle",
        "U_s = 2|s\\rangle\\langle s| - I",
      ],
    },
    conceptChecks: [
      {
        question: "What is the main advantage of Grover's Algorithm?",
        options: [
          "It sorts a database instantly.",
          "It provides a quadratic speedup for searching unstructured databases.",
          "It provides an exponential speedup for factoring.",
          "It corrects quantum errors.",
        ],
        correctAnswer: 1,
        explanation:
          "Grover's algorithm offers a quadratic speedup (O(√N)) compared to classical search (O(N)).",
      },
      {
        question: "What is the role of the Oracle in Grover's algorithm?",
        options: [
          "It measures the solution.",
          "It marks the correct solution by flipping its phase.",
          "It resets the circuit.",
          "It creates the initial superposition.",
        ],
        correctAnswer: 1,
        explanation:
          "The Oracle identifies the target item(s) by multiplying their amplitude by -1 (phase flip), distinguishing them from the rest.",
      },
    ],
    examples: [
      {
        title: "Preparation",
        circuit: [
          { type: "h", qubit: 0, position: 0 },
          { type: "h", qubit: 1, position: 0 },
        ],
        explanation:
          "Grover's algorithm starts with a uniform superposition of all states.",
      },
    ],
    challenges: [
      {
        id: "grover-diffuser",
        title: "Build the Diffuser",
        description:
          "Construct the 2-qubit Grover Diffuser. Sandwich a CZ gate between layers of X and H gates.",
        circuit: [],
        expectedResult: {
          type: "circuit",
          description: "Layer H, Layer X, CZ(0,1), Layer X, Layer H.",
          validation: (c) => {
            const hCount = countGate(c, "h");
            const xCount = countGate(c, "x");
            const cz =
              hasControlTargetPair(c, 0, 1, "cz") ||
              hasControlTargetPair(c, 1, 0, "cz");

            // We need 4 H gates (2 start, 2 end), 4 X gates (2 start, 2 end), and 1 CZ
            return hCount >= 4 && xCount >= 4 && cz;
          },
        },
        hints: [
          "Apply H to both q0, q1.",
          "Apply X to both q0, q1.",
          "Apply CZ between q0 and q1.",
          "Apply X to both.",
          "Apply H to both.",
        ],
        solution: {
          description:
            "This 'sandwich' operator reflects the state vector around the average amplitude, boosting the probability of the answer.",
          circuit: [
            { type: "h", qubit: 0, position: 0 },
            { type: "h", qubit: 1, position: 0 },
            { type: "x", qubit: 0, position: 1 },
            { type: "x", qubit: 1, position: 1 },
            { type: "cz", qubit: 0, targets: [1], position: 2 },
            { type: "x", qubit: 0, position: 3 },
            { type: "x", qubit: 1, position: 3 },
            { type: "h", qubit: 0, position: 4 },
            { type: "h", qubit: 1, position: 4 },
          ],
        },
        difficulty: "hard",
      },
    ],
    prerequisites: ["qft-basics"],
    learningObjectives: [
      "Understanding Amplitude Amplification.",
      "Constructing the Diffuser operator.",
    ],
    estimatedTime: 40,
  },

  // ===========================================================================
  // ADVANCED SECTION
  // ===========================================================================
  {
    id: "shors-algorithm",
    title: "Shor's Algorithm: Initialization",
    description:
      "The famous algorithm for integer factorization. We will focus on the state preparation phase.",
    category: "advanced",
    theory: {
      content: `Shor's algorithm breaks encryption by factoring large numbers.
      
**Core Process (Period Finding):**
1. **Initialization**: Create two registers.
   - Register 1 (Measuring): $n$ qubits in uniform superposition ($H^{\\otimes n}$).
   - Register 2 (Work): Initialized to $|1\\rangle$ (usually).
2. **Modular Exponentiation**: Entangles the registers.
3. **Inverse QFT**: applied to Register 1.
4. **Measurement**: Reveals period information.`,
      equations: ["f(x) = a^x \\pmod N"],
    },
    conceptChecks: [
      {
        question: "What problem does Shor's Algorithm solve efficiently?",
        options: [
          "Database search",
          "Integer factorization",
          "Traveling salesman problem",
          "Weather forecasting",
        ],
        correctAnswer: 1,
        explanation:
          "Shor's algorithm can factor large integers exponentially faster than the best known classical algorithms, threatening RSA encryption.",
      },
      {
        question:
          "Why do we initialize the first register in uniform superposition?",
        options: [
          "To save energy.",
          "To evaluate the function f(x) for all inputs simultaneously (Quantum Parallelism).",
          "To make the circuit look nicer.",
          "It is not necessary.",
        ],
        correctAnswer: 1,
        explanation:
          "Superposition allows the quantum computer to process all possible inputs at once, which is crucial for finding the period of the function.",
      },
    ],
    examples: [
      {
        title: "State Preparation",
        circuit: [
          { type: "h", qubit: 0, position: 0 },
          { type: "h", qubit: 1, position: 0 },
          { type: "h", qubit: 2, position: 0 },
          { type: "x", qubit: 3, position: 0 },
        ],
        explanation:
          "A typical setup for Shor's algorithm: The top 3 qubits (measuring register) are in superposition, and the bottom qubit (work register) is set to |1>.",
      },
    ],
    challenges: [
      {
        id: "shor-init",
        title: "Initialize the Registers",
        description:
          "Prepare a 4-qubit measuring register in uniform superposition.",
        circuit: [],
        expectedResult: {
          type: "state",
          description: "H-gates on qubits 0, 1, 2, and 3.",
          validation: (c, qubits) => {
            if (qubits < 4) return false;
            return (
              countGate(c, "h", 0) >= 1 &&
              countGate(c, "h", 1) >= 1 &&
              countGate(c, "h", 2) >= 1 &&
              countGate(c, "h", 3) >= 1
            );
          },
        },
        hints: ["Add 4 qubits.", "Place an H-gate on every qubit."],
        solution: {
          description:
            "Uniform superposition ($H^{\\otimes n}$) allows the quantum computer to evaluate the function $f(x)$ for all inputs simultaneously.",
          circuit: [
            { type: "h", qubit: 0, position: 0 },
            { type: "h", qubit: 1, position: 0 },
            { type: "h", qubit: 2, position: 0 },
            { type: "h", qubit: 3, position: 0 },
          ],
        },
        difficulty: "easy",
      },
    ],
    prerequisites: ["qft-basics"],
    learningObjectives: [
      "Understand the high-level structure of Shor's Algorithm.",
      "Prepare the initial superposition state.",
    ],
    estimatedTime: 50,
  },

  {
    id: "qpe-algorithm",
    title: "Quantum Phase Estimation (QPE)",
    description:
      "Determine the phase (eigenvalue) of a unitary operator. This is the backbone of Quantum Chemistry simulations.",
    category: "advanced",
    theory: {
      content: `Given $U|\\psi\\rangle = e^{2\\pi i \\varphi} |\\psi\\rangle$, QPE estimates $\\varphi$.
      
**Steps:**
1. **Setup**: H-gates on counting qubits.
2. **Controlled-U operations**: $C-U^{2^j}$ gates.
3. **Inverse QFT**: Applied to the counting qubits to extract the phase.
      
The **Inverse QFT ($QFT^\\dagger$)** for 2 qubits is the reverse of the QFT:
$SWAP(0,1) \\to H(0) \\to CP^\\dagger(1 \\to 0) \\to H(1)$.`,
      equations: [
        "|\\tilde{\\varphi}\\rangle = QFT^\\dagger \\left( \\frac{1}{\\sqrt{N}} \\sum e^{2\\pi i \\varphi k}|k\\rangle \\right)",
      ],
    },
    conceptChecks: [
      {
        question: "What is the goal of Quantum Phase Estimation (QPE)?",
        options: [
          "To estimate the eigenvalue (phase) of a unitary operator.",
          "To estimate the probability of measuring 0.",
          "To estimate the time it takes to run a circuit.",
          "To estimate the number of gates needed.",
        ],
        correctAnswer: 0,
        explanation:
          "QPE is designed to determine the phase θ of an eigenvalue e^(2πiθ) of a unitary operator U.",
      },
      {
        question: "Why is the Inverse QFT used at the end of QPE?",
        options: [
          "To scramble the results.",
          "To transform the phase information encoded in amplitudes back into the computational basis.",
          "To undo the errors.",
          "It is just a convention.",
        ],
        correctAnswer: 1,
        explanation:
          "The phase information is encoded in the Fourier basis. The Inverse QFT transforms it back to the computational basis so we can measure the binary representation of the phase.",
      },
    ],
    examples: [
      {
        title: "Phase Kickback",
        circuit: [
          { type: "h", qubit: 0, position: 0 },
          { type: "x", qubit: 1, position: 0 },
          { type: "h", qubit: 1, position: 1 },
          {
            type: "cp",
            qubit: 0,
            targets: [1],
            params: { angle: "π/4" },
            position: 2,
          },
        ],
        explanation:
          "The core mechanism of QPE is 'phase kickback', where the phase of the target qubit is kicked back to the control qubit.",
      },
    ],
    challenges: [
      {
        id: "qpe-inverse-qft",
        title: "Inverse QFT Step",
        description:
          "Construct the Inverse QFT for 2 qubits. Note: The CP angle should be negative (-π/2).",
        circuit: [],
        expectedResult: {
          type: "circuit",
          description: "SWAP(0,1), H(0), CP(-π/2, 1->0), H(1).",
          validation: (c) => {
            // Find gates
            const swap = c.find(
              (g) =>
                g.type === "swap" &&
                (g.targets?.includes(1) || g.targets?.includes(0))
            );
            const h0 = c.find((g) => g.type === "h" && g.qubit === 0);
            const cp = c.find(
              (g) => g.type === "cp" && g.qubit === 1 && g.targets?.includes(0)
            );
            const h1 = c.find((g) => g.type === "h" && g.qubit === 1);

            if (!swap || !h0 || !cp || !h1) return false;

            return (
              swap.position < h0.position &&
              h0.position < cp.position &&
              cp.position < h1.position
            );
          },
        },
        hints: [
          "Start with the SWAP gate.",
          "Then apply H to q0.",
          "Apply CP from q1 to q0 with angle -π/2.",
          "Finish with H on q1.",
        ],
        solution: {
          description:
            "The Inverse QFT unravels the phase information encoded in the amplitudes into a measurable binary state.",
          circuit: [
            { type: "swap", qubit: 0, targets: [1], position: 0 },
            { type: "h", qubit: 0, position: 1 },
            {
              type: "cp",
              qubit: 1,
              targets: [0],
              params: { angle: "-π/2" },
              position: 2,
            },
            { type: "h", qubit: 1, position: 3 },
          ],
        },
        difficulty: "hard",
      },
    ],
    prerequisites: ["qft-basics", "shors-algorithm"],
    learningObjectives: [
      "Understand the flow of Quantum Phase Estimation.",
      "Construct the Inverse QFT circuit.",
    ],
    estimatedTime: 60,
  },
];

export const validateCircuit = (
  circuit: Gate[],
  expected: Omit<Gate, "id">[]
) => {
  if (!Array.isArray(expected) || expected.length === 0) return true;
  return expected.every((eg) =>
    circuit.some(
      (g) =>
        g.type === eg.type &&
        g.qubit === eg.qubit &&
        (eg.position === undefined || g.position === eg.position) &&
        JSON.stringify(g.targets || []) === JSON.stringify(eg.targets || [])
    )
  );
};

export const getLessonsByCategory = (
  category: "beginner" | "intermediate" | "advanced"
) => lessonsData.filter((lesson) => lesson.category === category);

export const getLessonById = (id: string): Lesson | undefined =>
  lessonsData.find((l) => l.id === id);

export const getPrerequisites = (lessonId: string): Lesson[] => {
  const lesson = getLessonById(lessonId);
  if (!lesson) return [];
  return lesson.prerequisites
    .map((id) => getLessonById(id))
    .filter((lesson): lesson is Lesson => !!lesson);
};
