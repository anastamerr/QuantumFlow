import React from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { selectGates, selectQubits } from "../../store/slices/circuitSlice";
import type { RootState } from "../../store";
import { calculateCircuitStats } from "../../utils/circuitStats";

export default function CircuitStatsPanel() {
  const gates = useSelector((state: RootState) => selectGates(state));
  const qubits = useSelector((state: RootState) => selectQubits(state));

  const stats = calculateCircuitStats({
    qubits,
    gates,
    maxPosition: 0,
    name: "",
    description: "",
  });

  return (
    <Box>
      <Heading size="md" mb={4}>
        Circuit Statistics
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
        <Stat>
          <StatLabel>Gate Count</StatLabel>
          <StatNumber>{stats.gateCount}</StatNumber>
          <StatHelpText>Total gates in the circuit</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>Circuit Depth</StatLabel>
          <StatNumber>{stats.depth}</StatNumber>
          <StatHelpText>Number of time-steps (max position + 1)</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>Two-Qubit Gates</StatLabel>
          <StatNumber>{stats.twoQubitGates}</StatNumber>
          <StatHelpText>Multi-qubit interactions</StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
        <Stat>
          <StatLabel>Entangled Qubits</StatLabel>
          <StatNumber>
            {stats.entangledQubits}/{qubits.length}
          </StatNumber>
          <StatHelpText>Qubits participating in entangling gates</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>Entangled Pairs</StatLabel>
          <StatNumber>{stats.entangledPairs}</StatNumber>
          <StatHelpText>Unique two-qubit connections</StatHelpText>
        </Stat>

        <Box>
          <Stat>
            <StatLabel>Complexity Score</StatLabel>
            <StatNumber>{stats.complexityScore}%</StatNumber>
            <StatHelpText>
              Combined heuristic of gates, depth, and entanglement
            </StatHelpText>
          </Stat>
          <VStack spacing={2} align="stretch" mt={2}>
            <Progress
              value={stats.complexityScore}
              size="sm"
              colorScheme="purple"
            />
            <Text fontSize="sm" color="gray.500">
              Higher score indicates more complex circuits (harder to simulate
              and run on noisy hardware).
            </Text>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
