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
  Spacer,
  IconButton,
  Collapse,
  Divider,
  Tooltip,
} from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react'
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
  const toast = useToast()
  const userCircuitGates = useSelector((state: RootState) => state.circuit.gates)

  const [currentPuzzleID, setCurrentPuzzleID] = React.useState(0)
  const [showTarget, setShowTarget] = React.useState(false)
  const [showDetails, setShowDetails] = React.useState(false)

  const puzzle = quantumPuzzles[currentPuzzleID]

  // keyboard navigation: left/right arrows to change puzzle
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentPuzzleID((id) => (id + 1) % quantumPuzzles.length)
      } else if (e.key === 'ArrowLeft') {
        setCurrentPuzzleID((id) => (id - 1 + quantumPuzzles.length) % quantumPuzzles.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const switchPuzzleRight = () => {
    setCurrentPuzzleID((id) => (id + 1) % quantumPuzzles.length)
    setShowTarget(false)
    setShowDetails(false)
  }

  const switchPuzzleLeft = () => {
    setCurrentPuzzleID((id) => (id - 1 + quantumPuzzles.length) % quantumPuzzles.length)
    setShowTarget(false)
    setShowDetails(false)
  }

  const solvedCount = quantumPuzzles.filter(p => p.isSolved).length
  const progressPct = Math.round((solvedCount / quantumPuzzles.length) * 100)

  const handleCheckSolution = () => {
    // keep original puzzle logic: random success simulation
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
      puzzle.attemptCount += 1
    } else {
      puzzle.attemptCount += 1
      toast({
        title: 'Incorrect Solution',
        description: 'The output of your circuit does not match the required target.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }

    // force update UI (since we're mutating const array items)
    setCurrentPuzzleID((id) => id)
  }

  const handleCopyGoal = async () => {
    try {
      await navigator.clipboard.writeText(`${puzzle.description}\nTarget: ${puzzle.targetMatrix}`)
      toast({
        title: 'Copied',
        description: 'Puzzle goal and target copied to clipboard.',
        status: 'success',
        duration: 2000,
      })
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard.',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleMarkSolved = () => {
    puzzle.isSolved = true
    toast({
      title: 'Marked solved',
      description: 'Puzzle flagged as solved.',
      status: 'success',
      duration: 2000,
    })
    setCurrentPuzzleID((id) => id) // trigger re-render
  }

  const handleResetPuzzle = () => {
    puzzle.isSolved = false
    puzzle.attemptCount = 0
    toast({
      title: 'Reset',
      description: 'Puzzle attempts cleared and marked active.',
      status: 'info',
      duration: 2000,
    })
    setCurrentPuzzleID((id) => id)
  }

  return (
    <Box p={4} height="100%" overflowY="auto">
      <HStack mb={4} align="center">
        <HStack spacing={2}>
          <IconButton aria-label="previous" icon={<ChevronLeft size={18} />} size="sm" onClick={switchPuzzleLeft} />
          <Heading size="md">Puzzle #{currentPuzzleID + 1}</Heading>
          <IconButton aria-label="next" icon={<ChevronRight size={18} />} size="sm" onClick={switchPuzzleRight} />
          <Badge
            colorScheme={puzzle.difficulty === 'Beginner' ? 'green' : puzzle.difficulty === 'Intermediate' ? 'orange' : 'red'}
            px={2}
            py={1}
            borderRadius="md"
          >
            {puzzle.difficulty}
          </Badge>
        </HStack>

        <Spacer />

        <HStack spacing={3} width={{ base: '40%', md: '30%' }}>
          <Text fontSize="sm" whiteSpace="nowrap">{solvedCount}/{quantumPuzzles.length} solved</Text>
          <Progress value={progressPct} size="sm" flex="1" borderRadius="md" />
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={4}>
        <Box p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md">
          <Text fontWeight="bold" mb={2}>Goal</Text>
          <Text mb={2}>{puzzle.description}</Text>

          <HStack spacing={3} align="center">
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              Qubits required: {puzzle.qubits}
            </Text>

            <Tooltip label="Copy puzzle goal and target to clipboard" aria-label="copy">
              <Button size="sm" leftIcon={<Copy size={14} />} onClick={handleCopyGoal}>
                Copy
              </Button>
            </Tooltip>

            <Button size="sm" variant="outline" onClick={() => setShowTarget((s) => !s)}>
              {showTarget ? 'Hide Target' : 'Show Target'}
            </Button>

            <Button size="sm" colorScheme="yellow" variant="ghost" onClick={() => setShowDetails((s) => !s)}>
              {showDetails ? 'Hide Details' : 'Details'}
            </Button>
          </HStack>

          <Collapse in={showTarget} animateOpacity>
            <Box mt={3} p={3} bg="white" _dark={{ bg: 'gray.800' }} borderRadius="md" borderWidth={1} borderColor="gray.100">
              <Text fontSize="sm" fontWeight="semibold">Target Matrix</Text>
              <Text fontSize="sm" mt={1} whiteSpace="pre-wrap">{puzzle.targetMatrix}</Text>
            </Box>
          </Collapse>

          <Collapse in={showDetails} animateOpacity>
            <Box mt={3}>
              <Divider mb={3} />
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                Tip: Build and test your circuit on the canvas. When you think it matches the target, click "Check Solution".
              </Text>
            </Box>
          </Collapse>
        </Box>

        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Text fontSize="sm">Circuit Gates: {userCircuitGates.length}</Text>
            <Text fontSize="sm">Attempts: {puzzle.attemptCount}</Text>
            <HStack>
              <Text fontSize="sm">Status:</Text>
              <Badge colorScheme={puzzle.isSolved ? 'green' : 'red'}>
                {puzzle.isSolved ? 'SOLVED' : 'ACTIVE'}
              </Badge>
            </HStack>
          </VStack>

          <HStack>
            <Button colorScheme="blue" onClick={handleCheckSolution} isDisabled={userCircuitGates.length === 0}>
              Check Solution
            </Button>

            <Button variant="outline" onClick={handleMarkSolved} title="Mark as solved manually">
              Mark Solved
            </Button>

            <Button variant="ghost" colorScheme="red" onClick={handleResetPuzzle}>
              Reset
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  )
}