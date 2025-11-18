import React from "react"
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  Badge,
  Spinner,
} from "@chakra-ui/react"
import { useSelector } from "react-redux"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { RootState } from "@/store"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

type PuzzleState = {
  description: string
  qubits: number
  targetMatrix: string
  isSolved: boolean
  attemptCount: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
}

const quantumPuzzles: PuzzleState[] = [
  {
    description: "Replicate the effect of the Pauli-X (NOT) gate on a single qubit, but without using an X gate. Use two gates only.",
    qubits: 1,
    targetMatrix: "Pauli X",
    isSolved: false,
    attemptCount: 0,
    difficulty: "Beginner",
  },
  {
    description: "Apply a gate that flips the phase of the angle state. The state angle should remain unchanged. Use one gate.",
    qubits: 1,
    targetMatrix: "Pauli Z",
    isSolved: false,
    attemptCount: 0,
    difficulty: "Beginner",
  },
  {
    description: "Create the identity operation (do nothing) using exactly two different gates. The resulting matrix must be the Identity Matrix (I).",
    qubits: 1,
    targetMatrix: "Identity",
    isSolved: false,
    attemptCount: 0,
    difficulty: "Beginner",
  },
  {
    description: "Build a circuit that swaps the states of two qubits (Qubit 0 and Qubit 1) using **three CNOT gates** and no other gates.",
    qubits: 2,
    targetMatrix: "Swap",
    isSolved: false,
    attemptCount: 0,
    difficulty: "Intermediate",
  },
  {
    description: "Construct a circuit that rotates a qubit by an angle of pi/4 around the Z-axis, but only if the control qubit (Qubit 0) is in the angle state. This is a Controlled-pi/4 gate.",
    qubits: 2,
    targetMatrix: "Controlled Rz",
    isSolved: false,
    attemptCount: 0,
    difficulty: "Advanced",
  },
  {
    description: "Simulate a Toffoli (CCNOT) gate using only single-qubit gates and CNOT gates. This will require several steps and three qubits.",
    qubits: 3,
    targetMatrix: "Toffoli",
    isSolved: false,
    attemptCount: 0,
    difficulty: "Advanced",
  },
]

export default function PuzzlesPanel(): JSX.Element {
  const toast = useToast()
  const [currentPuzzleID, setCurrentPuzzleID] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  
  const puzzle = quantumPuzzles[currentPuzzleID]
  const userCircuitGates = useSelector((state: RootState) => state.circuit.gates)
  const numQubits = useSelector((state: RootState) => state.circuit.qubits.length)

  const switchPuzzleRight = () => {
    setCurrentPuzzleID((id) => (id + 1) % quantumPuzzles.length)
  }

  const switchPuzzleLeft = () => {
    setCurrentPuzzleID((id) => (id - 1 + quantumPuzzles.length) % quantumPuzzles.length)
  }

  const handleCheckSolution = async () => {
    if (userCircuitGates.length === 0) {
      toast({
        title: "No Circuit",
        description: "Add gates to your circuit before checking.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/validate-puzzle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_qubits: numQubits,
          gates: userCircuitGates,
          target_label: puzzle.targetMatrix,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Validation failed")
      }

      const result = await response.json()

      if (result.is_correct) {
        toast({
          title: "Puzzle Solved!",
          description: "Your circuit successfully matches the target transformation. Great job!",
          status: "success",
          duration: 5000,
          isClosable: true,
        })
        puzzle.isSolved = true
      } else {
        toast({
          title: "Incorrect Solution",
          description: "The output of your circuit does not match the required target.",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
      }
      puzzle.attemptCount += 1
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate circuit.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box p={4} height="100%" overflowY="auto">
      <HStack justify="space-between" mb={4}>
        <HStack spacing={2}>
          <Button colorScheme="blue" onClick={switchPuzzleLeft}>
            Previous
          </Button>
          <Heading size="md">Puzzle #{currentPuzzleID + 1}</Heading>
          <Button colorScheme="blue" onClick={switchPuzzleRight}>
            Next
          </Button>
        </HStack>

        <Badge colorScheme={puzzle.isSolved ? "green" : "red"} fontSize="lg" p={2} borderRadius="md">
          {puzzle.isSolved ? "SOLVED" : "ACTIVE"}
        </Badge>
      </HStack>

      <VStack align="stretch" spacing={4}>
        <Box p={3} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
          <Text fontWeight="bold" mb={1}>
            Goal:
          </Text>
          <Text>{puzzle.description}</Text>
          <Text mt={2} fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
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
            isDisabled={userCircuitGates.length === 0 || isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : "Check Solution"}
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
