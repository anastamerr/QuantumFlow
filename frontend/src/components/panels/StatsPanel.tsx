import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  VStack,
  HStack,
  useColorModeValue,
  Divider,
  Stack,
  Badge,
  Button,
  Progress,
} from '@chakra-ui/react'
import { selectGates, selectQubits } from '../../store/slices/circuitSlice'
import HeatmapPanel from './HeatmapPanel'

type ComplexityStats = {
  totalGates: number
  qubitCount: number
  depth: number
  entanglementCount: number
}

const entanglingGateTypes = new Set(['cnot', 'cx', 'cz', 'swap', 'toffoli', 'ccx', 'cswap'])

function calculateComplexity(stats: ComplexityStats): number {
  const score =
    (stats.totalGates ?? 0) * 2 +
    (stats.qubitCount ?? 0) * 5 +
    (stats.depth ?? 0) * 1 +
    (stats.entanglementCount ?? 0) * 3

  return Math.min(score, 100)
}

const StatsPanel = () => {
  const [showHeatmap, setShowHeatmap] = useState(false)
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)

  const {
    totalQubits,
    totalGates,
    circuitDepth,
    frequencyEntries,
    maxFrequency,
    entanglementCount,
    complexityScore,
  } = useMemo(() => {
    const totalQ = qubits.length
    const totalG = gates.length
    const depth =
      gates.length > 0
        ? Math.max(
            ...gates.map((gate) =>
              typeof gate.position === 'number' ? gate.position : 0,
            ),
          ) + 1
        : 0

    const gateFrequency = gates.reduce<Record<string, number>>((acc, gate) => {
      const type = gate.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const entanglement = gates.reduce((count, gate) => {
      const gateType = (gate.type || '').toLowerCase()
      if (entanglingGateTypes.has(gateType)) {
        return count + 1
      }
      if ((gate.targets && gate.targets.length > 0) || (gate.controls && gate.controls.length > 0)) {
        return count + 1
      }
      return count
    }, 0)

    const complexityScore = calculateComplexity({
      totalGates: totalG,
      qubitCount: totalQ,
      depth,
      entanglementCount: entanglement,
    })

    const entries = Object.entries(gateFrequency).sort((a, b) => b[1] - a[1])
    const max = entries.length ? Math.max(...entries.map(([, count]) => count)) : 0

    return {
      totalQubits: totalQ,
      totalGates: totalG,
      circuitDepth: depth,
      frequencyEntries: entries,
      maxFrequency: max,
      entanglementCount: entanglement,
      complexityScore,
    }
  }, [qubits, gates])

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const mutedText = useColorModeValue('gray.600', 'gray.400')
  const barBg = useColorModeValue('gray.100', 'gray.700')
  const barAccent = useColorModeValue('blue.500', 'blue.300')
  const statBg = useColorModeValue('gray.50', 'gray.900')

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={6}
      h="full"
      overflow="auto"
    >
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="md" mb={2}>
            Complexity Score
          </Heading>
          <Text fontSize="sm" color={mutedText} mb={3}>
            Composite metric estimating the circuit’s overall complexity.
          </Text>
          <HStack spacing={4} align="center">
            <Box flex={1}>
              <Progress
                value={complexityScore}
                max={100}
                colorScheme="blue"
                borderRadius="full"
                aria-label="Circuit complexity score progress"
              />
            </Box>
            <Text fontWeight="bold" minW="80px" textAlign="right">
              {complexityScore} / 100
            </Text>
          </HStack>
        </Box>

        <Stack
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          spacing={3}
        >
          <Box>
            <Heading size="md" mb={1}>
              Circuit Insights
            </Heading>
            <Text color={mutedText} fontSize="sm">
              Overview of the active circuit state.
            </Text>
          </Box>
          <Badge variant="subtle" colorScheme="blue" borderRadius="md" px={3} py={1}>
            Real-time
          </Badge>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Stat bg={statBg} borderRadius="md" p={4}>
            <StatLabel>Total Qubits</StatLabel>
            <StatNumber>{totalQubits}</StatNumber>
          </Stat>

          <Stat bg={statBg} borderRadius="md" p={4}>
            <StatLabel>Total Gates</StatLabel>
            <StatNumber>{totalGates}</StatNumber>
          </Stat>

          <Stat bg={statBg} borderRadius="md" p={4}>
            <StatLabel>Circuit Depth</StatLabel>
            <StatNumber>{circuitDepth}</StatNumber>
          </Stat>
        </SimpleGrid>

        <Divider />

        <Box>
          <Heading size="md" mb={2}>
            Gate Frequency
          </Heading>
          <Text fontSize="sm" color={mutedText} mb={4}>
            Distribution of gates currently placed on the circuit.
          </Text>
          <Button
            size="sm"
            alignSelf="flex-start"
            colorScheme="blue"
            variant={showHeatmap ? 'solid' : 'outline'}
            onClick={() => setShowHeatmap((prev) => !prev)}
            mb={showHeatmap ? 4 : 2}
          >
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </Button>

          {frequencyEntries.length === 0 ? (
            <Text color={mutedText} fontStyle="italic">
              No gates in the circuit yet. Add gates to see usage statistics.
            </Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {frequencyEntries.map(([type, count]) => {
                const percentage =
                  maxFrequency > 0 ? (count / maxFrequency) * 100 : 0

                return (
                  <HStack key={type} spacing={3} align="center">
                    <Text
                      w={{ base: '80px', md: '100px' }}
                      fontWeight="medium"
                      textTransform="uppercase"
                      fontSize="sm"
                    >
                      {type}
                    </Text>
                    <Box flex="1" bg={barBg} borderRadius="full" h="8px" overflow="hidden">
                      <Box
                        h="100%"
                        borderRadius="full"
                        bg={barAccent}
                        width={`${percentage}%`}
                        transition="width 0.2s ease"
                      />
                    </Box>
                    <Text fontWeight="semibold" minW="40px" textAlign="right">
                      {count}
                    </Text>
                  </HStack>
                )
              })}
            </VStack>
          )}
        </Box>
        {showHeatmap && (
          <Box>
            <HeatmapPanel />
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default StatsPanel

