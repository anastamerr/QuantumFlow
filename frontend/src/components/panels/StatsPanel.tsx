import React from 'react'
import { Box, Heading, Text, Stat, StatLabel, StatNumber } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

export default function StatsPanel(): JSX.Element {
  const gates = useSelector((state: RootState) => state.circuit.gates)

  const gateCount = gates.length
  const depth = gates.length ? Math.max(...gates.map(g => g.position ?? 0)) + 1 : 0
  const twoQubit = gates.filter(g => !!g.targets && g.targets.length > 0).length

  return (
    <Box p={4}>
      <Heading size="md" mb={3}>Stats</Heading>

      <Stat mb={2}>
        <StatLabel>Gate Count</StatLabel>
        <StatNumber>{gateCount}</StatNumber>
      </Stat>

      <Stat mb={2}>
        <StatLabel>Circuit Depth</StatLabel>
        <StatNumber>{depth}</StatNumber>
      </Stat>

      <Stat mb={2}>
        <StatLabel>Two-qubit Gates</StatLabel>
        <StatNumber>{twoQubit}</StatNumber>
      </Stat>

      <Box mt={4}>
        <Text fontSize="sm" color="gray.500">
          Quick stats for the currently loaded circuit.
        </Text>
      </Box>
    </Box>
  )
}