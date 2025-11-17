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
} from "@chakra-ui/react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";


interface TopicItem {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  content: string;
  contentAfterImage?: string;
  imageUrl?: string;
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

A qubit is the basic unit of quantum information. Unlike classical bits (0 or 1), qubits can exist in a superposition of both states.

Key Concepts:
- Superposition : A qubit can be 0, 1, or both simultaneously
- Probability Amplitudes: Each state has a complex number associated with it
- Measurement: When measured, a qubit collapses to either 0 or 1

Mathematical Representation:
  |ψ⟩ = α|0⟩ + β|1⟩

Where α and β are probability amplitudes with |α|² + |β|² = 1`,
  },
  {
    id: "bloch-sphere",
    title: "Bloch Sphere Representation",
    difficulty: "Beginner",
    description: "Visualize single-qubit states on the Bloch sphere",
    content: ` Bloch Sphere Representation

The Bloch sphere is a geometric representation of single-qubit states.

Properties:
- Poles: |0⟩ at north pole, |1⟩ at south pole
- Equator: Superposition states like |+⟩ and |-⟩
- Surface: All valid single-qubit states lie on the surface
- Interior: Mixed states (not pure quantum states)

Rotation Parameters:
- θ (theta): Rotation angle from |0⟩
- φ (phi): Azimuthal angle in the equatorial plane`,
  },
  {
    id: "measurement",
    title: "Quantum Measurement",
    difficulty: "Beginner",
    description: "Understand quantum measurement and wave function collapse",
    content: ` Quantum Measurement

Quantum measurement is the process of extracting information from a quantum system.

Key Points:
- Wave Function Collapse: Measurement forces a qubit into a definite state
- Probabilistic: Results are probabilistic, not deterministic
- Irreversible: After measurement, the quantum state changes

 Born Rule:
The probability of measuring |0⟩ is |α|²
The probability of measuring |1⟩ is |β|²`,
  },
  {
    id: "pauli-gates",
    title: "Pauli Gates (X, Y, Z)",
    difficulty: "Beginner",
    description: "Learn fundamental Pauli operations",
    content: `Pauli Gates (X, Y, Z)

Pauli gates are fundamental single-qubit operations.

 Pauli-X (NOT Gate):
Flips |0⟩ ↔ |1⟩
Matrix: [[0, 1], [1, 0]]

 Pauli-Y:
Rotation around Y-axis
Matrix: [[0, -i], [i, 0]]

 Pauli-Z:
Phase flip
Matrix: [[1, 0], [0, -1]]

Basis for more complex operations.`,
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
- Hermitian
- Unitary
- Self-inverse

Essential for superpositions.`,
  },
  {
    id: "bell-state",
    title: "Bell States and Entanglement",
    difficulty: "Beginner",
    description: "Maximally entangled states",
    content: ` Bell States and Entanglement

Four Bell States:
- |Φ+⟩ = (|00⟩ + |11⟩)/√2
- |Φ-⟩ = (|00⟩ - |11⟩)/√2
- |Ψ+⟩ = (|01⟩ + |10⟩)/√2
- |Ψ-⟩ = (|01⟩ - |10⟩)/√2

Measure one → determines other.

Create via H then CNOT.`,
  },
  {
    id: "quantum-circuit-basics",
    title: "Quantum Circuit Basics",
    difficulty: "Beginner",
    description: "Understand circuit diagrams",
    content: ` Quantum Circuit Basics

Components:
- Qubits
- Gates
- Measurements
- Classical bits

Reading: Left→Right = time.

Example:
Init |0⟩ → H → Measure (≈50% each)`,
  },

  // Intermediate
  {
    id: "controlled-gates",
    title: "Controlled Gates (CNOT, CCNOT)",
    difficulty: "Intermediate",
    description: "Conditional multi-qubit operations",
    imageUrl: "/images/cnotandccnot.png",
    content: ` Controlled Gates (CNOT, CCNOT)

CNOT: Flips target if control is |1⟩.
Toffoli (CCNOT): Flips target if both controls |1⟩.

Matrix (CNOT):
[[1,0,0,0],
 [0,1,0,0],
 [0,0,0,1],
 [0,0,1,0]]`,
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
    content: ` Quantum Fourier Transform (QFT)

Maps |x⟩ → (1/√N) Σ_y e^(2πixy/N)|y⟩

Classical FFT: O(N log N)
Quantum: O(log² N) depth (with assumptions)

Applications:
- Shor
- Phase estimation
- Simulation

Implemented with Hadamards + controlled phase gates.`,
  },
  {
    id: "phase-kickback",
    title: "Phase Kickback",
    difficulty: "Intermediate",
    description: "Eigensystem phase transfer",
    content: `Phase Kickback

If U|ψ⟩ = e^(iθ)|ψ⟩ then controlled-U transfers phase to control.

Used in:
- Phase estimation
- Counting
- Amplitude amplification

Encodes eigenvalue phases.`,
  },
  {
    id: "swap-gates",
    title: "SWAP and Fredkin Gates",
    difficulty: "Intermediate",
    description: "Qubit permutation operations",
    content: `SWAP and Fredkin Gates

SWAP: |ab⟩ → |ba⟩
Decomposition: CNOT₁₂ CNOT₂₁ CNOT₁₂

Fredkin (Controlled-SWAP):
Swap two targets if control is |1⟩

Used for routing and layout mapping.`,
  },
  {
    id: "deutsch-algorithm",
    title: "Deutsch-Jozsa Algorithm",
    difficulty: "Intermediate",
    description: "Constant vs balanced function test",
    content: `Deutsch-Jozsa Algorithm

Problem: Determine if f:{0,1}ⁿ→{0,1} is constant or balanced.

Classical: Need many evaluations.
Quantum: Single oracle use.

Steps:
1. Init
2. Hadamards
3. Oracle
4. Hadamards
5. Measure

All zeros → constant else balanced.`,
  },
  {
    id: "grover-amplitude",
    title: "Grover's Algorithm - Amplitude Amplification",
    difficulty: "Intermediate",
    description: "Quadratic speedup for search",
    content: `Grover's Algorithm

Search N items in O(√N).

Steps:
1. Init superposition
2. Oracle marks solution
3. Diffusion operator
4. Repeat ~√N
5. Measure

Amplitude amplification generalizes Grover.`,
  },
  {
    id: "quantum-phase-estimation",
    title: "Quantum Phase Estimation",
    difficulty: "Intermediate",
    description: "Estimate eigenvalue phases",
    content: ` Quantum Phase Estimation (QPE)

Given U|ψ⟩ = e^(2πiθ)|ψ⟩ find θ.

Applications:
- Shor
- Simulation
- Chemistry
- Amplitude estimation

High precision with inverse QFT.`,
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
    content: `Quantum GANs

Structure:
- Quantum generator
- Classical discriminator

Challenges:
- Mode collapse
- Stability
- Plateaus

Potential for complex distributions.`,
  },
  {
    id: "quantum-kernel-methods",
    title: "Quantum Kernel Methods",
    difficulty: "Advanced",
    description: "Kernel evaluation via circuits",
    content: `Quantum Kernel Methods

Kernel:
K(x,y)=|⟨ψ(x)|ψ(y)⟩|²

Advantage: High-dimensional embeddings.

Challenges:
- Sampling cost
- Noise
- Encoding depth`,
  },
  {
    id: "adiabatic-quantum",
    title: "Adiabatic Quantum Computing",
    difficulty: "Advanced",
    description: "Slow Hamiltonian evolution",
    content: `Adiabatic Quantum Computing

Start in ground state of H₀.
Evolve to H₁ slowly.
Stay in ground state if gap sufficient.

Equivalent to gate model.

Used in optimization (Ising mappings).`,
  },
  {
    id: "topological-quantum",
    title: "Topological Quantum Computing",
    difficulty: "Advanced",
    description: "Anyons and braiding for robustness",
    content: `Topological Quantum Computing

Anyons:
- Non-abelian statistics
- Braid operations encode gates

Robust to local errors.

Experimental progress still early.`,
  },
  {
    id: "quantum-simulation",
    title: "Quantum Simulation and Hamiltonian Dynamics",
    difficulty: "Advanced",
    description: "Simulate quantum systems directly",
    content: `Quantum Simulation

Targets:
- Molecules
- Materials
- Lattice models

Methods:
- Trotterization
- Variational simulation
- Sparse Hamiltonian techniques`,
  },
  {
    id: "variational-ansatz",
    title: "Variational Ansatz Design",
    difficulty: "Advanced",
    description: "Parameterized circuit strategy",
    content: `Variational Ansatz Design

Goals:
- Expressibility
- Trainability
- Efficiency

Types:
- Hardware-efficient
- Problem-inspired
- Adaptive

Trade-offs crucial.`,
  },
  {
    id: "quantum-chemistry",
    title: "Quantum Chemistry Simulation",
    difficulty: "Advanced",
    description: "Electronic structure on quantum devices",
    content: `Quantum Chemistry Simulation

Problems:
- Ground state energy
- Reaction pathways

Methods:
- VQE
- Phase estimation
- Active space reduction

Applications: Materials, drugs.`,
  },
  {
    id: "barren-plateaus",
    title: "Barren Plateaus in Quantum Circuits",
    difficulty: "Advanced",
    description: "Vanishing gradient regions",
    content: `Barren Plateaus

Cause:
- Random deep circuits

Mitigation:
- Structured ansatz
- Layerwise training
- Problem initialization

Active research area.`,
  },
  {
    id: "dynamical-decoupling",
    title: "Dynamical Decoupling and Pulse Shaping",
    difficulty: "Advanced",
    description: "Mitigate decoherence with pulses",
    content: `Dynamical Decoupling

Pulse sequences cancel noise.

Techniques:
- CPMG
- UDD
- GRAPE (optimal control)

Improves coherence times.`,
  },
  {
    id: "quantum-noise-mitigation",
    title: "Quantum Noise Mitigation Techniques",
    difficulty: "Advanced",
    description: "Reduce noise without full QEC",
    content: `Noise Mitigation

Methods:
- Zero noise extrapolation
- Probabilistic error cancellation
- Symmetry verification
- Readout mitigation

Useful in NISQ era.`,
  },
];

const LibraryPanel: React.FC = () => {
  // Load from localStorage or default to null
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(() => {
    const savedId = localStorage.getItem("selectedTopicId");
    if (savedId) {
      return QUANTUM_TOPICS.find((t) => t.id === savedId) || null;
    }
    return null;
  });

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (selectedTopic) {
      localStorage.setItem("selectedTopicId", selectedTopic.id);
    } else {
      localStorage.removeItem("selectedTopicId");
    }
  }, [selectedTopic]);

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
        overflowY="auto"
        css={{
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "rgba(0,0,0,0.03)" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: "4px" },
          "&::-webkit-scrollbar-thumb:hover": { background: "rgba(0,0,0,0.2)" },
        }}
      >
        <Box p={3} borderBottomWidth={1} borderColor={listBorderColor}>
          <HStack justify="space-between" mb={2}>
            <Heading size="md">Quantum Library</Heading>
          </HStack>
            <Text fontSize="xs" color={textColor}>
              {QUANTUM_TOPICS.length} topics • Learn quantum computing
            </Text>
        </Box>
        <Box flex={1} overflowY="auto" w="100%">
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
                zIndex={10}
              >
                <HStack spacing={2}>
                  <Badge colorScheme={getDifficultyColor(difficulty)} fontSize="xs">
                    {difficulty}
                  </Badge>
                  <Text fontSize="xs" fontWeight="600" color={textColor}>
                    {topics.length} topics
                  </Text>
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
                  >
                    {topic.title}
                  </Text>
                </Button>
              ))}
            </Box>
          ))}
        </Box>
      </VStack>

      <VStack flex={1} h="100%" p={6} spacing={4} align="stretch" overflowY="auto">
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
                  <HStack align="center" spacing={6}>
                    <Box flex={1}>
                      <Text
                        fontSize={contentFontSize}
                        color={textColor}
                        whiteSpace="pre-wrap"
                        lineHeight={2}
                        fontFamily="system-ui"
                      >
                        {selectedTopic.content}
                      </Text>
                    </Box>
                    {selectedTopic.imageUrl && (
                      <Box
                        w={["140px", "220px", "320px"]}
                        flexShrink={0}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <img
                          src={selectedTopic.imageUrl}
                          alt={selectedTopic.title}
                          style={{ maxWidth: "100%", maxHeight: 280, display: "block" }}
                        />
                      </Box>
                    )}
                  </HStack>
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
          <VStack justify="center" align="center" h="100%" spacing={4}>
            <Heading size="2xl" color={textColor}>Select a Topic!</Heading>
            //<Heading fontSize="50px" color={textColor} textAlign="center" fontStyle="bold">
            <Text color={textColor} fontSize="30px" textAlign="center">
              Click a topic to view details
            </Text>
            <Text color={textColor} fontSize="lg" fontStyle="italic" textAlign="center" mt={2}>
              Where curiosity meets quantum...let the exploration begin! 
            </Text>
            </Heading>
          </VStack>
        )}
      </VStack>
    </HStack>
  );
};

export default LibraryPanel;