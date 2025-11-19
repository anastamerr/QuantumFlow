import React, { useMemo } from 'react'
import {
  Box,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  VStack,
  HStack,
  useToast,
  Tag,
} from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

export default function StatsPanel(): JSX.Element {
  const gates = useSelector((state: RootState) => state.circuit.gates)
  const qubits = useSelector((state: RootState) => state.circuit.qubits)
  const toast = useToast()

  const computed = useMemo(() => {
    const gateCount = gates.length
    const depth = gateCount ? Math.max(...gates.map(g => g.position ?? 0)) + 1 : 0
    const twoQubit = gates.filter(g => !!g.targets && g.targets.length > 0).length
    const paramGates = gates.filter(g => g.params && Object.keys(g.params).length > 0).length

    // Breakdown by type
    const byType = gates.reduce<Record<string, number>>((acc, g) => {
      acc[g.type] = (acc[g.type] || 0) + 1
      return acc
    }, {})

    // Rough entanglement estimate: fraction of qubits involved in two-qubit gates
    const qubitsInTwoQubit = new Set<number>()
    gates.forEach(g => {
      if (g.targets && g.targets.length > 0) {
        qubitsInTwoQubit.add(g.qubit)
        g.targets.forEach(t => qubitsInTwoQubit.add(t))
      }
    })
    const entanglementEstimate = qubits.length ? (qubitsInTwoQubit.size / qubits.length) : 0

    // Complexity score heuristic
    // Raw cost = gateCount + depth*2 + twoQubit*4 + paramGates*1.5
    const raw = gateCount + depth * 2 + twoQubit * 4 + paramGates * 1.5
    const normalization = Math.max(1, qubits.length * 10) // scale with qubit count
    const complexityScore = Math.min(100, Math.round((raw / normalization) * 100))

    // Suggestions based on heuristics
    const suggestions: string[] = []
    if (twoQubit > Math.max(2, Math.floor(gateCount * 0.15))) {
      suggestions.push('Many two-qubit gates — consider qubit remapping or decomposition to reduce entangling gates.')
    }
    if (depth > Math.max(8, qubits.length * 2)) {
      suggestions.push('Circuit depth is high — look for opportunities to merge or remove commuting single-qubit gates.')
    }
    if (paramGates > 0) {
      suggestions.push('Parameterized gates present — consider parameter consolidation or analytic simplifications.')
    }
    if (complexityScore > 70) {
      suggestions.push('High complexity score — try optimization/transpilation for target backend or manual refactor.')
    }
    if (suggestions.length === 0) {
      suggestions.push('No immediate issues detected. Consider running automatic optimization for small wins.')
    }

    return {
      gateCount,
      depth,
      twoQubit,
      paramGates,
      byType,
      entanglementEstimate,
      complexityScore,
      suggestions,
    }
  }, [gates, qubits])

  const handleCopyStats = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(computed, null, 2))
      toast({
        title: 'Stats copied',
        description: 'Panel stats copied to clipboard as JSON.',
        status: 'success',
        duration: 2500,
      })
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy stats to clipboard.',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <Box p={4}>
      <VStack align="stretch" spacing={4}>
        <Heading size="md">Circuit Statistics</Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <Stat>
            <StatLabel>Gate Count</StatLabel>
            <StatNumber>{computed.gateCount}</StatNumber>
            <StatHelpText>{computed.paramGates} parameterized</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Circuit Depth</StatLabel>
            <StatNumber>{computed.depth}</StatNumber>
            <StatHelpText>Longest time position + 1</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Two-qubit Gates</StatLabel>
            <StatNumber>{computed.twoQubit}</StatNumber>
            <StatHelpText>
              Entanglement estimate: {(computed.entanglementEstimate * 100).toFixed(0)}%
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box>
          <Text fontSize="sm" mb={1}>Complexity Score</Text>
          <HStack spacing={3}>
            <Progress
              value={computed.complexityScore}
              size="sm"
              flex={1}
              colorScheme={computed.complexityScore > 70 ? 'red' : computed.complexityScore > 40 ? 'yellow' : 'green'}
            />
            <Tag>{computed.complexityScore}%</Tag>
          </HStack>
          <Text fontSize="xs" color="gray.500" mt={2}>
            Heuristic score based on gate count, depth, parameterized and two-qubit gates scaled by qubit count, not accurate by any means
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" mb={2}>Gate breakdown</Text>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Gate</Th>
                <Th isNumeric>Count</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(computed.byType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <Tr key={type}>
                    <Td>{type}</Td>
                    <Td isNumeric>{count}</Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </Box>

        <Box>
          <Text fontSize="sm" mb={2}>Optimization suggestions</Text>
          <VStack align="start" spacing={2}>
            {computed.suggestions.map((s, i) => (
              <Text key={i} fontSize="sm">• {s}</Text>
            ))}
          </VStack>
        </Box>

        <HStack justify="flex-end" spacing={2}>
          <Button size="sm" onClick={handleCopyStats}>Copy JSON</Button>
        </HStack>
      </VStack>
    </Box>
  )
}