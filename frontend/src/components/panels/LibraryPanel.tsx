import React, { useState, useEffect, useRef } from "react";
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Heading,
  useColorModeValue,
  Badge,
  Divider,
  Radio,
  RadioGroup,
  Alert,
  AlertIcon,
  Collapse,
  useDisclosure,
} from "@chakra-ui/react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";


interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  topic?: string;
}

interface LevelQuiz {
  id: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
}

interface TopicItem {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  content: string;
  contentAfterImage?: string;
  imageUrl?: string;
  quiz?: QuizQuestion[];
}

// NOTE: images served from /images (public folder)
const QUANTUM_TOPICS: TopicItem[] = [
  // Beginner
  {
    id: "qubits-basics",
    title: "Qubits and Superposition",
    difficulty: "Beginner",
    description: "Learn the fundamentals of quantum bits",
    imageUrl: "/public/images/superposition.svg",
    content: ` Qubits and Superposition

In classical computing, information is stored in bits—tiny units that can hold a value of either 0 or 1. Quantum computing introduces a new building block called the qubit (quantum bit), which behaves very differently from classical bits and unlocks entirely new computational possibilities.

What Is a Qubit?
A qubit is the fundamental unit of information in quantum computing. Unlike a classical bit, which must be either 0 or 1, a qubit is a quantum system—often represented by particles like electrons, photons, or superconducting circuits—that can exist in multiple states at once.

A qubit has two key properties:
- |0⟩ and |1⟩ states: These are the quantum equivalent of classical 0 and 1.
- A continuous range of states in between: A qubit can be in a blend (superposition) of both |0⟩ and |1⟩.
  Because qubits can hold more complex information than classical bits, even a small number of qubits can represent enormous amounts of data.

Superposition: The Power of “Being Many Things at Once”
Superposition is one of the most important principles in quantum mechanics and a core feature of qubits.

What Does Superposition Mean?
A qubit in superposition is not limited to being just 0 or 1. 
Instead, it exists in a probabilistic mixture of both states at the same time, represented mathematically as:
∣𝜓⟩=𝛼∣0⟩+𝛽∣1⟩
Where:
α and β describe how likely the qubit is to be measured as 0 or 1.
The qubit remains in this mixed state until it is measured, at which point the superposition “collapses” into either 0 or 1.

Why Superposition Matters
  Superposition allows quantum computers to:
    -Process many possibilities simultaneously
    -Explore multiple computational paths at once
    -Scale power exponentially as more qubits are added
This parallelism is what gives quantum computing its extraordinary potential—especially in areas like optimization, cryptography, physics simulations, and machine learning.

Qubits in the Real World
  Different technologies can be used to build qubits, including:
    -Superconducting circuits (used by IBM, Google)
    -Trapped ions
    -Photonic qubits
    -Spin qubits in quantum dots

Each platform has strengths and challenges, but all rely on superposition (and other quantum properties like entanglement) to perform computations that classical computers cannot efficiently handle.

Why These Concepts Matter
Understanding qubits and superposition is the first step toward understanding how quantum computers operate. They form the foundation of all quantum algorithms, from Shor’s algorithm (for factoring) to Grover’s search algorithm and beyond.
Qubits allow quantum computers to represent richer information, while superposition enables them to explore massive solution spaces in parallel—a combination that makes quantum computing one of the most exciting fields in modern technology.`,
    quiz: [
      {
        id: "q1",
        question: "What is the key difference between a classical bit and a qubit?",
        options: [
          "A qubit can only be 0 or 1",
          "A qubit can be in superposition of 0 and 1",
          "A qubit is faster than a classical bit",
          "A qubit uses less energy"
        ],
        correctAnswer: 1,
        explanation: "Unlike classical bits that are either 0 or 1, qubits can exist in a superposition of both states simultaneously."
      },
      {
        id: "q2",
        question: "In the equation |ψ⟩ = α|0⟩ + β|1⟩, what must be true about α and β?",
        options: [
          "α + β = 1",
          "|α|² + |β|² = 1",
          "α = β",
          "α and β must be real numbers"
        ],
        correctAnswer: 1,
        explanation: "The probability amplitudes must satisfy the normalization condition |α|² + |β|² = 1 to ensure total probability equals 1."
      }
    ]
  },
  {
    id: "bloch-sphere",
    title: "Bloch Sphere Representation",
    difficulty: "Beginner",
    description: "Visualize single-qubit states on the Bloch sphere",
    content: ` Bloch Sphere Representation

The Bloch Sphere is a geometric representation of a single qubit’s state in quantum computing. It provides an intuitive way to visualize superposition, phase, and rotations of qubits.

The Bloch Sphere looks like a globe where:
  -The north pole represents the state |0⟩.
  -The south pole represents the state |1⟩.
  -Any point on the surface of the sphere represents a superposition of |0⟩ and |1⟩.
Properties:
- Poles: |0⟩ at north pole, |1⟩ at south pole
- Equator: Superposition states like |+⟩ and |-⟩
- Surface: All valid single-qubit states lie on the surface
- Interior: Mixed states (not pure quantum states)

Rotation Parameters:
  Theta (θ) – Polar Angle
      -θ measures the angle from the north pole (|0⟩) down toward the south pole (|1⟩).
      -Determines how much the qubit is “tilted” between |0⟩ and |1⟩.
        Example:
          θ = 0 → qubit is exactly |0⟩ (north pole)
          θ = π → qubit is exactly |1⟩ (south pole)
          θ = π/2 → qubit is an equal superposition of |0⟩ and |1⟩

Phi (φ) – Azimuthal Angle
  -φ measures the rotation around the vertical axis (like spinning around the north-south pole).
  -Determines the relative phase between |0⟩ and |1⟩ in a superposition.
  -Think of it like longitude on a globe: it tells you “where around the equator” the state vector points.`,
  },
  {
    id: "measurement",
    title: "Quantum Measurement",
    difficulty: "Beginner",
    description: "Understand quantum measurement and wave function collapse",
    content: ` Quantum Measurement

Quantum measurement describes what happens when we observe or “measure” a quantum system, such as a qubit. Unlike classical measurement, which simply reveals a value, quantum measurement actively changes the system being measured.

What Happens During Quantum Measurement?
Before measurement, a qubit can exist in a superposition—a blend of both |0⟩ and |1⟩.
However, when we measure the qubit, the superposition collapses into one definite state:

It becomes |0⟩ with probability |α|²

It becomes |1⟩ with probability |β|²

Where α and β are the amplitudes describing the superposition state:
∣ψ⟩=α∣0⟩+β∣1⟩

Collapse of the Wavefunction

This collapse is not gradual—it happens instantly.
Before measurement, the qubit acts as if it is both 0 and 1.
After measurement, it becomes one or the other, and the probabilities of these outcomes are determined by its quantum state.

Why Is Quantum Measurement Special?
1. Measurement Affects the System

In classical physics, observing something doesn’t change it.
In quantum mechanics, the act of measuring forces the system into a definite state.

2. You Lose Information

After measuring a qubit, the original superposition is gone.
You cannot “undo” the measurement or learn the previous blend values.

3. Probabilistic Outcomes

Quantum measurements are inherently probabilistic, not predictable.
You can calculate the probabilities, but not the exact result of a single measurement.

Measurement in Quantum Computing

In quantum computers, measurement is typically performed:
  -At the end of a quantum algorithm to read the result
  -Sometimes in the middle to influence the next steps (used in certain advanced algorithms and error correction)

How It Works in Practice

  1. A quantum circuit manipulates qubits using gates.
  2. Qubits evolve through superposition and entanglement.
  3. When the algorithm is complete, the qubits are measured, converting quantum states into classical bits (0 or 1).
  4. Because outcomes can be probabilistic, the circuit is usually run many times to gather meaningful statistics.

Why Quantum Measurement Matters

Quantum measurement links the quantum world to the classical world—the point where mysterious quantum behavior becomes usable information. It is essential for:
  - Interpreting quantum algorithms
  - Extracting results from quantum circuits
  - Understanding quantum physics itself
Without measurement, quantum computers could perform incredible calculations but never reveal the answer.`,
  },
  {
    id: "pauli-gates",
    title: "Pauli Gates (X, Y, Z)",
    difficulty: "Beginner",
    description: "Learn fundamental Pauli operations",
    content: `Pauli Gates (X, Y, Z)

Pauli gates are fundamental single-qubit operations in quantum computing. They rotate or flip the state of a qubit along different axes of the Bloch sphere. Each gate corresponds to one of the three Pauli matrices used in quantum mechanics.

X Gate (Pauli-X)
  -Also called the “bit-flip” gate.
  -It flips a qubit’s state: |0⟩ becomes |1⟩ and |1⟩ becomes |0⟩.
  -Equivalent to a 180° rotation around the X-axis of the Bloch sphere.

Matrix representation:

X = [[0, 1],
     [1, 0]]

Y Gate (Pauli-Y)
  -Also called the “phase-and-bit flip” gate.
  -It flips the qubit like the X gate but also adds a phase factor.
  -Represents a 180° rotation around the Y-axis.
Matrix representation:
Y = [[0, -i],
     [i,  0]]

Z Gate (Pauli-Z)

  -Also called the “phase-flip” gate.
  -Leaves |0⟩ unchanged and flips the phase of |1⟩ (turns it into -|1⟩).
  -Represents a 180° rotation around the Z-axis.
Matrix representation:
Z = [[1,  0],
     [0, -1]].`,
  },
  {
    id: "hadamard",
    title: "Hadamard Gate",
    difficulty: "Beginner",
    description: "Create equal superposition",
    imageUrl: "/images/hadamard.svg",
    content: ` Hadamard Gate
- Creates equal superposition.`,
    contentAfterImage: ` Operation:
H|0⟩ = (|0⟩ + |1⟩)/√2
H|1⟩ = (|0⟩ - |1⟩)/√2

 Matrix:
H = 1/√2 * [[1, 1], [1, -1]]

 Properties:
  -Creates equal superposition from classical states
  -Used in many quantum algorithms (e.g., Grover’s, Shor’s)
  -Is its own inverse (applying H twice returns the qubit to its original state)`,
    quiz: [
      {
        id: "q1",
        question: "What happens when you apply a Hadamard gate to |0⟩?",
        options: [
          "It becomes |1⟩",
          "It becomes (|0⟩ + |1⟩)/√2",
          "It becomes (|0⟩ - |1⟩)/√2",
          "Nothing happens"
        ],
        correctAnswer: 1,
        explanation: "H|0⟩ = (|0⟩ + |1⟩)/√2, creating an equal superposition with positive amplitudes."
      },
      {
        id: "q2",
        question: "What property makes the Hadamard gate special?",
        options: [
          "It's the fastest gate",
          "It's self-inverse (H² = I)",
          "It only works on certain qubits",
          "It cannot be undone"
        ],
        correctAnswer: 1,
        explanation: "The Hadamard gate is self-inverse, meaning applying it twice returns the qubit to its original state."
      }
    ]
  },
  {
    id: "bell-state",
    title: "Bell States and Entanglement",
    difficulty: "Beginner",
    description: "Maximally entangled states",
    content: ` Bell States and Entanglement

Bell states are specific two-qubit quantum states that represent the strongest form of entanglement. Entanglement is a uniquely quantum phenomenon where two qubits become linked so deeply that the state of one instantly affects the state of the other, even if they are far apart.

Bell states are fundamental in quantum communication, teleportation, and many quantum algorithms.

What Are Bell States?

There are four Bell states. They form a complete basis for all possible two-qubit entangled states.

|Φ+⟩ = (|00⟩ + |11⟩) / √2
|Φ−⟩ = (|00⟩ − |11⟩) / √2
|Ψ+⟩ = (|01⟩ + |10⟩) / √2
|Ψ−⟩ = (|01⟩ − |10⟩) / √2

Each state contains perfect correlations:
measuring one qubit instantly tells you something about the other.

What Is Entanglement?

Entanglement occurs when two qubits share a joint state that cannot be separated into individual qubit states.

Key features:

  -Measuring one qubit changes the combined system.
  -The results are connected even at great distances.
  -The qubits act as a single unified system.
Entanglement is not about communication faster than light—it’s about shared quantum information across qubits.

How Bell States Are Created

A Bell state can be created using two simple gates:

  1.Apply a Hadamard (H) gate to qubit 1.
  2.Apply a CNOT gate, using qubit 1 as control and qubit 2 as target.

This transforms |00⟩ into |Φ+⟩, the most common Bell state.

Why Bell States Matter
Bell states are crucial for:
  -Quantum teleportation
  -Superdense coding
  -Quantum networking
  -Testing quantum mechanics (e.g., Bell’s theorem)
  -They represent the highest level of two-qubit quantum correlation.`,
  },
  {
    id: "quantum-circuit-basics",
    title: "Quantum Circuit Basics",
    difficulty: "Beginner",
    description: "Understand circuit diagrams",
    content: ` Quantum Circuit Basics

A quantum circuit is the fundamental model used to design and run computations on a quantum computer. It works by applying a sequence of quantum gates to qubits, transforming their states step by step. Quantum circuits are the blueprint that define how information flows and evolves in a quantum algorithm.

Qubits as the Building Blocks
  -A quantum circuit operates on qubits, which can be in |0⟩, |1⟩, or a superposition of both.
  -Multiple qubits can also become entangled, allowing complex quantum behavior.

Gates as Operations

Quantum gates modify the state of qubits. They are the quantum equivalent of logical operations in classical circuits.

Common gate types include:

  -Pauli gates (X, Y, Z) – basic rotations or flips
  -Hadamard (H) – creates superposition
  -CNOT – generates entanglement
  -Phase and rotation gates – adjust the phase of qubit states

All quantum gates are reversible and represented by unitary matrices.

Circuit Structure

A quantum circuit is typically drawn from left to right:

  -Each horizontal line represents a qubit.
  -Boxes or symbols on the line are gates applied to that qubit.
  -Lines connecting gates (e.g., CNOT) show interactions between qubits.
  -The circuit ends with measurement, converting quantum states into classical bits.

Example (conceptual):

|0⟩ ── H ────●─────── M
              │
|0⟩ ──────────X────── M


This creates a Bell state and then measures both qubits.

Measurement

  -Measurement collapses the qubit into either 0 or 1.
  -Usually done at the end of the circuit, but can appear mid-circuit.
  -Results are classical values that we can use or analyze.

Why Quantum Circuits Matter
Quantum circuits allow us to:

- Describe quantum algorithms clearly
- Visualize operations step by step
- Implement programs on real quantum hardware
- Analyze performance and complexity

Every major quantum algorithm—from Grover’s search to Shor’s factoring—starts as a quantum circuit.`,
  },

  // Intermediate
  {
    id: "controlled-gates",
    title: "Controlled Gates (CNOT, CCNOT)",
    difficulty: "Intermediate",
    description: "Conditional multi-qubit operations",
    imageUrl: "/images/cnotandccnot.png",
    content: `CNOT and CCNOT Gates
CNOT Gate (Controlled-NOT)

The CNOT gate is a 2-qubit controlled gate.
It flips the target qubit only when the control qubit is |1⟩.

How it works:
  -Control = 0 → Target stays the same
  -Control = 1 → Target flips (0 ↔ 1)

Truth table:

Control  Target  →  Output
   0        0    →   00
   0        1    →   01
   1        0    →   11
   1        1    →   10

Matrix:

CNOT = [[1,0,0,0],
        [0,1,0,0],
        [0,0,0,1],
        [0,0,1,0]]


Use cases:
  -Creating entanglement (Bell states)
  -Quantum teleportation
  -Many fundamental quantum algorithms
  
CCNOT Gate (Toffoli Gate)

The CCNOT gate, also known as the Toffoli gate, is a 3-qubit gate.
It flips the target qubit only when both control qubits are |1⟩.

How it works:
  -If Control1 = 1 AND Control2 = 1 → Target flips
  -Otherwise → Target stays the same

simplified Truth table:

C1  C2  T   →  Output
0   0   T      0 0 T
0   1   T      0 1 T
1   0   T      1 0 T
1   1   0      1 1 1
1   1   1      1 1 0


Matrix size: 8×8 (since it acts on 3 qubits).

Use cases:
  -Quantum arithmetic (adders, multipliers)
  -Reversible classical logic
  -Building more complex multi-controlled gates
  -Essential in quantum error correction`,
    contentAfterImage: `
Notation Differences: CNOT vs CCNOT

CNOT (Controlled-NOT):
• Symbol: ⊕ with a control line (•)
• Circuit notation: Control qubit has a filled circle (•), target has ⊕
• Text representation: CNOT, CX, or sometimes just X with control
• Matrix notation: Often written as CX or CNOT
• Qiskit: cx(control, target)
• Cirq: CNOT(control, target)

CCNOT (Controlled-Controlled-NOT / Toffoli):
• Symbol: ⊕ with two control lines (• •)
• Circuit notation: Two control qubits have filled circles (•), target has ⊕
• Text representation: CCNOT, CCX, Toffoli, or T
• Matrix notation: Often written as CCX or Toffoli
• Qiskit: ccx(control1, control2, target)
• Cirq: TOFFOLI(control1, control2, target)

Key Visual Differences:
- CNOT: 1 control dot (•) → 1 target (⊕)
- CCNOT: 2 control dots (• •) → 1 target (⊕)
- Control qubits: Always represented by filled circles (•)
- Target qubits: Always represented by ⊕ (XOR symbol)`,
  },
  {
    id: "phase-gates",
    title: "Phase Gates and Rotations",
    difficulty: "Intermediate",
    description: "Manipulate quantum phase and angles",
    content: ` Phase Gates and Rotations

S gate: Adds π/2 phase to |1⟩
T gate: Adds π/4 phase to |1⟩

Rotations:
RX(θ), RY(θ), RZ(θ)

Used for phase control.`,
  },
  {
    id: "quantum-fourier",
    title: "Quantum Fourier Transform",
    difficulty: "Intermediate",
    description: "Core of many algorithms",
    content: `Quantum Fourier Transform (QFT)

The Quantum Fourier Transform (QFT) is the quantum version of the classical discrete Fourier transform (DFT). It transforms a quantum state into a new basis where periodic patterns become easy to detect. QFT is one of the most important tools in quantum algorithms.
What QFT Does
Given an input quantum state, the QFT maps each basis state |x⟩ to a superposition of all basis states with specific phase factors:
|x⟩ → (1/√N) Σ(k=0 to N-1) e^(2πixk/N) |k⟩

Where:
  - N = 2ⁿ for an n-qubit system
  - Phase factors encode periodic information
  This allows quantum algorithms to detect patterns and periodicity extremely fast.

Why QFT Is Important
QFT is a core component of several major quantum algorithms:
  - Shor's Algorithm (factoring and period finding)
  - Phase Estimation
  - Quantum chemistry simulations  
  - Hidden subgroup problems
  -It enables exponential speedups compared to classical Fourier transforms when used inside these algorithms.

How QFT Works in Circuits
A QFT circuit applies two main operations:
  - Hadamard gates – create superposition
  - Controlled phase rotations – add precise phase shifts

A simplified n-qubit QFT circuit looks like this:

q0 ── H ── R2 ── R3 ── ... ────────
q1 ────── H ── R2 ── ... ────────  
q2 ─────────── H ── ... ────────
...
qn ─────────────────── H ────────

Finally, the circuit ends with qubit swaps to reverse the bit order.

Key Properties
  - Runs in O(n²) gates (much faster than classical O(N log N))
  - Uses only Hadamard and controlled rotation gates
  - Completely reversible and unitary
  - Essential for extracting periodicity and phase information`,
  },
  {
    id: "phase-kickback",
    title: "Phase Kickback",
    difficulty: "Intermediate",
    description: "Eigensystem phase transfer",
    content: `Phase Kickback

Phase kickback is a fundamental quantum phenomenon where phase information from a target qubit "kicks back" to the control qubit in controlled operations. This mechanism is crucial for many quantum algorithms and allows us to extract eigenvalue information.

What Is Phase Kickback?

When we have a controlled unitary gate CU and the target qubit is in an eigenstate of U, something special happens:

If U|ψ⟩ = e^(iθ)|ψ⟩, then:
CU(|0⟩|ψ⟩) = |0⟩|ψ⟩  
CU(|1⟩|ψ⟩) = e^(iθ)|1⟩|ψ⟩

The phase e^(iθ) gets attached to the control qubit instead of staying on the target!

How It Works

1. Eigenstate Condition The target must be in an eigenstate of the unitary U
2. Controlled Application Apply controlled-U with the eigenstate as target  
3. Phase Transfer The eigenvalue phase appears on the control qubit
4. Information Extraction: We can now measure or manipulate this phase

Mathematical Example

Consider a controlled-Z gate with target in |+⟩ = (|0⟩ + |1⟩)/√2:

Z|+⟩ = (|0⟩ - |1⟩)/√2 = -|+⟩

So |+⟩ is an eigenstate of Z with eigenvalue -1.

When we apply CZ:
CZ|0⟩|+⟩ = |0⟩|+⟩
CZ|1⟩|+⟩ = -|1⟩|+⟩

The minus sign (phase) kicks back to the control!

Applications in Quantum Algorithms

- Quantum Phase Estimation: Extracts eigenvalue phases for solving linear systems
- Shor's Algorithm: Uses phase kickback to find periods for factoring
- Grover's Algorithm: The oracle uses phase kickback to mark target states  
- Quantum Counting: Counts solutions by estimating phases
- Amplitude Estimation: Generalizes Grover using phase estimation

Practical Implementation

Phase kickback is typically implemented using:
- Controlled rotation gates (CRz, CRy, CRx)
- Controlled-U gates where U has known eigenstates
- Ancilla qubits prepared in superposition states
- Phase estimation circuits for extracting the kicked-back phase

Why It's Powerful

Phase kickback allows quantum algorithms to:
- Extract hidden information about operators
- Perform computations "in the phase" without disturbing amplitudes  
- Enable exponential speedups in eigenvalue problems
- Connect discrete and continuous quantum operations

Understanding phase kickback is essential for mastering advanced quantum algorithms and designing new quantum protocols.`,
  },
  {
    id: "swap-gates",
    title: "SWAP and Fredkin Gates",
    difficulty: "Intermediate",
    description: "Qubit permutation operations",
    content: `# SWAP and Fredkin Gates

SWAP and Fredkin gates are fundamental permutation operations in quantum computing that exchange qubit states and enable complex routing and layout operations.

## SWAP Gate

The SWAP gate exchanges the states of two qubits:

Mathematical Definition:
- SWAP|00⟩ = |00⟩
- SWAP|01⟩ = |10⟩  
- SWAP|10⟩ = |01⟩
- SWAP|11⟩ = |11⟩

Matrix Representation:
\`\`\`
SWAP = [1 0 0 0]
       [0 0 1 0]
       [0 1 0 0]  
       [0 0 0 1]
\`\`\`

Circuit Implementation:
The SWAP gate can be decomposed into three CNOT gates:
- CNOT₁₂ (control on qubit 1, target on qubit 2)
- CNOT₂₁ (control on qubit 2, target on qubit 1)  
- CNOT₁₂ (control on qubit 1, target on qubit 2)

This decomposition is crucial for hardware implementations that don't have native SWAP gates.

 Fredkin Gate (Controlled-SWAP)

The Fredkin gate is a controlled version of SWAP that only swaps the target qubits when the control qubit is |1⟩.

Operation
- If control = |0⟩: target qubits unchanged
- If control = |1⟩: target qubits are swapped

Truth Table:
|c a b⟩ → |c a' b'⟩
- |000⟩ → |000⟩
- |001⟩ → |001⟩
- |010⟩ → |010⟩
- |011⟩ → |011⟩
- |100⟩ → |100⟩
- |101⟩ → |110⟩ (swap occurs)
- |110⟩ → |101⟩ (swap occurs)
- |111⟩ → |111⟩

## Practical Applications

Quantum Circuit Layout:
- Routing qubits through limited connectivity graphs
- Mapping logical qubits to physical qubits
- Optimizing gate sequences for hardware constraints

Quantum Algorithms:
- Quantum Sorting: SWAP networks for ordering quantum states
- Quantum Fourier Transform: Bit-reversal permutations
- Error Correction: Moving logical qubits for syndrome extraction

Quantum Simulation:
- Implementing fermionic anticommutation relations
- Jordan-Wigner transformations for spin systems
- Particle exchange symmetries in many-body problems

## Advanced Variations

iSWAP Gate:
Adds a phase to the swapped states:
- iSWAP|01⟩ = i|10⟩
- iSWAP|10⟩ = i|01⟩

√SWAP Gate:
Square root of SWAP, useful for gradual state exchange and adiabatic quantum computing.

SWAP Test:
Uses controlled-SWAP to measure overlap between quantum states:
P(measure control as |0⟩) = (1 + |⟨ψ|φ⟩|²)/2

 Implementation Considerations

Hardware Efficiency:
- Direct SWAP gates require specific connectivity
- Three-CNOT decomposition works on any connected pair
- Optimal routing minimizes total gate count

Error Rates:
- SWAP operations can accumulate errors
- Trade-off between routing convenience and fidelity
- Consider gate error rates when choosing decomposition

Understanding SWAP and Fredkin gates is essential for quantum circuit optimization, hardware-aware compilation, and implementing complex quantum algorithms efficiently.`,
  },
  {
    id: "deutsch-algorithm",
    title: "Deutsch-Jozsa Algorithm",
    difficulty: "Intermediate",
    description: "Constant vs balanced function test",
    content: ` Deutsch-Jozsa Algorithm

The Deutsch-Jozsa algorithm demonstrates quantum advantage by solving a specific computational problem with exponentially fewer function evaluations than any classical algorithm.

 Problem Statement

Given a black-box function f: {0,1}ⁿ → {0,1}, determine whether f is:
- Constant: f(x) = 0 for all x, or f(x) = 1 for all x
- Balanced: f(x) = 0 for exactly half the inputs, f(x) = 1 for the other half

 Classical Approach:
- Worst case: Need to evaluate f on 2ⁿ⁻¹ + 1 inputs
- For n = 100: Would require ~2⁹⁹ evaluations

Quantum Approach:
- Requires exactly ONE oracle evaluation
- Exponential speedup!

 Algorithm Steps

Step 1: Initialization
Start with n+1 qubits:
- n query qubits in |0⟩
- 1 ancilla qubit in |1⟩

Step 2: Create Superposition
Apply Hadamard gates to all qubits:
- Query register: H⊗ⁿ|0⟩ⁿ = 1/√2ⁿ ∑ₓ |x⟩
- Ancilla: H|1⟩ = (|0⟩ - |1⟩)/√2

Step 3: Oracle Query
Apply the oracle Uf once:
Uf|x⟩|y⟩ = |x⟩|y ⊕ f(x)⟩

After oracle, the state becomes:
1/√2ⁿ ∑ₓ (-1)^f(x) |x⟩ ⊗ (|0⟩ - |1⟩)/√2

Step 4: Final Hadamards  
Apply Hadamard gates to the query register:
H⊗ⁿ [1/√2ⁿ ∑ₓ (-1)^f(x) |x⟩]

Step 5: Measurement
Measure the query register in computational basis.

 Mathematical Analysis
After the final Hadamards, the amplitude of measuring |0⟩ⁿ is:

For Constant Functions:
- If f(x) = 0 ∀x: Amplitude = 1 → Always measure |0⟩ⁿ
- If f(x) = 1 ∀x: Amplitude = -1 → Always measure |0⟩ⁿ

For Balanced Functions:
- Positive and negative contributions cancel
- Amplitude = 0 → Never measure |0⟩ⁿ

 Circuit Implementation
\`\`\`
|0⟩ ——[H]——[Uf]——[H]——[M]
|0⟩ ——[H]——[  ]——[H]——[M]
 ⋮    ⋮     ⋮     ⋮     ⋮
|0⟩ ——[H]——[  ]——[H]——[M]
|1⟩ ——[H]——[  ]—————————————
\`\`\`

 Example: 2-Bit Function

Consider f: {00,01,10,11} → {0,1}

Constant f(x) = 0:
- After oracle: +|00⟩ + |01⟩ + |10⟩ + |11⟩
- After final H: Measure |00⟩ with probability 1

Balanced f(x) = x₁ ⊕ x₂:  
- After oracle: +|00⟩ - |01⟩ - |10⟩ + |11⟩
- After final H: Measure |00⟩ with probability 0

 Practical Considerations

Oracle Implementation:
- Must be reversible (unitary)
- Often uses ancilla qubits for complex functions
- Phase oracle: Uf|x⟩ = (-1)^f(x)|x⟩

Noise Effects:
- Algorithm is relatively robust to oracle errors
- Final measurement error can lead to misclassification
- Error correction may be needed for large n

Extensions:
- Deutsch's Algorithm: Special case for n=1
- Bernstein-Vazirani: Finds hidden bit string
- Simon's Algorithm: Finds hidden period

 Significance

The Deutsch-Jozsa algorithm:
- First to show exponential quantum advantage
- Inspired development of other quantum algorithms
- Demonstrates quantum parallelism and interference
- Foundation for understanding oracle-based quantum computing

While the problem is somewhat artificial, it proves that quantum computers can solve certain problems exponentially faster than classical computers, establishing the theoretical foundation for quantum advantage.`,
  },
  {
    id: "grover-amplitude",
    title: "Grover's Algorithm - Amplitude Amplification",
    difficulty: "Intermediate",
    description: "Quadratic speedup for search",
    content: ` Grover's Algorithm & Amplitude Amplification

Grover's algorithm provides a quadratic speedup for unstructured search problems and demonstrates the power of amplitude amplification in quantum computing.

 The Search Problem

Classical Search:
- Search through N unsorted items for a marked item
- Best strategy: Random sampling or exhaustive search
- Time complexity: O(N) evaluations on average

Quantum Search:
- Grover's algorithm finds the marked item in O(√N) evaluations
- Quadratic speedup - significant for large databases
- Optimal quantum search algorithm (proven by Bennett et al.)

 Algorithm Overview

Setup:
- n qubits representing N = 2ⁿ items
- Oracle function f(x) = 1 if x is the target, 0 otherwise
- Goal: Find x such that f(x) = 1

Key Insight:
Rotate the quantum state vector in the 2D subspace spanned by:
- |ψ⟩ = uniform superposition of non-target states  
- |w⟩ = uniform superposition of target states

 Detailed Algorithm Steps

Step 1: Initialization
Create uniform superposition:
|s⟩ = H⊗ⁿ|0⟩ⁿ = 1/√N ∑ₓ |x⟩

Step 2: Grover Iteration
Repeat the following G = ⌊π√N/4⌋ times:

a) Oracle Operation (O):
   O|x⟩ = (-1)^f(x)|x⟩
   - Flips amplitude of target states
   - Reflection about |ψ⟩

b) Diffusion Operator (D):
   D = 2|s⟩⟨s| - I
   - Reflection about uniform superposition
   - Also called "inversion about average"

Step 3: Measurement
Measure in computational basis to obtain the target with high probability.

 Geometric Interpretation

The algorithm performs rotations in a 2D subspace:

Initial State: |s⟩ = √(N-M)/N |ψ⟩ + √M/N |w⟩
- |ψ⟩: superposition of N-M non-targets  
- |w⟩: superposition of M targets
- θ = arcsin(√M/N) is initial angle

Each Grover Iteration:
- Oracle: Reflection across |ψ⟩ (changes angle by π-2θ)
- Diffusion: Reflection across |s⟩ (changes angle by π-2θ)  
- Net effect: Rotation by 2θ toward |w⟩

Optimal Iterations:
G = ⌊π/(4θ)⌋ ≈ ⌊π√N/(4√M)⌋

 Circuit Implementation

\`\`\`
|0⟩ ——[H]——[O]——[H]——[Z]——[H]——[M]
|0⟩ ——[H]——[ ]——[H]——[Z]——[H]——[M]
 ⋮     ⋮   ⋮   ⋮   ⋮   ⋮    ⋮
|0⟩ ——[H]——[ ]——[H]——[Z]——[H]——[M]
       ↑              ↑
    Superposition  Diffusion
\`\`\`

The diffusion operator can be implemented as:
D = H⊗ⁿ(2|0⟩⟨0| - I)H⊗ⁿ

 Amplitude Amplification Generalization

General Framework:
- Start with arbitrary initial state |ψ⟩
- Define "good" subspace marked by oracle
- Use selective rotations to amplify good amplitudes

Operators:
- Q = -A·S₀·A⁻¹·Sχ
- A: State preparation operator  
- S₀: Reflection about |0⟩
- Sχ: Reflection about good states

Applications Beyond Search:
- Quantum Monte Carlo methods
- Solving linear systems (HHL algorithm)
- Amplitude estimation
- Quantum machine learning

 Practical Examples

Database Search:
- N = 10⁶ entries, M = 1 target
- Classical: ~500,000 queries on average
- Grover: ~785 queries (√N/2)

Multiple Targets:
- M targets among N items
- Success probability after G iterations: sin²((2G+1)θ)
- Optimal G = π√N/(4√M) - 1/2

Approximate Search:
- Unknown number of targets
- Use quantum counting or iterative amplitude estimation
- Trade-off between success probability and query complexity

 Error Analysis and Robustness

Phase Errors:
- Oracle phase errors reduce success probability
- Algorithm relatively robust to small phase deviations

Amplitude Errors:  
- Unitary errors in diffusion operator affect convergence
- Can be mitigated with error correction

Decoherence:
- T₂ time must exceed algorithm duration
- Requires ~√N coherent operations

 Advanced Variations
Fixed-Point Quantum Search:
- Avoids over-rotation problem
- Success probability doesn't oscillate
- Uses variable-angle rotations

Partial Grover Search:
- Interrupt algorithm before optimum
- Useful when approximation suffices
- Reduces decoherence effects

Nested Grover Search:
- Search within search problems
- Quantum walks on graphs
- Hierarchical optimization

 Significance and Impact

Grover's algorithm demonstrates:
- Fundamental Limits: Optimal unstructured search bound
- Quantum Advantage: Clear quadratic speedup over classical
- Practical Relevance: Applications in cryptography, optimization, machine learning
- Theoretical Foundation: Template for other amplitude amplification algorithms

The algorithm bridges theoretical quantum computing with practical applications, showing how quantum interference can be harnessed for computational advantage while remaining implementable on near-term quantum devices.`,
    quiz: [
      {
        id: "q1",
        question: "What is the time complexity of Grover's algorithm for searching N items?",
        options: [
          "O(N)",
          "O(log N)",
          "O(√N)",
          "O(N²)"
        ],
        correctAnswer: 2,
        explanation: "Grover's algorithm provides a quadratic speedup, reducing the search time from O(N) classically to O(√N) quantumly."
      },
      {
        id: "q2",
        question: "How many iterations does Grover's algorithm need for optimal results?",
        options: [
          "Exactly N iterations",
          "Approximately π√N/4 iterations",
          "Log N iterations",
          "One iteration is always enough"
        ],
        correctAnswer: 1,
        explanation: "The optimal number of iterations is approximately π√N/4 to maximize the probability of finding the target state."
      }
    ]
  },
  {
    id: "quantum-phase-estimation",
    title: "Quantum Phase Estimation",
    difficulty: "Intermediate",
    description: "Estimate eigenvalue phases",
    content: ` Quantum Phase Estimation (QPE)

Quantum Phase Estimation (QPE)

Purpose:
QPE estimates the phase 𝜙 of an eigenvalue 𝑒^2𝜋𝑖𝜙of a unitary operator 𝑈
 given its eigenvector∣u⟩.

Input & Output

Input: Unitary 
𝑈, eigenstate∣u⟩, 𝑡 qubits for precision.

Output: 
𝑡-bit approximation of 𝜙.

Algorithm Steps

  1.Initialize: Control register in ∣0⟩ ^ ⊗ t, target in ∣u⟩.

  2.Hadamard: Apply H ^ ⊗t to control qubits.
  3.Controlled-U: Apply controlled-U^2^j for each control qubit.
  4.Inverse QFT: Apply QFT⁻¹ on the control register.
  5.Measure: Get a binary approximation of 𝜙.

Complexity
O(t²) for QFT⁻¹ + O(t·cost(U)) for controlled-U operations.

Applications
  -Shor’s algorithm
  -Quantum simulations
  -Eigenvalue estimation in quantum chemistry.`,
  },

  // Advanced
  {
    id: "qaoa",
    title: "Quantum Approximate Optimization Algorithm (QAOA)",
    difficulty: "Advanced",
    description: "Hybrid variational optimization",
    content: ` Quantum Approximate Optimization Algorithm (QAOA)

 What it is:
A hybrid quantum-classical algorithm designed to solve combinatorial optimization problems. QAOA was introduced by Farhi et al. in 2014 as one of the first algorithms specifically designed for near-term quantum devices.

 How it works:

 Core Components:
• Problem Hamiltonian (Hp): Encodes the optimization objective
• Mixer Hamiltonian (Hm): Enables transitions between states
• Parameterized circuit: Alternates between Hp and Hm layers
• Classical optimizer: Adjusts parameters (γ, β) to minimize cost

 Algorithm Steps:
1. Initialize qubits in equal superposition |+⟩
2. Apply problem Hamiltonian: e^(-iγHp)
3. Apply mixer Hamiltonian: e^(-iβHm)
4. Repeat steps 2-3 for p layers (depth)
5. Measure to get candidate solution
6. Classical optimizer updates γ and β
7. Iterate until convergence

 Mathematical Form:
|ψ(γ,β)⟩ = e^(-iβₚHm)e^(-iγₚHp)...e^(-iβ₁Hm)e^(-iγ₁Hp)|+⟩ⁿ

 Key Properties:
• Depth p controls approximation quality
• Higher p → better solutions but longer circuits
• Universal for optimization (proven at p→∞)
• Performance depends on problem structure

 Why it matters:
• NISQ-compatible: Works on current noisy devices
• Proven quantum advantage for certain problems
• Bridges near-term and fault-tolerant eras
• Extensible framework for many problem types

 Applications:
• MaxCut and graph partitioning
• Portfolio optimization in finance
• Vehicle routing and logistics
• Job scheduling and resource allocation
• Protein folding (simplified models)
• Machine learning feature selection

 Challenges:
• Parameter optimization landscape (barren plateaus)
• Optimal depth p unknown for most problems
• Classical simulation limits understanding
• Noise sensitivity increases with depth`,
    quiz: [
      {
        id: "q1",
        question: "What does QAOA stand for?",
        options: [
          "Quantum Amplitude Optimization Algorithm",
          "Quantum Approximate Optimization Algorithm",
          "Quantum Automatic Operation Algorithm",
          "Quantum Advanced Optical Algorithm"
        ],
        correctAnswer: 1,
        explanation: "QAOA stands for Quantum Approximate Optimization Algorithm, designed for combinatorial optimization problems."
      },
      {
        id: "q2",
        question: "What type of algorithm is QAOA?",
        options: [
          "Purely quantum",
          "Purely classical",
          "Hybrid quantum-classical",
          "Photonic only"
        ],
        correctAnswer: 2,
        explanation: "QAOA is a hybrid algorithm that uses quantum circuits for state preparation and classical optimization to adjust parameters."
      },
      {
        id: "q3",
        question: "What happens as the depth parameter p increases in QAOA?",
        options: [
          "Solutions get worse",
          "Solutions can improve but circuits get longer",
          "Runtime decreases",
          "Number of qubits decreases"
        ],
        correctAnswer: 1,
        explanation: "Higher depth p can lead to better approximations but requires longer quantum circuits, which are more susceptible to noise."
      }
    ]
  },
  {
    id: "quantum-walks",
    title: "Quantum Walks",
    difficulty: "Advanced",
    description: "Quantum analog of random walks",
    content: ` Quantum Walks

 What they are:
The quantum mechanical analog of classical random walks, where a quantum particle traverses a graph or lattice following superposition and interference rules rather than probabilistic transitions.

 Types of Quantum Walks:

 1. Discrete-Time Quantum Walk (DTQW):
• Requires "coin" qubit for direction
• Position and coin evolve in discrete steps
• Coin operation: Hadamard or other unitary
• Shift operation: Controlled displacement
• Mathematically: |ψ⟩ₜ₊₁ = S(C ⊗ I)|ψ⟩ₜ

 2. Continuous-Time Quantum Walk (CTQW):
• No coin needed, evolves continuously
• Governed by Schrödinger equation
• Hamiltonian = graph adjacency matrix
• Evolution: |ψ(t)⟩ = e^(-iHt)|ψ(0)⟩
• More natural for some applications

 3. Staggered Quantum Walk:
• Tessellation-based approach
• No coin space required
• Flexible for irregular graphs

 Key Differences from Classical:

 Classical Random Walk:
• Binomial/Gaussian spreading
• Variance ∝ t (time)
• Incoherent mixing

 Quantum Walk:
• Ballistic spreading (faster)
• Variance ∝ t² (quadratic speedup)
• Coherent interference patterns
• Recurrence and revival phenomena

 Mathematical Framework:
• Hilbert space: position ⊗ coin
• Coin operator C: acts on coin space
• Shift operator S: position-dependent
• Complete step: U = S · (C ⊗ I)

 Interference Effects:
• Constructive interference in certain directions
• Destructive interference prevents backtracking
• Creates asymmetric probability distributions
• Enables faster exploration than classical

 Why they matter:
• Fundamental quantum primitive
• Provable speedup over classical walks
• Universal for quantum computation
• Natural framework for many algorithms
• Bridge between quantum algorithms and physics

 Applications:

 1. Search Algorithms:
   • Spatial search on graphs
   • Element distinctness
   • Triangle finding

 2. Graph Problems:
   • Connectivity testing
   • Graph isomorphism
   • Centrality measures

 3. Quantum Simulation:
   • Transport phenomena
   • Anderson localization
   • Topological phases

 4. Machine Learning:
   • Quantum recommendation systems
   • Classification algorithms
   • Graph neural networks

 5. Sampling:
   • Boson sampling variants
   • Quantum walks on random graphs

 Notable Results:
• Exponential speedup on glued trees (Childs et al.)
• Quadratic speedup for spatial search (Grover-like)
• Universal computation via scattering walks
• Quantum advantage demonstrated experimentally

 Implementation Considerations:
• Graph encoding in quantum circuits
• Efficient coin operators
• Position-dependent phase shifts
• Measurement strategies

 Current Research:
• Non-Markovian quantum walks
• Walks with topological protection
• Multi-particle walks and collisions
• Decoherence effects and mitigation`,
  },
  {
    id: "quantum-error-correction",
    title: "Quantum Error Correction Codes",
    difficulty: "Advanced",
    description: "Protect quantum information from noise",
    content: ` Quantum Error Correction Codes

 The Problem:
Quantum information is fragile and susceptible to decoherence and operational errors. Unlike classical bits, quantum states cannot be copied (no-cloning theorem), making error correction fundamentally challenging.

 Core Principles:

 No-Cloning Barrier:
• Cannot copy unknown quantum states
• Must use entanglement-based redundancy
• Syndrome measurement without state collapse
• Clever encoding in subspaces

 Types of Errors:

 1. Bit-flip (X error):
   • |0⟩ ↔ |1⟩ flip
   • Analogous to classical bit error

 2. Phase-flip (Z error):
   • Sign flip: |+⟩ ↔ |-⟩
   • No classical analog
   • Affects superposition phases

 3. Combined (Y error):
   • Y = iXZ (both bit and phase)
   • Most general single-qubit error

 4. Erasure:
   • Known location, unknown type
   • Easier to correct than arbitrary errors

 Error Correction Codes:

 1. Repetition Code (3-qubit):
   • Logical |0⟩ = |000⟩, |1⟩ = |111⟩
   • Protects against single bit-flip
   • Syndrome: measure ZZ parities
   • Cannot correct phase errors

 2. Phase-flip Code:
   • Dual to bit-flip code
   • |+⟩ and |-⟩ basis encoding
   • Corrects phase errors only

 3. Shor's 9-qubit Code:
   • Concatenates bit and phase codes
   • First code to correct arbitrary errors
   • Logical qubit encoded in 9 physical
   • Distance-3 code (corrects 1 error)

 4. Steane Code (7-qubit):
   • CSS code based on [7,4,3] Hamming
   • More efficient than Shor's code
   • Transversal gates enable fault tolerance
   • Logical |0⟩ = equal superposition of even parity

 5. Surface Codes:
   • Most practical for 2D architectures
   • Qubits on lattice vertices/edges
   • Stabilizers on plaquettes and vertices
   • Distance d requires ~d² physical qubits
   • Threshold ~1% error rate
   • Currently leading candidate for fault tolerance

 6. Color Codes:
   • 2D topological codes
   • Richer gate set than surface codes
   • More complex decoding

 7. Quantum LDPC Codes:
   • Low-density parity check
   • Better encoding rates
   • Active research area

 Stabilizer Formalism:

 Key Concepts:
• Stabilizer group: Pauli operators that fix code space
• Syndrome: eigenvalues of stabilizer measurements
• Error detection without state collapse
• Commuting observables enable measurement

 Error Detection Process:
1. Measure stabilizer generators
2. Extract syndrome (error pattern signature)
3. Deduce error location and type
4. Apply corrective operation
5. No information about encoded state revealed

 Distance and Thresholds:

 Code Distance d:
• Minimum weight of logical operator
• Can correct ⌊(d-1)/2⌋ errors
• Trade-off: distance vs qubit overhead

 Threshold Theorem:
• If physical error rate < threshold
• Logical error rate can be arbitrarily suppressed
• Requires fault-tolerant operations
• Surface code threshold ~0.5-1%

 Fault-Tolerant Operations:

 Requirements:
• Errors don't propagate uncontrollably
• Encoded operations preserve code space
• Syndrome extraction is fault-tolerant

 Techniques:
• Transversal gates (gate on each qubit)
• Code deformation
• Magic state distillation (for T gates)
• Lattice surgery

 Overhead Estimates:
• Distance-17 surface code: ~1,000 qubits per logical
• Factoring RSA-2048: ~20 million qubits
• Active research reducing requirements

 Challenges:

 1. Resource Overhead:
   • Many physical qubits per logical
   • Increases circuit depth/time

 2. Decoding Complexity:
   • Syndrome → error mapping
   • Must be real-time for errors
   • Surface codes: minimum-weight perfect matching

 3. Measurement Errors:
   • Syndrome extraction can fail
   • Requires repeated measurements
   • Additional ancilla overhead

 4. Correlated Errors:
   • Codes assume independent errors
   • Crosstalk breaks assumptions

 Current Status:
• Logical qubits demonstrated in labs
• Google: surface code experiments
• IBM: heavy-hex lattice for surface codes
• IonQ/Quantinuum: reconfigurable geometries
• Race toward practical fault tolerance`,
  },
  {
    id: "quantum-teleportation",
    title: "Quantum Teleportation",
    difficulty: "Advanced",
    description: "Transmit unknown quantum states",
    content: ` Quantum Teleportation

 What it is:
A protocol to transfer an unknown quantum state from one location to another using entanglement and classical communication, without physically transmitting the quantum particle itself.

 Historical Context:
• Proposed by Bennett et al. (1993)
• First experimental demonstration (1997)
• Does NOT violate special relativity
• Name inspired by sci-fi, but fundamentally different

 The Protocol:

 Setup:
• Alice has unknown state |ψ⟩ = α|0⟩ + β|1⟩
• Alice and Bob share entangled Bell pair
• Goal: Transfer |ψ⟩ to Bob

 Step-by-Step Process:

1. Shared Entanglement:
   • Alice and Bob share |Φ+⟩ = (|00⟩+|11⟩)/√2
   • Created beforehand or distributed

2. Bell State Measurement:
   • Alice entangles her qubit with shared pair
   • Performs joint measurement in Bell basis
   • Gets one of 4 outcomes (2 classical bits)
   • Alice's qubit is destroyed (no-cloning)

3. Classical Communication:
   • Alice sends 2 classical bits to Bob
   • This step is rate-limiting
   • Cannot exceed speed of light

4. Conditional Operation:
   • Bob applies correction based on bits:
     - 00: Do nothing (I)
     - 01: Apply X gate
     - 10: Apply Z gate
     - 11: Apply XZ gates
   • Bob's qubit now in state |ψ⟩

 Mathematical Description:

Initial State:
|ψ⟩_A ⊗ |Φ+⟩_AB = (α|0⟩+β|1⟩) ⊗ (|00⟩+|11⟩)/√2

After Bell Measurement:
1/2[|Φ+⟩(α|0⟩+β|1⟩) + |Φ-⟩(α|0⟩-β|1⟩)
    + |Ψ+⟩(α|1⟩+β|0⟩) + |Ψ-⟩(α|1⟩-β|0⟩)]

Correction Operations:
• Φ+ → I
• Φ- → Z
• Ψ+ → X
• Ψ- → XZ

 Key Properties:

 Not Faster Than Light:
• Classical bits must be sent
• No information until correction applied
• Respects causality

 Perfect Fidelity:
• Exact state transfer (in principle)
• Limited by experimental imperfections
• No approximation or cloning

 State Destruction:
• Original state is destroyed
• Measurement collapses Alice's qubit
• Satisfies no-cloning theorem

 Works for Unknown States:
• α and β need not be known
• Works for any valid quantum state
• Can teleport entanglement

 Why It Matters:

 1. Quantum Communication:
   • Transfer states between processors
   • Quantum internet backbone
   • Distributed quantum computing

 2. Quantum Repeaters:
   • Extend entanglement over distance
   • Overcome photon loss
   • Essential for long-distance QKD

 3. Quantum Networks:
   • Connect quantum computers
   • Distributed quantum sensing
   • Cloud quantum computing

 4. Fundamental Physics:
   • Tests quantum mechanics
   • Explores entanglement nature
   • Quantum-to-classical boundary

 Experimental Achievements:

 Milestones:
• 1997: First photonic teleportation (Innsbruck)
• 2004: Deterministic atomic teleportation
• 2012: Over 143 km free space (Canary Islands)
• 2017: Satellite-based (China, 1400 km)
• 2019: Teleportation of 3-qubit state
• 2022: Continuous variable teleportation

 Record Distances:
• Ground-based: >100 km fiber
• Free-space: >1000 km satellite
• Fidelity: >90% routinely achieved

 Variations and Extensions:

 1. Remote State Preparation:
   • Alice knows state beforehand
   • Requires only 1 classical bit
   • More efficient for known states

 2. Entanglement Swapping:
   • Create entanglement between distant parties
   • Neither party initially entangled
   • Key for quantum repeaters

 3. Gate Teleportation:
   • Teleport quantum operations
   • Enables measurement-based computing
   • Clifford gates via teleportation

 4. Port-Based Teleportation:
   • Deterministic, no corrections
   • Requires many entangled pairs
   • Better for certain applications

 5. Continuous Variable:
   • Infinite-dimensional states
   • Gaussian operations
   • Simpler experimentally in some systems

 Challenges:

 Technical:
• Maintaining entanglement quality
• Efficient Bell state measurement
• Detector efficiency (loopholes)
• Synchronization over distance

 Fundamental:
• Cannot be used for communication alone
• Requires pre-shared entanglement
• 2-bit classical channel needed

 Applications in Development:

 Quantum Internet:
• Nodes connected via teleportation
• Distributed quantum algorithms
• Global quantum key distribution

 Modular Quantum Computing:
• Connect small quantum processors
• Teleport states between modules
• Scale beyond monolithic devices

 Quantum Sensing Networks:
• Entanglement-enhanced sensing
• Synchronized distant clocks
• Gravitational wave detection`,
  },
  {
    id: "quantum-key-distribution",
    title: "Quantum Key Distribution (BB84)",
    difficulty: "Advanced",
    description: "Unconditionally secure key exchange",
    content: ` Quantum Key Distribution (BB84)

 What it is:
A protocol that uses quantum mechanics to establish a shared secret key between two parties with information-theoretic security. Eavesdropping is detectable due to quantum measurement disturbance.

 Historical Background:
• Proposed by Bennett & Brassard (1984)
• First QKD protocol
• Based on Wiesner's conjugate coding (1970s)
• Foundation of quantum cryptography

 Security Principle:

 Fundamental Guarantee:
• Eavesdropping MUST disturb quantum states
• Disturbance is detectable
• Security based on physics, not computational hardness
• Unconditional security (information-theoretic)

 No-Cloning Theorem:
• Eve cannot copy unknown quantum states
• Measurement collapses superposition
• Cannot intercept and retransmit perfectly

 The BB84 Protocol:

 Step 1: Quantum Transmission
Alice's Actions:
• Generates random bit string
• Chooses random basis for each bit:
  - Rectilinear: {|0⟩, |1⟩} (computational basis)
  - Diagonal: {|+⟩, |-⟩} (Hadamard basis)
• Encodes bits in chosen bases
• Sends quantum states to Bob

Example:
Bits:     1 0 1 1 0 1 0 0
Bases:    + × + × + × × +
States:   |- |0⟩ |- |-⟩ |+⟩ |-⟩ |1⟩ |0⟩

 Step 2: Bob's Measurement
• Chooses random measurement basis
• Measures each received state
• Records results

Bob's bases:  + + × × + × + ×
Bob's results: 1 ? ? 1 0 1 ? ?
(? = wrong basis, random outcome)

 Step 3: Public Basis Reconciliation
• Alice announces her basis choices (NOT bits)
• Bob announces his basis choices
• Keep only matching basis measurements
• Discard mismatched ~50% of bits

Matching:    Y N N Y Y Y N N
Sifted key:  1     1 0 1

 Step 4: Error Detection
• Compare subset of sifted key publicly
• Check quantum bit error rate (QBER)
• QBER > threshold → abort (eavesdropping)
• QBER < threshold → proceed

Expected QBER:
• No eavesdropping: ~0% (+ experimental errors)
• With eavesdropping: ≥25% (provable)

 Step 5: Error Correction
• Use classical codes to correct errors
• Information reconciliation
• Some key material consumed

 Step 6: Privacy Amplification
• Hash remaining key to shorter string
• Removes Eve's partial information
• Final key is secure

 Security Analysis:

 Eve's Attack Strategies:

1. Intercept-Resend:
   • Eve measures in random basis
   • Resends measured state
   • Creates 25% error rate
   • Easily detected

2. Entangling Probe:
   • Eve couples ancilla to channel
   • Measures ancilla later
   • More sophisticated but still detectable

3. Collective Attack:
   • Optimal eavesdropping strategy
   • Proven limits on Eve's information

 Information-Theoretic Security:
• Proven secure against any attack (even quantum)
• Based on fundamental physics limits
• Does not rely on computational assumptions
• Remains secure against future computers

 Practical Considerations:

 Channel Requirements:
• Low-loss quantum channel (fiber or free-space)
• Single-photon sources (ideally)
• Efficient single-photon detectors
• Low dark count rates

 Distance Limitations:
• Fiber optics: ~100-200 km (attenuation)
• Free-space: >1000 km (via satellite)
• No amplification (no-cloning)
• Requires quantum repeaters for long distance

 Key Rate:
• Depends on distance and losses
• Typical: kbps to Mbps at short distance
• Decreases exponentially with distance
• Formula: R ∝ η² (η = channel efficiency)

 Real-World Imperfections:

 Device Issues:
• Multi-photon pulses (PNS attacks)
• Detector efficiency mismatch
• Basis-dependent losses
• Side-channel vulnerabilities

 Solutions - Device-Independent QKD:
• Security without trusting devices
• Based on Bell inequality violations
• Requires loophole-free Bell tests
• More stringent requirements

 Measurement-Device-Independent:
• Removes detector side-channels
• Trusted source, untrusted measurement
• Practical middle ground

 Variants and Improvements:

 1. E91 Protocol (Ekert 1991):
   • Uses entangled pairs
   • Bell inequality test for security
   • More complex but elegant

 2. Continuous Variable QKD:
   • Gaussian states and homodyne detection
   • Easier to implement with standard telecom
   • Different security proofs

 3. Decoy State Protocol:
   • Mitigates photon-number-splitting attacks
   • Uses varying intensity levels
   • Now standard in implementations

 4. Twin-Field QKD:
   • Overcomes rate-distance limit
   • Single-photon interference at midpoint
   • Key rate ∝ η (not η²)

 Experimental Achievements:

 Commercial Systems:
• ID Quantique (Switzerland)
• Toshiba (UK/Japan)
• QuantumCTek (China)
• Deployed in banks, governments

 Large-Scale Networks:
• DARPA Quantum Network (2004-2008)
• SECOQC Vienna (2008)
• Tokyo QKD Network (2010)
• China's nationwide network (2017+)
• Quantum-safe metro networks

 Satellite QKD:
• Micius satellite (China, 2016)
• 1200 km ground-to-satellite
• Intercontinental QKD demonstrated
• Space-based global quantum network

 Current Records:
• Distance: 1120 km (satellite)
• Terrestrial: 830 km (twin-field)
• Key rate: >10 Mbps at short distance
• Continuous operation: years

 Integration with Classical Crypto:

 Hybrid Approach:
• QKD generates symmetric keys
• Keys encrypt classical data (AES)
• Or seed one-time pads
• Post-quantum + quantum security

 Challenges Ahead:

 Technical:
• Cost reduction
• Integration with existing infrastructure
• Daylight operation (satellite)
• Higher key rates

 Fundamental:
• Authenticated classical channel needed
• Trusted nodes in networks (currently)
• Quantum repeaters (in development)

 Adoption:
• Standards (ETSI, ITU working)
• Interoperability
• Cost-benefit analysis
• Education and trust

 Future Outlook:
• Quantum internet backbone
• Critical infrastructure protection
• Long-term data security
• Satellite constellation for global coverage
• Integration with 6G networks`,
  },
  {
    id: "amplitude-estimation",
    title: "Amplitude Estimation",
    difficulty: "Advanced",
    description: "Quadratic speedup in amplitude evaluation",
    content: ` Amplitude Estimation

 What it is:
A quantum algorithm that estimates the amplitude (probability) of measuring a particular state, achieving quadratic speedup over classical Monte Carlo methods. It's a generalization of Grover's algorithm.

 The Problem:

 Setup:
Given a unitary operator A where:
A|0⟩ = √a|ψ₁⟩ + √(1-a)|ψ₀⟩

Goal: Estimate the value of 'a' (amplitude squared)

Classical Approach:
• Prepare state and measure repeatedly
• Estimate a ≈ (# of |ψ₁⟩ outcomes) / (total measurements)
• Requires O(1/ε²) samples for precision ε
• Standard deviation ∝ 1/√N

 The Quantum Algorithm:

 Core Technique:
• Uses phase estimation on Grover operator
• Grover operator eigenvalues encode amplitude
• Extract phase → extract amplitude
• Achieves O(1/ε) scaling

 Key Components:

1. Grover Operator Q:
   Q = AS₀A†Sψ₁
   Where:
   • S₀ = I - 2|0⟩⟨0| (reflection about |0⟩)
   • Sψ₁ = I - 2|ψ₁⟩⟨ψ₁| (oracle reflection)

2. Eigenvalue Structure:
   Q has eigenvalues e^(±2πiθ)
   Where: a = sin²(πθ)
   Thus: θ encodes the amplitude

3. Phase Estimation:
   • Apply quantum phase estimation to Q
   • Estimate θ with precision δ
   • Convert θ → a = sin²(πθ)

 Algorithm Steps:

Step 1: State Preparation
• Prepare n qubits in |0⟩ (counting register)
• Prepare m qubits with A|0⟩ (state register)

Step 2: Quantum Phase Estimation
• Apply Hadamards to counting register
• Apply controlled-Q^(2^k) operations
• Inverse QFT on counting register

Step 3: Measurement
• Measure counting register → get θ̃
• Compute ã = sin²(πθ̃)

Step 4: Classical Post-Processing
• Statistical estimation if multiple runs
• Confidence intervals
• Error analysis

 Complexity Analysis:

 Query Complexity:
• Classical: O(1/ε²) queries to A
• Quantum: O(1/ε) queries to Q (contains A)
• Quadratic speedup

 Circuit Depth:
• Controlled Q operations: O(1/ε)
• QFT: O(n²) where n = log(1/ε)
• Total: O(1/ε · log²(1/ε))

 Qubit Count:
• Counting: n = log(1/ε)
• State: m (problem-dependent)
• Ancillas for Q

 Precision:
• Error ε with probability 1-δ
• Can be made arbitrarily small
• Trade-off with resources

 Applications:

 1. Monte Carlo Integration:
Problem: Estimate ∫ f(x)dx

Quantum Approach:
• Encode f into amplitude
• Apply amplitude estimation
• Quadratic speedup over MC

Use Cases:
• Financial risk analysis
• Option pricing
• Portfolio optimization
• Risk management (VaR, CVaR)

 2. Counting Problems:
Problem: Count solutions to decision problem

Approach:
• Prepare superposition over search space
• Oracle marks solutions
• AE estimates fraction of solutions

Examples:
• SAT solution counting
• Graph coloring enumeration
• Subset sum counting

 3. Machine Learning:

Classification:
• Estimate class probabilities
• Quantum speedup in inference

Training:
• Loss function evaluation
• Gradient estimation (with caveats)

Quantum Advantage:
• Faster expectation value estimates
• Accelerate certain ML subroutines

 4. Quantum Chemistry:
• Estimate overlap integrals
• Born-Oppenheimer surface sampling
• Reaction rate calculations

 5. Optimization:
• Evaluate objective functions
• Constraint satisfaction checking
• Hybrid quantum-classical loops

 Mathematical Details:

 Grover Operator Analysis:
Eigenspaces:
• |ψ+⟩ = cos(θ)|ψ₀⟩ + sin(θ)|ψ₁⟩ → e^(i2πθ)
• |ψ-⟩ = sin(θ)|ψ₀⟩ - cos(θ)|ψ₁⟩ → e^(-i2πθ)

Geometric Picture:
• Q rotates in 2D subspace
• Rotation angle: 2θ per application
• Phase estimation measures rotation rate

 Maximum Likelihood Estimation:
• Multiple phase estimates
• Statistical combination
• Improved precision

 Error Analysis:
Total Error = Approximation + Estimation
• Approximation: finite n (counting qubits)
• Estimation: statistical fluctuations
• Both controlled independently

 Variants and Extensions:

 1. Iterative Amplitude Estimation:
• Uses single ancilla qubit
• Multiple rounds of estimation
• More NISQ-friendly
• Saves qubits, costs time

 2. Canonical Amplitude Estimation:
• Optimal measurement strategy
• Maximum likelihood inference
• Better sample efficiency

 3. Amplitude Amplification:
• Find good state (not just estimate)
• Deterministic variant (if a known)
• Broader applicability

 4. Quantum Counting:
• Specific to counting problems
• Directly estimates number of solutions

 Practical Considerations:

 Oracle Construction:
• Must efficiently implement A
• Oracle for Sψ₁
• Determines practical speedup

 Noise Sensitivity:
• Coherent errors accumulate
• Phase estimation sensitive
• Error mitigation crucial

 State Preparation:
• A must be efficient
• Amplitude encoding overhead
• Data loading bottleneck

 Comparison with Grover:

 Grover's Algorithm:
• Find marked state (search)
• Requires knowing a (or assume small)
• Iterates √(1/a) times

 Amplitude Estimation:
• Estimate a (measurement)
• No prior knowledge of a
• Phase estimation-based
• Generalizes Grover

Relationship:
AE uses Grover operator but different goal

 Quantum Advantage Analysis:

 When Quadratic Speedup Matters:
• High-precision requirements (small ε)
• Classical: 10⁸ samples for ε=10⁻⁴
• Quantum: 10⁴ queries
• Massive savings

 Caveats:
• Oracle overhead
• Qubit requirements
• Coherence time limits
• Classical post-processing

 Threshold for Advantage:
Problem-dependent, typically:
• Large state spaces
• Expensive function evaluations
• High precision needs

 Recent Developments:

 2019-Present:
• NISQ-friendly variants
• Error mitigation integration
• Hybrid classical-quantum
• Application demonstrations

 Experimental Demonstrations:
• Small-scale on IBM/Google/IonQ
• Financial modeling (Monte Carlo)
• Chemistry applications
• Machine learning proofs-of-concept

 Future Directions:
• Fault-tolerant implementations
• Integration with VQE/QAOA
• Real-world financial applications
• Quantum advantage experiments`,
  },
  {
    id: "quantum-neural-networks",
    title: "Quantum Neural Networks (QNN)",
    difficulty: "Advanced",
    description: "Parameterized quantum models",
    content: `What they are:
Neural networks that leverage quantum computing principles to process information in ways classical networks cannot.

How they work:
-Encode data into quantum states.
-Apply quantum gates to create complex transformations.
-Use hybrid quantum-classical optimization to train the network.

Why they matter:
-Can potentially handle high-dimensional data more efficiently.
-Exploit quantum phenomena like superposition and entanglement for richer representations.
-Show promise for solving problems intractable for classical neural networks.

Applications:
-Quantum-enhanced machine learning
-Pattern recognition and classification
-Optimization problems
-Quantum chemistry and material simulations`,
  },
  {
    id: "qgan",
    title: "Quantum Generative Adversarial Networks (QGAN)",
    difficulty: "Advanced",
    description: "Adversarial quantum generation",
    content: `Purpose:
QGANs are the quantum version of classical GANs, used to generate data that mimics a target distribution, leveraging quantum circuits to represent probability distributions more efficiently.

Structure

  -Generator (Quantum Circuit): Produces quantum states representing candidate data.
  -Discriminator (Classical or Quantum): Evaluates how close the generated data is to the real data.
  -Training Loop: The generator tries to fool the discriminator, while the discriminator learns to distinguish real from generated data.

Advantages
  -Can represent complex probability distributions that are hard for classical GANs.
  -Potential for faster convergence in certain tasks due to quantum superposition and entanglement.

Applications
  -Quantum data generation
  -Quantum-enhanced machine learning
  -Synthetic data for simulations in physics and chemistry`,
  },
  {
    id: "quantum-kernel-methods",
    title: "Quantum Kernel Methods",
    difficulty: "Advanced",
    description: "Kernel evaluation via circuits",
    content: `Quantum kernel methods are part of quantum machine learning. They extend classical kernel techniques by using quantum computers to map data into a high-dimensional Hilbert space, where linear separation of complex patterns becomes easier. By leveraging quantum properties like superposition and entanglement, quantum kernels can potentially provide advantages over classical kernels for certain datasets.

Core Concepts
  Feature Mapping:
    -Classical input data x is transformed into a quantum state |φ(x)⟩ via a parameterized quantum circuit.
    -This mapping allows data to exist in an exponentially large feature space efficiently, without explicitly computing each dimension.
  Quantum Kernel Function:

    -Defined as the inner product of quantum states:K(x, x') = |⟨φ(x)|φ(x')⟩|²
    -Measures the similarity between two data points in the quantum feature space.
    -The kernel can be computed on a quantum computer using techniques like swap tests or Hadamard tests.

Training:
  -Once the kernel matrix is computed for all training data, classical algorithms like SVMs or kernel ridge regression are used.
  -The quantum computer handles kernel evaluation, while classical optimization handles model training.

Advantages
  -Efficient Representation: Quantum states can encode complex correlations and higher-dimensional structures more efficiently than classical vectors.
  -Potential Quantum Advantage: Certain datasets may require exponentially large classical kernels to achieve the same performance that a quantum kernel can provide efficiently.
  -Hybrid Approach: Combines quantum kernel evaluation with classical optimization, making it implementable on near-term quantum devices (NISQ-era).

Applications
  -Classification: Quantum-enhanced SVMs for image recognition, anomaly detection, and pattern classification.
  -Regression: Predicting continuous outputs with complex, high-dimensional relationships.
  -Data Analysis: Feature extraction and dimensionality reduction in datasets that are difficult for classical methods.
  -Quantum Chemistry & Finance: Modeling distributions or correlations that are computationally expensive classically.

Challenges
  -Noise in current quantum hardware can affect kernel precision.
  -Designing the right quantum feature map is non-trivial and often problem-dependent.
  -Scaling to very large datasets is challenging due to the number of kernel evaluations required.`,
  },
  {
    id: "quantum-simulation",
    title: "Quantum Simulation and Hamiltonian Dynamics",
    difficulty: "Advanced",
    description: "Simulate quantum systems directly",
    content: `Quantum Simulation and Hamiltonian Dynamics

Quantum simulation leverages quantum computers to study quantum systems that are intractable for classical computers, providing exponential advantages for understanding complex many-body physics.

 Core Concept

Digital Quantum Simulation:
Use gate-based quantum computers to simulate time evolution of quantum systems:
U(t) = e^(-iHt)

Analog Quantum Simulation:  
Use controllable quantum systems to directly emulate target Hamiltonians

 Hamiltonian Simulation Methods

Trotterization:
Approximate e^(-iHt) by breaking H into sum of terms:
H = H₁ + H₂ + ... + Hₙ

First-order Trotter: e^(-iHt) ≈ [e^(-iH₁t/r)e^(-iH₂t/r)...e^(-iHₙt/r)]^r

Higher-Order Methods:
- Suzuki-Trotter formulas reduce error scaling
- Optimal ordering of Hamiltonian terms
- Error scales as O((t/r)^(k+1)) for k-th order

Linear Combination of Unitaries (LCU):
Express H as weighted sum of unitary operators
Requires ancilla qubits and amplitude amplification

 Target Systems

Molecular Systems:
- Electronic structure problems
- Chemical reaction dynamics  
- Vibrational modes and spectra

Condensed Matter:
- Hubbard models for strongly correlated electrons
- Spin lattice models (Ising, Heisenberg)
- Topological phases and phase transitions

High Energy Physics:
- Lattice gauge theories
- Quantum field theory models
- Particle interaction dynamics

 Applications

Materials Science:
- High-temperature superconductivity mechanisms
- Magnetic material properties
- Catalyst design optimization

Drug Discovery:
- Protein folding dynamics
- Enzyme catalysis mechanisms  
- Molecular binding affinity

Fundamental Physics:
- Many-body localization studies
- Quantum thermalization processes
- Entanglement spreading dynamics

 Implementation Strategies

Hardware Requirements:
- Long coherence times for evolution
- High-fidelity two-qubit gates
- Sufficient qubit connectivity

 Error Mitigation:
- Symmetry preservation techniques
- Post-processing error correction
- Noise-resilient algorithms

 Near-term Approaches:
- Variational quantum eigensolver (VQE)
- Quantum approximate optimization (QAOA)
- Hybrid classical-quantum methods

Understanding quantum simulation opens pathways to solving some of the most challenging problems in science and technology using quantum advantage.`,
  },
];

// Comprehensive Level-Based Quizzes
const LEVEL_QUIZZES: LevelQuiz[] = [
  {
    id: "beginner-quiz",
    level: "Beginner",
    title: "Beginner Quantum Computing Quiz",
    description: "Test your understanding of fundamental quantum computing concepts",
    passingScore: 70,
    questions: [
      {
        id: "q1",
        question: "What is the key difference between a classical bit and a qubit?",
        options: [
          "A qubit can only be 0 or 1",
          "A qubit can be in superposition of 0 and 1",
          "A qubit is faster than a classical bit",
          "A qubit uses less energy"
        ],
        correctAnswer: 1,
        explanation: "Unlike classical bits that are either 0 or 1, qubits can exist in a superposition of both states simultaneously.",
        topic: "Qubits and Superposition"
      },
      {
        id: "q2",
        question: "In the equation |ψ⟩ = α|0⟩ + β|1⟩, what must be true about α and β?",
        options: [
          "α + β = 1",
          "|α|² + |β|² = 1",
          "α = β",
          "α and β must be real numbers"
        ],
        correctAnswer: 1,
        explanation: "The probability amplitudes must satisfy the normalization condition |α|² + |β|² = 1 to ensure total probability equals 1.",
        topic: "Qubits and Superposition"
      },
      {
        id: "q3",
        question: "On the Bloch sphere, where are the |0⟩ and |1⟩ states located?",
        options: [
          "|0⟩ at south pole, |1⟩ at north pole",
          "|0⟩ at north pole, |1⟩ at south pole",
          "Both at the equator",
          "Both at the center"
        ],
        correctAnswer: 1,
        explanation: "|0⟩ is located at the north pole and |1⟩ at the south pole of the Bloch sphere.",
        topic: "Bloch Sphere"
      },
      {
        id: "q4",
        question: "What happens when you measure a qubit in superposition?",
        options: [
          "It stays in superposition",
          "It becomes entangled",
          "It collapses to either |0⟩ or |1⟩",
          "It disappears"
        ],
        correctAnswer: 2,
        explanation: "Measurement causes wave function collapse, forcing the qubit into a definite state (|0⟩ or |1⟩) based on the probability amplitudes.",
        topic: "Quantum Measurement"
      },
      {
        id: "q5",
        question: "What does the Pauli-X gate do?",
        options: [
          "Creates superposition",
          "Flips |0⟩ ↔ |1⟩",
          "Adds phase",
          "Measures the qubit"
        ],
        correctAnswer: 1,
        explanation: "The Pauli-X gate is the quantum NOT gate, flipping |0⟩ to |1⟩ and |1⟩ to |0⟩.",
        topic: "Pauli Gates"
      },
      {
        id: "q6",
        question: "What happens when you apply a Hadamard gate to |0⟩?",
        options: [
          "It becomes |1⟩",
          "It becomes (|0⟩ + |1⟩)/√2",
          "It becomes (|0⟩ - |1⟩)/√2",
          "Nothing happens"
        ],
        correctAnswer: 1,
        explanation: "H|0⟩ = (|0⟩ + |1⟩)/√2, creating an equal superposition with positive amplitudes.",
        topic: "Hadamard Gate"
      },
      {
        id: "q7",
        question: "How do you create a Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2?",
        options: [
          "Apply H to qubit 0, then CNOT with qubit 0 as control",
          "Apply CNOT then H",
          "Apply H to both qubits",
          "Apply X to both qubits"
        ],
        correctAnswer: 0,
        explanation: "Apply Hadamard to create superposition on qubit 0, then CNOT to entangle qubit 1.",
        topic: "Bell States"
      },
      {
        id: "q8",
        question: "In quantum circuits, what does reading from left to right represent?",
        options: [
          "Space",
          "Time",
          "Energy",
          "Frequency"
        ],
        correctAnswer: 1,
        explanation: "Quantum circuits are read from left to right, representing the time evolution of the quantum system.",
        topic: "Circuit Basics"
      }
    ]
  },
  {
    id: "intermediate-quiz",
    level: "Intermediate",
    title: "Intermediate Quantum Computing Quiz",
    description: "Test your knowledge of quantum algorithms and multi-qubit operations",
    passingScore: 70,
    questions: [
      {
        id: "q1",
        question: "What does a CNOT gate do?",
        options: [
          "Flips both qubits",
          "Flips target if control is |1⟩",
          "Creates superposition",
          "Measures the qubits"
        ],
        correctAnswer: 1,
        explanation: "CNOT flips the target qubit if and only if the control qubit is in state |1⟩.",
        topic: "Controlled Gates"
      },
      {
        id: "q2",
        question: "What is the purpose of the S gate?",
        options: [
          "Bit flip",
          "Adds π/2 phase to |1⟩",
          "Creates superposition",
          "Swaps qubits"
        ],
        correctAnswer: 1,
        explanation: "The S gate adds a π/2 phase to the |1⟩ state, rotating around the Z-axis.",
        topic: "Phase Gates"
      },
      {
        id: "q3",
        question: "What is the time complexity of the classical FFT?",
        options: [
          "O(N)",
          "O(N log N)",
          "O(log² N)",
          "O(N²)"
        ],
        correctAnswer: 1,
        explanation: "The classical Fast Fourier Transform has O(N log N) time complexity.",
        topic: "Quantum Fourier Transform"
      },
      {
        id: "q4",
        question: "In phase kickback, what happens when U|ψ⟩ = e^(iθ)|ψ⟩?",
        options: [
          "The phase is lost",
          "The phase transfers to the control qubit in controlled-U",
          "The eigenstate changes",
          "Nothing happens"
        ],
        correctAnswer: 1,
        explanation: "When the target is an eigenstate of U, the phase e^(iθ) kicks back to the control qubit.",
        topic: "Phase Kickback"
      },
      {
        id: "q5",
        question: "How can you decompose a SWAP gate?",
        options: [
          "Three CNOTs: CNOT₁₂ CNOT₂₁ CNOT₁₂",
          "Two CNOTs and one H",
          "Three H gates",
          "One CNOT and two Xs"
        ],
        correctAnswer: 0,
        explanation: "SWAP can be decomposed into three CNOT gates applied in sequence.",
        topic: "SWAP Gates"
      },
      {
        id: "q6",
        question: "What does the Deutsch-Jozsa algorithm determine?",
        options: [
          "If a function is linear",
          "If a function is constant or balanced",
          "The minimum of a function",
          "The derivative of a function"
        ],
        correctAnswer: 1,
        explanation: "Deutsch-Jozsa determines if a black-box function is constant (all 0s or all 1s) or balanced (half 0s, half 1s).",
        topic: "Deutsch-Jozsa"
      },
      {
        id: "q7",
        question: "What is the time complexity of Grover's algorithm for searching N items?",
        options: [
          "O(N)",
          "O(log N)",
          "O(√N)",
          "O(N²)"
        ],
        correctAnswer: 2,
        explanation: "Grover's algorithm provides a quadratic speedup, reducing search time from O(N) to O(√N).",
        topic: "Grover's Algorithm"
      },
      {
        id: "q8",
        question: "What is Quantum Phase Estimation used for?",
        options: [
          "Creating superposition",
          "Estimating eigenvalue phases",
          "Measuring qubits",
          "Swapping qubits"
        ],
        correctAnswer: 1,
        explanation: "QPE estimates the phase θ where U|ψ⟩ = e^(2πiθ)|ψ⟩, crucial for algorithms like Shor's.",
        topic: "Phase Estimation"
      }
    ]
  },
  {
    id: "advanced-quiz",
    level: "Advanced",
    title: "Advanced Quantum Computing Quiz",
    description: "Test your mastery of advanced quantum algorithms and concepts",
    passingScore: 75,
    questions: [
      {
        id: "q1",
        question: "What type of algorithm is QAOA?",
        options: [
          "Purely quantum",
          "Purely classical",
          "Hybrid quantum-classical",
          "Photonic only"
        ],
        correctAnswer: 2,
        explanation: "QAOA is a hybrid algorithm combining quantum circuits for state preparation with classical optimization.",
        topic: "QAOA"
      },
      {
        id: "q2",
        question: "What happens as the depth parameter p increases in QAOA?",
        options: [
          "Solutions get worse",
          "Solutions can improve but circuits get longer",
          "Runtime decreases",
          "Number of qubits decreases"
        ],
        correctAnswer: 1,
        explanation: "Higher depth p can lead to better approximations but requires longer quantum circuits, making them more noise-susceptible.",
        topic: "QAOA"
      },
      {
        id: "q3",
        question: "What is a key difference between discrete-time and continuous-time quantum walks?",
        options: [
          "DTQW requires a coin qubit, CTQW doesn't",
          "CTQW is faster than DTQW",
          "DTQW is more accurate",
          "They are identical"
        ],
        correctAnswer: 0,
        explanation: "Discrete-time quantum walks require a 'coin' qubit for direction, while continuous-time walks evolve without one.",
        topic: "Quantum Walks"
      },
      {
        id: "q4",
        question: "Why can't quantum states be copied according to the no-cloning theorem?",
        options: [
          "It would violate energy conservation",
          "It would allow faster-than-light communication",
          "It would violate the linearity of quantum mechanics",
          "It's too expensive"
        ],
        correctAnswer: 2,
        explanation: "The no-cloning theorem follows from the linearity of quantum mechanics - perfect copying of unknown quantum states is impossible.",
        topic: "Error Correction"
      },
      {
        id: "q5",
        question: "What is the distance of a quantum error-correcting code?",
        options: [
          "Number of physical qubits",
          "Number of logical qubits",
          "Minimum weight of logical operator",
          "Maximum number of errors"
        ],
        correctAnswer: 2,
        explanation: "The distance d is the minimum weight of any logical operator, determining the error-correction capability: ⌊(d-1)/2⌋ errors.",
        topic: "Error Correction"
      },
      {
        id: "q6",
        question: "In quantum teleportation, what is transmitted?",
        options: [
          "The quantum particle itself",
          "Two classical bits",
          "Pure energy",
          "Nothing"
        ],
        correctAnswer: 1,
        explanation: "Quantum teleportation transmits two classical bits that tell Bob which correction to apply to reconstruct the state.",
        topic: "Teleportation"
      },
      {
        id: "q7",
        question: "What is the main security principle of BB84 quantum key distribution?",
        options: [
          "Computational hardness",
          "Eavesdropping necessarily disturbs quantum states",
          "Perfect encryption",
          "Faster transmission"
        ],
        correctAnswer: 1,
        explanation: "BB84 security relies on quantum mechanics: any eavesdropping attempt necessarily disturbs the quantum states, making it detectable.",
        topic: "QKD"
      },
      {
        id: "q8",
        question: "What is the complexity advantage of Amplitude Estimation over classical Monte Carlo?",
        options: [
          "Linear speedup",
          "Quadratic speedup",
          "Exponential speedup",
          "No advantage"
        ],
        correctAnswer: 1,
        explanation: "Amplitude Estimation achieves O(1/ε) scaling versus O(1/ε²) for classical Monte Carlo methods, providing quadratic speedup.",
        topic: "Amplitude Estimation"
      },
      {
        id: "q9",
        question: "What do Quantum Neural Networks primarily exploit?",
        options: [
          "Faster processing",
          "Lower energy consumption",
          "Quantum phenomena like superposition and entanglement",
          "Better memory"
        ],
        correctAnswer: 2,
        explanation: "QNNs leverage quantum phenomena like superposition and entanglement for potentially richer data representations.",
        topic: "QNN"
      },
      {
        id: "q10",
        question: "What causes barren plateaus in variational quantum circuits?",
        options: [
          "Too few parameters",
          "Random deep circuits with vanishing gradients",
          "Insufficient data",
          "Hardware noise"
        ],
        correctAnswer: 1,
        explanation: "Barren plateaus occur in random deep circuits where gradients vanish exponentially, making optimization difficult.",
        topic: "Barren Plateaus"
      }
    ]
  }
];

const LibraryPanel: React.FC = () => {
  // Load from localStorage or default to null
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [quizResults, setQuizResults] = useState<{questionId: string, correct: boolean, selectedAnswer: number}[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { isOpen: showExplanation, onToggle: toggleExplanation } = useDisclosure();
  
  // Level Quiz state
  const [showLevelQuiz, setShowLevelQuiz] = useState(false);
  const [currentLevelQuiz, setCurrentLevelQuiz] = useState<LevelQuiz | null>(null);
  const [levelQuizQuestionIndex, setLevelQuizQuestionIndex] = useState(0);
  const [levelQuizSelectedAnswer, setLevelQuizSelectedAnswer] = useState<string>("");
  const [levelQuizResults, setLevelQuizResults] = useState<{questionId: string, correct: boolean, selectedAnswer: number, topic?: string}[]>([]);
  const [levelQuizCompleted, setLevelQuizCompleted] = useState(false);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [currentAnswerCorrect, setCurrentAnswerCorrect] = useState(false);
  const { isOpen: showLevelExplanation, onToggle: toggleLevelExplanation } = useDisclosure();

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (selectedTopic) {
      localStorage.setItem("selectedTopicId", selectedTopic.id);
    } else {
      localStorage.removeItem("selectedTopicId");
    }
  }, [selectedTopic]);

  // Listen for external requests to open a specific topic (e.g. from other UI components)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const e = ev as CustomEvent;
        const topicId = e?.detail?.topicId;
        if (!topicId) return;
        const found = QUANTUM_TOPICS.find(t => t.id === topicId);
        if (found) setSelectedTopic(found);
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('openLibraryTopic', handler as EventListener);
    return () => window.removeEventListener('openLibraryTopic', handler as EventListener);
  }, []);

  // Reset quiz when topic changes
  useEffect(() => {
    setShowQuiz(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setQuizResults([]);
    setQuizCompleted(false);
    
    // Also reset level quiz
    setShowLevelQuiz(false);
    setCurrentLevelQuiz(null);
    setLevelQuizQuestionIndex(0);
    setLevelQuizSelectedAnswer("");
    setLevelQuizResults([]);
    setLevelQuizCompleted(false);
    setShowAnswerFeedback(false);
    setCurrentAnswerCorrect(false);
  }, [selectedTopic]);

  const startQuiz = () => {
    setShowQuiz(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setQuizResults([]);
    setQuizCompleted(false);
  };

  const submitAnswer = () => {
    if (!selectedTopic?.quiz || selectedAnswer === "") return;
    
    const currentQuestion = selectedTopic.quiz[currentQuestionIndex];
    const isCorrect = parseInt(selectedAnswer) === currentQuestion.correctAnswer;
    
    const newResult = {
      questionId: currentQuestion.id,
      correct: isCorrect,
      selectedAnswer: parseInt(selectedAnswer)
    };
    
    setQuizResults(prev => [...prev, newResult]);
    
    if (currentQuestionIndex < selectedTopic.quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer("");
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setQuizResults([]);
    setQuizCompleted(false);
  };

  const getQuizScore = () => {
    const correct = quizResults.filter(r => r.correct).length;
    return `${correct}/${quizResults.length}`;
  };

  // Level Quiz functions
  const startLevelQuiz = (level: "Beginner" | "Intermediate" | "Advanced") => {
    const quiz = LEVEL_QUIZZES.find(q => q.level === level);
    if (quiz) {
      setCurrentLevelQuiz(quiz);
      setShowLevelQuiz(true);
      setLevelQuizQuestionIndex(0);
      setLevelQuizSelectedAnswer("");
      setLevelQuizResults([]);
      setLevelQuizCompleted(false);
      setShowAnswerFeedback(false);
      setCurrentAnswerCorrect(false);
    }
  };

  const submitLevelAnswer = () => {
    if (!currentLevelQuiz || levelQuizSelectedAnswer === "") return;
    
    const currentQuestion = currentLevelQuiz.questions[levelQuizQuestionIndex];
    const isCorrect = parseInt(levelQuizSelectedAnswer) === currentQuestion.correctAnswer;
    
    const newResult = {
      questionId: currentQuestion.id,
      correct: isCorrect,
      selectedAnswer: parseInt(levelQuizSelectedAnswer),
      topic: currentQuestion.topic
    };
    
    setLevelQuizResults(prev => [...prev, newResult]);
    setCurrentAnswerCorrect(isCorrect);
    setShowAnswerFeedback(true);
  };

  const proceedToNextQuestion = () => {
    setShowAnswerFeedback(false);
    
    if (levelQuizQuestionIndex < currentLevelQuiz!.questions.length - 1) {
      setLevelQuizQuestionIndex(prev => prev + 1);
      setLevelQuizSelectedAnswer("");
    } else {
      setLevelQuizCompleted(true);
    }
  };

  const resetLevelQuiz = () => {
    setLevelQuizQuestionIndex(0);
    setLevelQuizSelectedAnswer("");
    setLevelQuizResults([]);
    setLevelQuizCompleted(false);
    setShowAnswerFeedback(false);
    setCurrentAnswerCorrect(false);
  };

  const getLevelQuizScore = () => {
    const correct = levelQuizResults.filter(r => r.correct).length;
    return `${correct}/${levelQuizResults.length}`;
  };

  const getLevelQuizPercentage = () => {
    return Math.round((levelQuizResults.filter(r => r.correct).length / levelQuizResults.length) * 100);
  };

  const passedLevelQuiz = () => {
    return currentLevelQuiz ? getLevelQuizPercentage() >= currentLevelQuiz.passingScore : false;
  };

  const listBg = useColorModeValue("gray.50", "gray.800");
  const listBorderColor = useColorModeValue("gray.200", "gray.700");
  const itemBg = useColorModeValue("white", "gray.700");
  const itemHoverBg = useColorModeValue("blue.50", "gray.600");
  const selectedBg = useColorModeValue("blue.100", "blue.900");
  const textColor = useColorModeValue("gray.700", "gray.300");
  const titleColor = useColorModeValue("blue.600", "blue.300");
  const contentFontSize = "md";

  const getDifficultyColor = (d: string) =>
    d === "Beginner" ? "green" : d === "Intermediate" ? "blue" : d === "Advanced" ? "orange" : "gray";

  const groupedTopics = {
    Beginner: QUANTUM_TOPICS.filter((t) => t.difficulty === "Beginner"),
    Intermediate: QUANTUM_TOPICS.filter((t) => t.difficulty === "Intermediate"),
    Advanced: QUANTUM_TOPICS.filter((t) => t.difficulty === "Advanced"),
  };

  const BlochSphereVisualization: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<any>(null);
    const bgColor = useColorModeValue("#f7fafc", "#1a202c");
    const poleLabelColor = useColorModeValue("#1a202c", "#f7fafc");

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth || 300;
      const height = el.clientHeight || 320;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(bgColor);
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 2.5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      el.appendChild(renderer.domElement);

      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x3182ce, transparent: true, opacity: 0.2 });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      scene.add(sphere);

      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(sphereGeometry),
        new THREE.LineBasicMaterial({ color: 0x94a3b8, opacity: 0.25, transparent: true })
      );
      scene.add(wire);

      scene.add(new THREE.AxesHelper(1.5));

      const createLabel = (text: string, color: string) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const fontSize = 48;
        ctx.font = `bold ${fontSize}px Arial`;
        const metrics = ctx.measureText(text);
        canvas.width = metrics.width + 20;
        canvas.height = fontSize + 20;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(0.5, 0.25, 1);
        return sprite;
      };

      const xLabel = createLabel("X", "#E53E3E"); xLabel.position.set(1.7, 0, 0); scene.add(xLabel);
      const yLabel = createLabel("Y", "#38A169"); yLabel.position.set(0, 1.7, 0); scene.add(yLabel);
      const zLabel = createLabel("Z", "#3182CE"); zLabel.position.set(0, 0, 1.7); scene.add(zLabel);
      const state0 = createLabel("|0⟩", poleLabelColor); state0.position.set(0, 1.3, 0); scene.add(state0);
      const state1 = createLabel("|1⟩", poleLabelColor); state1.position.set(0, -1.3, 0); scene.add(state1);

      const eqGeom = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(Math.cos(a), 0, Math.sin(a));
      }
      eqGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
      scene.add(new THREE.Line(eqGeom, new THREE.LineBasicMaterial({ color: 0x718096 })));

      scene.add(
        new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).normalize(), new THREE.Vector3(), 1, 0xf56565, 0.15, 0.08)
      );

      scene.add(new THREE.DirectionalLight(0xffffff, 0.8));
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      (async () => {
        try {
          //const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls");
          const controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.enablePan = false;
          controls.minDistance = 1.8;
          controls.maxDistance = 8;
          controlsRef.current = controls;
        } catch {}
      })();

      const onResize = () => {
        const w = el.clientWidth || 300;
        const h = el.clientHeight || 320;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      const animate = () => {
        controlsRef.current?.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener("resize", onResize);
        try { controlsRef.current?.dispose?.(); } catch {}
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        sphereGeometry.dispose();
        sphereMaterial.dispose();
        (wire.geometry as THREE.BufferGeometry).dispose();
        (wire.material as THREE.Material).dispose();
        eqGeom.dispose();
        renderer.dispose();
      };
    }, [bgColor, poleLabelColor]);

    return <Box ref={containerRef} w="100%" h="320px" />;
  };

  const PhaseGateBloch: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const controlsRef = useRef<any>(null);
    const beforeArrowRef = useRef<THREE.ArrowHelper | null>(null);
    const afterArrowRef = useRef<THREE.ArrowHelper | null>(null);

    const [thetaDeg, setThetaDeg] = useState(90);
    const [phiDeg, setPhiDeg] = useState(0);
    const [gate, setGate] = useState<"S" | "T">("S");

    const bgColor = useColorModeValue("#f7fafc", "#1a202c");
    const selectBg = useColorModeValue("white", "gray.700");

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const w = el.clientWidth || 400;
      const h = el.clientHeight || 360;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(bgColor);

      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
      camera.position.set(0, 0, 3.5);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      el.appendChild(renderer.domElement);

      const sphereGeom = new THREE.SphereGeometry(1, 64, 64);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x3182ce,
        transparent: true,
        opacity: 0.14,
        roughness: 0.6,
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      scene.add(sphere);

      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(sphereGeom),
        new THREE.LineBasicMaterial({ color: 0x94a3b8, opacity: 0.18, transparent: true })
      );
      scene.add(wire);

      const eqGeom = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(Math.cos(a), 0, Math.sin(a));
      }
      eqGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
      scene.add(new THREE.Line(eqGeom, new THREE.LineBasicMaterial({ color: 0x718096 })));

      scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(5, 5, 5); scene.add(dir);

      const origin = new THREE.Vector3();
      const beforeArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 1, 0xff5a5a, 0.12, 0.06);
      const afterArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 1, 0x38a169, 0.12, 0.06);
      beforeArrowRef.current = beforeArrow;
      afterArrowRef.current = afterArrow;
      scene.add(beforeArrow);
      scene.add(afterArrow);

      scene.add(new THREE.AxesHelper(1.5));

      (async () => {
        try {
          //const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls");
          const controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.enablePan = false;
          controls.minDistance = 1.8;
          controls.maxDistance = 8;
          controlsRef.current = controls;
        } catch {}
      })();

      const onResize = () => {
        const nw = el.clientWidth || 300;
        const nh = el.clientHeight || 320;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);

      const animate = () => {
        controlsRef.current?.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener("resize", onResize);
        try { controlsRef.current?.dispose?.(); } catch {}
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        sphereGeom.dispose(); sphereMat.dispose();
        (wire.geometry as THREE.BufferGeometry).dispose(); (wire.material as THREE.Material).dispose();
        eqGeom.dispose();
        renderer.dispose();
      };
    }, [bgColor]);

    useEffect(() => {
      const before = beforeArrowRef.current;
      const after = afterArrowRef.current;
      if (!before || !after) return;

      const theta = (thetaDeg * Math.PI) / 180;
      const phi = (phiDeg * Math.PI) / 180;
      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(theta);
      before.setDirection(new THREE.Vector3(x, y, z).normalize());

      const alpha = gate === "S" ? Math.PI / 2 : Math.PI / 4;
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);
      const x2 = cosA * x - sinA * y;
      const y2 = sinA * x + cosA * y;
      const z2 = z;
      after.setDirection(new THREE.Vector3(x2, y2, z2).normalize());
    }, [thetaDeg, phiDeg, gate]);

    return (
      <Box>
        <HStack spacing={4} mb={3} flexWrap="wrap">
          <Box>
            <Text fontSize="sm" color={textColor}>θ (deg)</Text>
            <input
              type="range"
              min={0}
              max={180}
              value={thetaDeg}
              onChange={(e) => setThetaDeg(Number(e.target.value))}
              style={{ width: 180 }}
            />
            <div style={{ fontSize: 12 }}>{thetaDeg}°</div>
          </Box>
          <Box>
            <Text fontSize="sm" color={textColor}>φ (deg)</Text>
            <input
              type="range"
              min={0}
              max={360}
              value={phiDeg}
              onChange={(e) => setPhiDeg(Number(e.target.value))}
              style={{ width: 180 }}
            />
            <div style={{ fontSize: 12 }}>{phiDeg}°</div>
          </Box>
          <Box>
            <Text fontSize="sm" color={textColor}>Gate</Text>
            <select
              value={gate}
              onChange={(e) => setGate(e.target.value as "S" | "T")}
              style={{
                background: selectBg,
                color: textColor,
                border: `1px solid ${listBorderColor}`,
                borderRadius: "4px",
                padding: "2px 4px",
              }}
            >
              <option value="S">S (Rz π/2)</option>
              <option value="T">T (Rz π/4)</option>
            </select>
          </Box>
        </HStack>
        <Box ref={containerRef} w="100%" h="360px" />
        <HStack spacing={4} mt={3}>
          <Text fontSize="sm" color={textColor}><span style={{ color: "#ff5a5a" }}>●</span> initial</Text>
          <Text fontSize="sm" color={textColor}><span style={{ color: "#38a169" }}>●</span> after {gate}</Text>
        </HStack>
      </Box>
    );
  };

  return (
    <HStack h="100%" w="100%" spacing={0} align="stretch">
      <VStack
        w="250px"
        h="100%"
        bg={listBg}
        borderRightWidth={0}
        borderColor={listBorderColor}
        spacing={0}
        align="stretch"
        overflowY="hidden"
      >
        <Box p={3} borderBottomWidth={1} borderColor={listBorderColor}>
          <HStack justify="space-between" mb={2}>
            <Heading size="md">Quantum Library</Heading>
          </HStack>
            <Text fontSize="xs" color={textColor}>
              {QUANTUM_TOPICS.length} topics • Learn quantum computing
            </Text>
        </Box>
        <Box 
          flex={1} 
          overflowY="scroll"
          maxHeight="calc(100vh - 120px)"
          w="100%"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: `${useColorModeValue("#cbd5e0", "#4a5568")} ${useColorModeValue("#f7fafc", "#2d3748")}`
          }}
          sx={{
            "&::-webkit-scrollbar": { 
              width: "12px",
              display: "block"
            },
            "&::-webkit-scrollbar-track": { 
              backgroundColor: "#e2e8f0",
              borderRadius: "6px",
              border: "1px solid #cbd5e0"
            },
            "&::-webkit-scrollbar-thumb": { 
              background: "#64748b", 
              borderRadius: "6px",
              border: "2px solid #e2e8f0",
              "&:hover": { 
                background: "#475569"
              }
            }
          }}
        >
          {Object.entries(groupedTopics).map(([difficulty, topics]) => (
            <Box key={difficulty}>
              <Box
                px={3}
                py={2}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderBottomWidth={1}
                borderColor={listBorderColor}
                position="sticky"
                top={0}
                zIndex={20}
                boxShadow={useColorModeValue("0 2px 4px rgba(0,0,0,0.1)", "0 2px 4px rgba(0,0,0,0.3)")}
              >
                <HStack spacing={2} justify="space-between">
                  <HStack spacing={2}>
                    <Badge colorScheme={getDifficultyColor(difficulty)} fontSize="xs">
                      {difficulty}
                    </Badge>
                    <Text fontSize="xs" fontWeight="600" color={textColor}>
                      {topics.length} topics
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    colorScheme="purple"
                    variant="solid"
                    onClick={(e) => {
                      e.stopPropagation();
                      startLevelQuiz(difficulty as "Beginner" | "Intermediate" | "Advanced");
                    }}
                    fontSize="10px"
                    px={2}
                    py={1}
                    height="18px"
                  >
                    Test yourself!
                  </Button>
                </HStack>
              </Box>
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  w="100%"
                  h="auto"
                  p={3}
                  justifyContent="flex-start"
                  variant="ghost"
                  bg={selectedTopic?.id === topic.id ? selectedBg : itemBg}
                  _hover={{ bg: itemHoverBg }}
                  borderRadius={0}
                  borderBottomWidth={1}
                  borderColor={listBorderColor}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <Text
                    fontSize="sm"
                    fontWeight={selectedTopic?.id === topic.id ? "700" : "600"}
                    textAlign="left"
                    color={titleColor}
                    whiteSpace="normal"
                    wordBreak="break-word"
                    lineHeight="1.3"
                    noOfLines={2}
                  >
                    {topic.title}
                  </Text>
                </Button>
              ))}
            </Box>
          ))}
        </Box>
      </VStack>

      <VStack 
        flex={1} 
        h="100%" 
        p={selectedTopic ? 6 : 0} 
        spacing={selectedTopic ? 4 : 0} 
        align="stretch" 
        overflowY={selectedTopic ? "auto" : "hidden"}
        sx={{
          "&::-webkit-scrollbar": { 
            width: "12px",
            display: "block"
          },
          "&::-webkit-scrollbar-track": { 
            backgroundColor: "#e2e8f0",
            borderRadius: "6px",
            border: "1px solid #cbd5e0"
          },
          "&::-webkit-scrollbar-thumb": { 
            background: "#64748b", 
            borderRadius: "6px",
            border: "2px solid #e2e8f0",
            "&:hover": { 
              background: "#475569"
            }
          }
        }}
      >
        {selectedTopic ? (
          <>
            <Box>
              <Heading size="lg" mb={2}>{selectedTopic.title}</Heading>
              <HStack>
                <Badge colorScheme={getDifficultyColor(selectedTopic.difficulty)}>
                  {selectedTopic.difficulty}
                </Badge>
              </HStack>
            </Box>
            <Divider />
            <Text fontWeight="bold" color={textColor} mb={-2}>Overview:</Text>
            <VStack align="start" spacing={4} flex={1} overflowY="auto">
              <Box
                p={6}
                borderWidth={1}
                borderColor={listBorderColor}
                borderRadius="md"
                w="100%"
                bg={itemBg}
              >
                {selectedTopic.id === "controlled-gates" ? (
                  <>
                    <Text
                      fontSize={contentFontSize}
                      color={textColor}
                      whiteSpace="pre-wrap"
                      lineHeight={2}
                      fontFamily="system-ui"
                    >
                      {selectedTopic.content}
                    </Text>
                    {selectedTopic.imageUrl && (
                      <Box mt={4} textAlign="center">
                        <img
                          src={selectedTopic.imageUrl}
                          alt={selectedTopic.title}
                          style={{
                            maxWidth: "100%",
                            maxHeight: 400,
                            display: "block",
                            margin: "0 auto",
                          }}
                        />
                      </Box>
                    )}
                    {selectedTopic.contentAfterImage && (
                      <Text
                        fontSize={contentFontSize}
                        color={textColor}
                        whiteSpace="pre-wrap"
                        lineHeight={2}
                        fontFamily="system-ui"
                        mt={4}
                      >
                        {selectedTopic.contentAfterImage}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text
                      fontSize={contentFontSize}
                      color={textColor}
                      whiteSpace="pre-wrap"
                      lineHeight={2}
                      fontFamily="system-ui"
                    >
                      {selectedTopic.content}
                    </Text>
                    {selectedTopic.id === "qubits-basics" && selectedTopic.imageUrl && (
                      <Box mt={3} textAlign="center">
                        <img
                          src={selectedTopic.imageUrl}
                          alt={selectedTopic.title}
                          style={{
                            maxWidth: "100%",
                            maxHeight: 400,
                            display: "block",
                            margin: "0 auto",
                          }}
                        />
                      </Box>
                    )}
                    {selectedTopic.id === "hadamard" && selectedTopic.imageUrl && (
                      <Box mt={4} textAlign="center">
                        <img
                          src={selectedTopic.imageUrl}
                          alt={selectedTopic.title}
                          style={{
                            maxWidth: "100%",
                            maxHeight: 400,
                            display: "block",
                            margin: "0 auto",
                          }}
                        />
                      </Box>
                    )}
                    {selectedTopic.contentAfterImage && (
                      <Text
                        fontSize={contentFontSize}
                        color={textColor}
                        whiteSpace="pre-wrap"
                        lineHeight={2}
                        fontFamily="system-ui"
                        mt={4}
                      >
                        {selectedTopic.contentAfterImage}
                      </Text>
                    )}
                  </>
                )}

                {selectedTopic.id === "bloch-sphere" && (
                  <Box mt={4} w="100%">
                    <BlochSphereVisualization />
                  </Box>
                )}

                {selectedTopic.id === "phase-gates" && (
                  <Box mt={4} w="100%">
                    <PhaseGateBloch />
                  </Box>
                )}
              </Box>
            </VStack>
          </>
        ) : (
          <Box 
            position="relative" 
            h="100%" 
            w="100%" 
            minH="100vh"
            overflow="hidden"
            bg={`linear-gradient(135deg, 
              ${useColorModeValue('rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.03)')} 0%,
              ${useColorModeValue('rgba(147, 51, 234, 0.05)', 'rgba(147, 51, 234, 0.03)')} 25%,
              ${useColorModeValue('rgba(16, 185, 129, 0.05)', 'rgba(16, 185, 129, 0.03)')} 50%,
              ${useColorModeValue('rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.04)')} 75%,
              ${useColorModeValue('rgba(147, 51, 234, 0.06)', 'rgba(147, 51, 234, 0.03)')} 100%)`}
          >
            {/* Dynamic Gradient Overlay */}
            <Box
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h="100%"
              background={`
                radial-gradient(ellipse at top left, ${useColorModeValue('rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.08)')} 0%, transparent 50%),
                radial-gradient(ellipse at top right, ${useColorModeValue('rgba(147, 51, 234, 0.12)', 'rgba(147, 51, 234, 0.06)')} 0%, transparent 50%),
                radial-gradient(ellipse at bottom left, ${useColorModeValue('rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.06)')} 0%, transparent 50%),
                radial-gradient(ellipse at bottom right, ${useColorModeValue('rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)')} 0%, transparent 50%)
              `}
              animation="gradient-shift 8s ease-in-out infinite"
              css={{
                '@keyframes gradient-shift': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.8, transform: 'scale(1.05)' },
                },
              }}
            />
            
            {/* Enhanced Floating Particles */}
            {[...Array(30)].map((_, i) => (
              <Box
                key={i}
                position="absolute"
                w={`${2 + (i % 3)}px`}
                h={`${2 + (i % 3)}px`}
                bg={`hsl(${200 + i * 12}, ${60 + (i % 3) * 15}%, ${50 + (i % 4) * 10}%)`}
                borderRadius="50%"
                opacity={0.4 + (i % 3) * 0.2}
                animation={`enhanced-float-${i % 5} ${3 + (i % 4)}s ease-in-out infinite`}
                left={`${5 + (i * 3.2) % 90}%`}
                top={`${5 + (i * 2.8) % 90}%`}
                css={{
                  '@keyframes enhanced-float-0': {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: 0.4 },
                    '50%': { transform: 'translateY(-30px) rotate(180deg)', opacity: 0.8 },
                  },
                  '@keyframes enhanced-float-1': {
                    '0%, 100%': { transform: 'translateX(0px) rotate(0deg)', opacity: 0.3 },
                    '50%': { transform: 'translateX(25px) rotate(180deg)', opacity: 0.7 },
                  },
                  '@keyframes enhanced-float-2': {
                    '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)', opacity: 0.5 },
                    '33%': { transform: 'translateY(-20px) translateX(15px) scale(1.2)', opacity: 0.9 },
                    '66%': { transform: 'translateY(15px) translateX(-15px) scale(0.8)', opacity: 0.6 },
                  },
                  '@keyframes enhanced-float-3': {
                    '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: 0.4 },
                    '50%': { transform: 'scale(1.8) rotate(360deg)', opacity: 0.8 },
                  },
                  '@keyframes enhanced-float-4': {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg) scale(1)', opacity: 0.5 },
                    '25%': { transform: 'translateY(-10px) rotate(90deg) scale(1.1)', opacity: 0.7 },
                    '50%': { transform: 'translateY(-20px) rotate(180deg) scale(1.3)', opacity: 0.9 },
                    '75%': { transform: 'translateY(-10px) rotate(270deg) scale(1.1)', opacity: 0.7 },
                  },
                }}
              />
            ))}
            
            {/* Quantum State Vectors and Symbols */}
            <Box
              position="absolute"
              top="12%"
              left="8%"
              fontSize="72px"
              opacity={0.15}
              color={useColorModeValue('blue.500', 'blue.300')}
              animation="quantum-pulse-enhanced 4s ease-in-out infinite"
              css={{
                '@keyframes quantum-pulse-enhanced': {
                  '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: 0.15 },
                  '50%': { transform: 'scale(1.15) rotate(5deg)', opacity: 0.3 },
                },
              }}
            >
              |ψ⟩
            </Box>
            
            <Box
              position="absolute"
              top="65%"
              right="12%"
              fontSize="65px"
              opacity={0.12}
              color={useColorModeValue('purple.500', 'purple.300')}
              animation="quantum-spin-enhanced 6s linear infinite"
              css={{
                '@keyframes quantum-spin-enhanced': {
                  '0%': { transform: 'rotate(0deg)', opacity: 0.12 },
                  '25%': { transform: 'rotate(90deg)', opacity: 0.25 },
                  '50%': { transform: 'rotate(180deg)', opacity: 0.3 },
                  '75%': { transform: 'rotate(270deg)', opacity: 0.25 },
                  '100%': { transform: 'rotate(360deg)', opacity: 0.12 },
                },
              }}
            >
              ⊕
            </Box>
            
            <Box
              position="absolute"
              top="25%"
              right="8%"
              fontSize="55px"
              opacity={0.18}
              color={useColorModeValue('green.500', 'green.300')}
              animation="quantum-float-enhanced 7s ease-in-out infinite"
              css={{
                '@keyframes quantum-float-enhanced': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: 0.18 },
                  '33%': { transform: 'translateY(-25px) rotate(10deg)', opacity: 0.35 },
                  '66%': { transform: 'translateY(-40px) rotate(-5deg)', opacity: 0.25 },
                },
              }}
            >
              ∫
            </Box>
            
            <Box
              position="absolute"
              top="45%"
              left="5%"
              fontSize="48px"
              opacity={0.2}
              color={useColorModeValue('indigo.500', 'indigo.300')}
              animation="quantum-matrix 5s ease-in-out infinite"
              css={{
                '@keyframes quantum-matrix': {
                  '0%, 100%': { transform: 'scale(1) rotateY(0deg)', opacity: 0.2 },
                  '50%': { transform: 'scale(1.2) rotateY(180deg)', opacity: 0.4 },
                },
              }}
            >
              ℋ
            </Box>
            
            <Box
              position="absolute"
              bottom="15%"
              left="15%"
              fontSize="42px"
              opacity={0.16}
              color={useColorModeValue('teal.500', 'teal.300')}
              animation="quantum-superposition 6s ease-in-out infinite"
              css={{
                '@keyframes quantum-superposition': {
                  '0%, 100%': { transform: 'translateX(0px) scale(1)', opacity: 0.16 },
                  '50%': { transform: 'translateX(20px) scale(1.3)', opacity: 0.32 },
                },
              }}
            >
              ⟨φ|
            </Box>
            
            {/* Central Content Area */}
            <VStack 
              justify="center" 
              align="center" 
              h="100%" 
              spacing={8} 
              position="relative" 
              zIndex={10}
              px={8}
              pt="10vh"
            >
              <VStack spacing={4} textAlign="center">
                <Heading 
                  size="4xl" 
                  color={titleColor} 
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  animation="enhanced-title-glow 3s ease-in-out infinite alternate"
                  css={{
                    '@keyframes enhanced-title-glow': {
                      '0%': { 
                        textShadow: `0 0 10px ${useColorModeValue('rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0.7)')}, 0 0 20px ${useColorModeValue('rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.4)')}` 
                      },
                      '100%': { 
                        textShadow: `0 0 20px ${useColorModeValue('rgba(147, 51, 234, 0.6)', 'rgba(147, 51, 234, 0.9)')}, 0 0 40px ${useColorModeValue('rgba(16, 185, 129, 0.4)', 'rgba(16, 185, 129, 0.6)')}, 0 0 60px ${useColorModeValue('rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.5)')}` 
                      },
                    },
                  }}
                >
                  Welcome to QuantumFlow Library!
                </Heading>
                
                <Text 
                  color={textColor} 
                  fontSize="2xl" 
                  fontWeight="400"
                  pt="2vh"
                  maxW="600px"
                  lineHeight="1.6"
                  animation="content-fade 2s ease-in-out infinite alternate"
                  
                  css={{
                    '@keyframes content-fade': {
                      '0%': { opacity: 0.7 },
                      '100%': { opacity: 1 },
                    },
                  }}
                >
                  Explore the fascinating world of quantum computing!
                </Text>
              </VStack>
              
              <VStack spacing={6} w="100%" maxW="500px">
                <Text 
                  color={titleColor} 
                  fontSize="2xl" 
                  fontStyle="italic" 
                  textAlign="center"
                  fontWeight="500"
                  animation="enhanced-text-glow 4s ease-in-out infinite alternate"
                  css={{
                    '@keyframes enhanced-text-glow': {
                      '0%': { textShadow: `0 0 15px ${useColorModeValue('rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 0.8)')}` },
                      '100%': { textShadow: `0 0 25px ${useColorModeValue('rgba(147, 51, 234, 0.7)', 'rgba(147, 51, 234, 0.9)')}, 0 0 35px ${useColorModeValue('rgba(16, 185, 129, 0.5)', 'rgba(16, 185, 129, 0.7)')}` },
                    },
                  }}
                >
                  Select a topic to begin your quantum journey
                </Text>
                
                {/* Enhanced Arrow with Animation */}
                <HStack
                  spacing={3}
                  animation="enhanced-arrow-bounce 2.5s ease-in-out infinite"
                  css={{
                    '@keyframes enhanced-arrow-bounce': {
                      '0%, 100%': { transform: 'translateX(0px)', opacity: 0.8 },
                      '50%': { transform: 'translateX(-15px)', opacity: 1 },
                    },
                  }}
                >
                  <Text fontSize="lg" color={textColor} opacity={0.8} fontWeight="500">
                    ← Dive into topics on the left
                  </Text>
                  <Box 
                    w="3px" 
                    h="3px" 
                    bg={titleColor} 
                    borderRadius="50%"
                    animation="pulse 2s ease-in-out infinite"
                    css={{
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
                        '50%': { transform: 'scale(1.5)', opacity: 1 },
                      },
                    }}
                  />
                </HStack>
              </VStack>
            </VStack>
          </Box>
        )}
      </VStack>
      
      {/* Level Quiz Modal/Overlay */}
      {showLevelQuiz && currentLevelQuiz && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.8)"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box
            bg={itemBg}
            borderRadius="lg"
            p={6}
            maxW="800px"
            w="100%"
            maxH="90vh"
            overflowY="auto"
            boxShadow="2xl"
          >
            {!levelQuizCompleted ? (
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Heading size="lg" color={titleColor}>
                      {currentLevelQuiz.title}
                    </Heading>
                    <Text color={textColor} fontSize="sm">
                      {currentLevelQuiz.description}
                    </Text>
                    <Badge colorScheme={getDifficultyColor(currentLevelQuiz.level)} fontSize="xs">
                      {currentLevelQuiz.level} Level
                    </Badge>
                  </VStack>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowLevelQuiz(false)}
                    color="red.500"
                  >
                    ✕ Close
                  </Button>
                </HStack>
                
                <HStack justify="space-between">
                  <Badge colorScheme="blue" fontSize="md" p={2}>
                    Question {levelQuizQuestionIndex + 1} of {currentLevelQuiz.questions.length}
                  </Badge>
                  <Text fontSize="sm" color={textColor}>
                    Topic: {currentLevelQuiz.questions[levelQuizQuestionIndex].topic}
                  </Text>
                </HStack>
                
                <Box p={6} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold" mb={4}>
                    {currentLevelQuiz.questions[levelQuizQuestionIndex].question}
                  </Text>
                  
                  <RadioGroup value={levelQuizSelectedAnswer} onChange={setLevelQuizSelectedAnswer}>
                    <VStack align="start" spacing={3}>
                      {currentLevelQuiz.questions[levelQuizQuestionIndex].options.map((option, index) => (
                        <Radio 
                          key={index} 
                          value={index.toString()} 
                          size="lg"
                          isDisabled={showAnswerFeedback}
                        >
                          <Text fontSize="md">{option}</Text>
                        </Radio>
                      ))}
                    </VStack>
                  </RadioGroup>
                </Box>
                
                {/* Answer Feedback */}
                {showAnswerFeedback && (
                  <Alert status={currentAnswerCorrect ? "success" : "error"} borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={2} flex={1}>
                      <Text fontWeight="bold">
                        {currentAnswerCorrect ? "✅ Correct!" : "❌ Incorrect"}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Correct Answer:</strong> {currentLevelQuiz.questions[levelQuizQuestionIndex].options[currentLevelQuiz.questions[levelQuizQuestionIndex].correctAnswer]}
                      </Text>
                      {currentLevelQuiz.questions[levelQuizQuestionIndex].explanation && (
                        <Text fontSize="sm" fontStyle="italic">
                          <strong>Explanation:</strong> {currentLevelQuiz.questions[levelQuizQuestionIndex].explanation}
                        </Text>
                      )}
                    </VStack>
                  </Alert>
                )}
                
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>
                    Passing Score: {currentLevelQuiz.passingScore}%
                  </Text>
                  {!showAnswerFeedback ? (
                    <Button
                      colorScheme="green"
                      onClick={submitLevelAnswer}
                      isDisabled={levelQuizSelectedAnswer === ""}
                      size="lg"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button
                      colorScheme="blue"
                      onClick={proceedToNextQuestion}
                      size="lg"
                    >
                      {levelQuizQuestionIndex < currentLevelQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                  )}
                </HStack>
              </VStack>
            ) : (
              <VStack spacing={6} align="stretch">
                <VStack spacing={4}>
                  <Heading size="lg" color={titleColor} textAlign="center">
                    🎉 {currentLevelQuiz.level} Quiz Completed!
                  </Heading>
                  
                  <Alert status={passedLevelQuiz() ? "success" : "warning"} borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">
                        You scored {getLevelQuizScore()} ({getLevelQuizPercentage()}%)
                      </Text>
                      <Text fontSize="sm">
                        {passedLevelQuiz() 
                          ? `🎊 Congratulations! You passed the ${currentLevelQuiz.level} level!`
                          : `You need ${currentLevelQuiz.passingScore}% to pass. Keep learning and try again!`}
                      </Text>
                    </VStack>
                  </Alert>
                </VStack>
                
                <Button onClick={toggleLevelExplanation} size="lg">
                  {showLevelExplanation ? 'Hide' : 'Show'} Detailed Results
                </Button>
                
                <Collapse in={showLevelExplanation}>
                  <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
                    {currentLevelQuiz.questions.map((question, index) => {
                      const result = levelQuizResults[index];
                      return (
                        <Box key={question.id} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold" fontSize="sm" color="purple.500">
                              Topic: {question.topic}
                            </Text>
                            <Badge colorScheme={result.correct ? 'green' : 'red'}>
                              {result.correct ? '✓ Correct' : '✗ Incorrect'}
                            </Badge>
                          </HStack>
                          <Text fontWeight="bold" mb={2}>Q{index + 1}: {question.question}</Text>
                          <Text fontSize="sm" color={textColor} mb={2}>
                            <strong>Your Answer:</strong> {question.options[result.selectedAnswer]}
                          </Text>
                          <Text fontSize="sm" color={textColor} mb={2}>
                            <strong>Correct Answer:</strong> {question.options[question.correctAnswer]}
                          </Text>
                          {question.explanation && (
                            <Text fontSize="sm" color={textColor} fontStyle="italic">
                              <strong>Explanation:</strong> {question.explanation}
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                </Collapse>
                
                <HStack spacing={4} justify="center">
                  <Button onClick={resetLevelQuiz} colorScheme="blue" variant="outline" size="lg">
                    Retake Quiz
                  </Button>
                  <Button onClick={() => setShowLevelQuiz(false)} colorScheme="gray" size="lg">
                    Close
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        </Box>
      )}
    </HStack>
  );
};

export default LibraryPanel;