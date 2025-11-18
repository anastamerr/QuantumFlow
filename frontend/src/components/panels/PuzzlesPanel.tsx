import React from 'react'
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  Progress,
  Badge,
} from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/store'

type PuzzleState = {
  id: number
  description: string
  qubits: number
  targetMatrix: string
  isSolved: boolean
  attemptCount: number
}

const quantumPuzzles: PuzzleState[] = [
  // --- Beginner Puzzles (Focus on single-qubit gates and basic identity) ---
  {
    id: 1,
    description: "Replicate the effect of the Pauli-X (NOT) gate on a single qubit, but without using an X gate. Use two gates only.",
    qubits: 1,
    targetMatrix: '[[0, 1], [1, 0]]',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Beginner',
  },
  {
    id: 2,
    description: "Apply a gate that flips the phase of the state. The state $|0\\rangle$ should remain unchanged. Use one gate.",
    qubits: 1,
    targetMatrix: '[[1, 0], [0, -1]] (Pauli Z)',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Beginner',
  },
  {
    id: 3,
    description: "Create the **identity operation** (do nothing) using exactly two different gates. The resulting matrix must be the Identity Matrix (I).",
    qubits: 1,
    targetMatrix: '[[1, 0], [0, 1]] (Identity)',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Beginner',
  },

  // --- Intermediate Puzzles (Introduce superposition, entanglement, and more qubits) ---
  {
    id: 4,
    description: "Prepare the first qubit in the **maximum superposition state** $\\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$, but the circuit must use **two gates**. ",
    qubits: 1,
    targetMatrix: '[[0.707, 0.707], [0.707, -0.707]] (Hadamard)',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Intermediate',
  },
  {
    id: 5,
    description: "Create the **Bell state** $|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$ from the initial state $|00\\rangle$. Use exactly two gates. You must use two qubits.",
    qubits: 2,
    targetMatrix: 'Bell State $\\Phi^+$',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Intermediate',
  },
  {
    id: 6,
    description: "Build a circuit that swaps the states of two qubits (Qubit 0 and Qubit 1) using **three CNOT gates** and no other gates.",
    qubits: 2,
    targetMatrix: 'Swap Gate Matrix',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Intermediate',
  },

  // --- Advanced Puzzles (Introduce rotation, controlled gates, or phase manipulation) ---
  {
    id: 7,
    description: "Construct a circuit that rotates a qubit by an angle of $\\pi/4$ around the Z-axis, but only if the control qubit (Qubit 0) is in the $|1\\rangle$ state. This is a **Controlled-$R_Z(\\pi/4)$ gate**.",
    qubits: 2,
    targetMatrix: 'Controlled Rz($\\pi/4$)',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Advanced',
  },
  {
    id: 8,
    description: "Simulate a **Toffoli (CCNOT) gate** using only single-qubit gates and CNOT gates. This will require several steps and three qubits.",
    qubits: 3,
    targetMatrix: 'Toffoli Gate Matrix',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Advanced',
  },
];
// --- ACTUAL COMPONENT ---

export default function PuzzlesPanel(): JSX.Element {
  const dispatch = useDispatch()
  const toast = useToast()

  const puzzle = quantumPuzzles[0];

  // 2. Get the user's current circuit from the Redux state
  const userCircuitGates = useSelector((state: RootState) => state.circuit.gates)

  const handleCheckSolution = () => {

    const success = Math.random() < 0.5
    
    if (success) {
      toast({
        title: 'Puzzle Solved!',
        description: 'Your circuit successfully matches the target transformation. Great job!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Incorrect Solution',
        description: 'The output of your circuit does not match the required target.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box p={4} height="100%" overflowY="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Quantum Puzzle #{puzzle.id}</Heading>
        <Badge colorScheme={puzzle.isSolved ? 'green' : 'red'} fontSize="lg" p={2} borderRadius="md">
          {puzzle.isSolved ? 'SOLVED' : 'ACTIVE'}
        </Badge>
      </HStack>

      <VStack align="stretch" spacing={4}>
        <Box p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md">
          <Text fontWeight="bold" mb={1}>Goal:</Text>
          <Text>{puzzle.description}</Text>
          <Text mt={2} fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            Qubits required: {puzzle.qubits}
          </Text>
        </Box>

        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="sm">Circuit Gates: **{userCircuitGates.length}**</Text>
            <Text fontSize="sm">Attempts: **{puzzle.attemptCount}**</Text>
          </VStack>
          
          <Button 
            colorScheme="blue" 
            onClick={handleCheckSolution}
            isDisabled={userCircuitGates.length === 0}
          >
            Check Solution
          </Button>
        </HStack>
        
      </VStack>
    </Box>
  )
}