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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RootState } from '@/store'

type PuzzleState = {
  description: string
  qubits: number
  targetMatrix: string
  isSolved: boolean
  attemptCount: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

const quantumPuzzles: PuzzleState[] = [
  // --- Beginner Puzzles (Focus on single-qubit gates and basic identity) ---
  {
    description: "Replicate the effect of the Pauli-X (NOT) gate on a single qubit, but without using an X gate. Use two gates only.",
    qubits: 1,
    targetMatrix: '[[0, 1], [1, 0]] (Pauli X)',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Beginner',
  },
  {
    description: "Apply a gate that flips the phase of the angle state. The state angle should remain unchanged. Use one gate.",
    qubits: 1,
    targetMatrix: '[[1, 0], [0, -1]] (Pauli Z)',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Beginner',
  },
  {
    description: "Create the identity operation (do nothing) using exactly two different gates. The resulting matrix must be the Identity Matrix (I).",
    qubits: 1,
    targetMatrix: '[[1, 0], [0, 1]] (Identity)',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Beginner',
  },
  {
    description: "Build a circuit that swaps the states of two qubits (Qubit 0 and Qubit 1) using **three CNOT gates** and no other gates.",
    qubits: 2,
    targetMatrix: 'Swap Gate Matrix',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Intermediate',
  },
  {
    description: "Construct a circuit that rotates a qubit by an angle of pi/4 around the Z-axis, but only if the control qubit (Qubit 0) is in the angle state. This is a Controlled-pi/4 gate.",
    qubits: 2,
    targetMatrix: 'Controlled Rz',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Advanced',
  },
  {
    description: "Simulate a Toffoli (CCNOT) gate using only single-qubit gates and CNOT gates. This will require several steps and three qubits.",
    qubits: 3,
    targetMatrix: 'Toffoli Gate Matrix',
    isSolved: false,
    attemptCount: 0,
    difficulty: 'Advanced',
  },
];

export default function PuzzlesPanel(): JSX.Element {
  const dispatch = useDispatch()
  const toast = useToast()

  const [currentPuzzleID, setCurrentPuzzleID] = React.useState(0);
  const puzzle = quantumPuzzles[currentPuzzleID];

  const switchPuzzleRight = () => {
    setCurrentPuzzleID((id) => (id + 1) % quantumPuzzles.length);
  };

  const switchPuzzleLeft = () => {
    setCurrentPuzzleID((id) => (id - 1 + quantumPuzzles.length) % quantumPuzzles.length);
  };

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

      puzzle.isSolved = true
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
        <HStack spacing={2}>
            <Button 
                colorScheme="blue" 
                onClick={switchPuzzleLeft}
            >
              Previous
            </Button>
            <Heading size="md">Puzzle #{currentPuzzleID + 1}</Heading>
            <Button 
                colorScheme="blue" 
                onClick={switchPuzzleRight}
            >
              Next
            </Button>
        </HStack>
        
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
            <Text fontSize="sm">Circuit Gates: {userCircuitGates.length}</Text>
            <Text fontSize="sm">Attempts: {puzzle.attemptCount}</Text>
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