/// <reference types="vite/client" />
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
  Progress,
  Spacer,
  IconButton,
  Collapse,
  Divider,
  Tooltip,
} from "@chakra-ui/react"
import { useSelector } from "react-redux"
import { ChevronLeft, ChevronRight, Copy } from "lucide-react"
import type { RootState } from "@/store"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

type PuzzleState = {
  id: number
  description: string
  qubits: number
  targetMatrix: string
  isSolved: boolean
  attemptCount: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  constraints?: Record<string, any>
}

export default function PuzzlesPanel(): JSX.Element {
  const toast = useToast()
  const [currentPuzzleID, setCurrentPuzzleID] = React.useState(0)
  const [puzzles, setPuzzles] = React.useState<PuzzleState[]>([])
  const [showTarget, setShowTarget] = React.useState(false)
  const [showDetails, setShowDetails] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingPuzzles, setIsLoadingPuzzles] = React.useState(true)

  const userCircuitGates = useSelector((state: RootState) => state.circuit.gates)
  const numQubits = useSelector((state: RootState) => state.circuit.qubits.length)

  // Fetch puzzles from backend on component mount
  React.useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/puzzles`)
        if (!response.ok) {
          throw new Error("Failed to fetch puzzles")
        }
        const data = await response.json()
        const puzzlesWithState = data.puzzles.map((p: typeof data.puzzles[0]) => ({
          ...p,
          // ensure constraints field is preserved (may be undefined)
          constraints: p.constraints ?? undefined,
          isSolved: false,
          attemptCount: 0,
        }))
        setPuzzles(puzzlesWithState)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load puzzles. Using default puzzles.",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        console.error("Error fetching puzzles:", error)
      } finally {
        setIsLoadingPuzzles(false)
      }
    }

    fetchPuzzles()
  }, [toast])

  // Keyboard navigation for puzzle switching
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentPuzzleID((id) => (id + 1) % puzzles.length)
      } else if (e.key === "ArrowLeft") {
        setCurrentPuzzleID((id) => (id - 1 + puzzles.length) % puzzles.length)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [puzzles.length])

  if (isLoadingPuzzles || puzzles.length === 0) {
    return (
      <Box p={4} height="100%" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>Loading puzzles...</Text>
        </VStack>
      </Box>
    )
  }

  const puzzle = puzzles[currentPuzzleID]

  const switchPuzzleRight = () => {
    setCurrentPuzzleID((id) => (id + 1) % puzzles.length)
    setShowTarget(false)
    setShowDetails(false)
  }

  const switchPuzzleLeft = () => {
    setCurrentPuzzleID((id) => (id - 1 + puzzles.length) % puzzles.length)
    setShowTarget(false)
    setShowDetails(false)
  }

  const solvedCount = puzzles.filter((p) => p.isSolved).length
  const progressPct = Math.round((solvedCount / puzzles.length) * 100)

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
        const updatedPuzzles = [...puzzles]
        updatedPuzzles[currentPuzzleID].isSolved = true
        setPuzzles(updatedPuzzles)
      } else {
        toast({
          title: "Incorrect Solution",
          description: "The output of your circuit does not match the required target.",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
      }
      const updatedPuzzles = [...puzzles]
      updatedPuzzles[currentPuzzleID].attemptCount += 1
      setPuzzles(updatedPuzzles)
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

  const handleCopyGoal = async () => {
    try {
      await navigator.clipboard.writeText(`${puzzle.description}\nTarget: ${puzzle.targetMatrix}`)
      toast({
        title: "Copied",
        description: "Puzzle goal and target copied to clipboard.",
        status: "success",
        duration: 2000,
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        status: "error",
        duration: 3000,
      })
    }
  }

  const handleMarkSolved = () => {
    const updatedPuzzles = [...puzzles]
    updatedPuzzles[currentPuzzleID].isSolved = true
    setPuzzles(updatedPuzzles)
    toast({
      title: "Marked solved",
      description: "Puzzle flagged as solved.",
      status: "success",
      duration: 2000,
    })
  }

  const handleResetPuzzle = () => {
    const updatedPuzzles = [...puzzles]
    updatedPuzzles[currentPuzzleID].isSolved = false
    updatedPuzzles[currentPuzzleID].attemptCount = 0
    setPuzzles(updatedPuzzles)
    toast({
      title: "Reset",
      description: "Puzzle attempts cleared and marked active.",
      status: "info",
      duration: 2000,
    })
  }

  const renderConstraints = (c: Record<string, any> | undefined) => {
    if (!c) return <Text fontSize="sm" color="gray.500">No special constraints for this puzzle.</Text>
    return (
      <VStack align="start" spacing={1} mt={2}>
        {c.avoid_gates && c.avoid_gates.length > 0 && (
          <Text fontSize="sm">Avoid gates: {c.avoid_gates.join(", ")}</Text>
        )}
        {c.blacklist && c.blacklist.length > 0 && (
          <Text fontSize="sm">Blacklisted: {c.blacklist.join(", ")}</Text>
        )}
        {c.allowed_gates && c.allowed_gates.length > 0 && (
          <Text fontSize="sm">Allowed gates: {c.allowed_gates.join(", ")}</Text>
        )}
        {typeof c.max_total_gates !== "undefined" && c.max_total_gates !== null && (
          <Text fontSize="sm">Max total gates: {c.max_total_gates}</Text>
        )}
        {typeof c.min_total_gates !== "undefined" && c.min_total_gates !== null && (
          <Text fontSize="sm">Min total gates: {c.min_total_gates}</Text>
        )}
        {c.exact_counts && (
          <Text fontSize="sm">
            Exact counts:{" "}
            {Object.entries(c.exact_counts)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")}
          </Text>
        )}
        {c.require_different_gates && <Text fontSize="sm">Require distinct gates (no duplicates)</Text>}
        {/* show any other constraint keys not rendered above */}
        {Object.keys(c)
          .filter((k) => ![
            "avoid_gates",
            "blacklist",
            "allowed_gates",
            "max_total_gates",
            "min_total_gates",
            "exact_counts",
            "require_different_gates",
            "limits",
          ].includes(k))
          .map((k) => (
            <Text key={k} fontSize="xs" color="gray.500">{k}: {JSON.stringify((c as any)[k])}</Text>
          ))}
      </VStack>
    )
  }

  return (
    <Box p={4} height="100%" overflowY="auto">
      <HStack mb={4} align="center">
        <HStack spacing={2}>
          <IconButton aria-label="previous" icon={<ChevronLeft size={18} />} size="sm" onClick={switchPuzzleLeft} />
          <Heading size="md">Puzzle #{currentPuzzleID + 1}</Heading>
          <IconButton aria-label="next" icon={<ChevronRight size={18} />} size="sm" onClick={switchPuzzleRight} />
          <Badge colorScheme={puzzle.difficulty === "Beginner" ? "green" : puzzle.difficulty === "Intermediate" ? "orange" : "red"} px={2} py={1} borderRadius="md">
            {puzzle.difficulty}
          </Badge>
        </HStack>
        <Spacer />
        <HStack spacing={3} width={{ base: "40%", md: "30%" }}>
          <Text fontSize="sm" whiteSpace="nowrap">{solvedCount}/{puzzles.length} solved</Text>
          <Progress value={progressPct} size="sm" flex="1" borderRadius="md" />
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={4}>
        <Box p={3} bg="gray.50" _dark={{ bg: "gray.700" }} borderRadius="md">
          <Text fontWeight="bold" mb={2}>Goal</Text>
          <Text mb={2}>{puzzle.description}</Text>
          <HStack spacing={3} align="center">
            <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>Qubits required: {puzzle.qubits}</Text>
            <Tooltip label="Copy puzzle goal and target to clipboard" aria-label="copy">
              <Button size="sm" leftIcon={<Copy size={14} />} onClick={handleCopyGoal}>Copy</Button>
            </Tooltip>
            <Button size="sm" variant="outline" onClick={() => setShowTarget((s) => !s)}>
              {showTarget ? "Hide Target" : "Show Target"}
            </Button>
            <Button size="sm" colorScheme="yellow" variant="ghost" onClick={() => setShowDetails((s) => !s)}>
              {showDetails ? "Hide Details" : "Details"}
            </Button>
          </HStack>
          <Collapse in={showTarget} animateOpacity>
            <Box mt={3} p={3} bg="white" _dark={{ bg: "gray.800" }} borderRadius="md" borderWidth={1} borderColor="gray.100">
              <Text fontSize="sm" fontWeight="semibold">Target Matrix</Text>
              <Text fontSize="sm" mt={1} whiteSpace="pre-wrap">{puzzle.targetMatrix}</Text>
            </Box>
          </Collapse>
          <Collapse in={showDetails} animateOpacity>
            <Box mt={3}>
              <Divider mb={3} />
              <Heading size="sm" mb={2}>Details & Constraints</Heading>
              {renderConstraints(puzzle.constraints)}
              <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }} mt={3}>
                Tip: Build and test your circuit on the canvas. When you think it matches the target, click "Check Solution". Ps: don't use the ChatBot ;)
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
              <Badge colorScheme={puzzle.isSolved ? "green" : "red"}>{puzzle.isSolved ? "SOLVED" : "ACTIVE"}</Badge>
            </HStack>
          </VStack>
          <HStack>
            <Button colorScheme="blue" onClick={handleCheckSolution} isDisabled={userCircuitGates.length === 0 || isLoading}>
              {isLoading ? <Spinner size="sm" /> : "Check Solution"}
            </Button>
            <Button variant="outline" onClick={handleMarkSolved} title="Mark as solved manually">Mark Solved</Button>
            <Button variant="ghost" colorScheme="red" onClick={handleResetPuzzle}>Reset</Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  )
}
