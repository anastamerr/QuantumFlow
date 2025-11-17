import React, { useState } from "react";
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

interface TopicItem {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

const QUANTUM_TOPICS: TopicItem[] = [
  // Beginner Topics
  { id: "qubits-basics", title: "Qubits and Superposition", difficulty: "Beginner" },
  { id: "bloch-sphere", title: "Bloch Sphere Representation", difficulty: "Beginner" },
  { id: "measurement", title: "Quantum Measurement", difficulty: "Beginner" },
  { id: "pauli-gates", title: "Pauli Gates (X, Y, Z)", difficulty: "Beginner" },
  { id: "hadamard", title: "Hadamard Gate", difficulty: "Beginner" },
  { id: "bell-state", title: "Bell States and Entanglement", difficulty: "Beginner" },
  { id: "quantum-circuit-basics", title: "Quantum Circuit Basics", difficulty: "Beginner" },

  // Intermediate Topics
  { id: "controlled-gates", title: "Controlled Gates (CNOT, CCNOT)", difficulty: "Intermediate" },
  { id: "phase-gates", title: "Phase Gates and Rotations", difficulty: "Intermediate" },
  { id: "quantum-fourier", title: "Quantum Fourier Transform", difficulty: "Intermediate" },
  { id: "phase-kickback", title: "Phase Kickback", difficulty: "Intermediate" },
  { id: "swap-gates", title: "SWAP and Fredkin Gates", difficulty: "Intermediate" },
  { id: "deutsch-algorithm", title: "Deutsch-Jozsa Algorithm", difficulty: "Intermediate" },
  { id: "bernstein-vazirani", title: "Bernstein-Vazirani Algorithm", difficulty: "Intermediate" },
  { id: "grover-amplitude", title: "Grover's Algorithm - Amplitude Amplification", difficulty: "Intermediate" },
  { id: "quantum-phase-estimation", title: "Quantum Phase Estimation", difficulty: "Intermediate" },

  // Advanced Topics
  { id: "vqe", title: "Variational Quantum Eigensolver (VQE)", difficulty: "Advanced" },
  { id: "qaoa", title: "Quantum Approximate Optimization Algorithm (QAOA)", difficulty: "Advanced" },
  { id: "hhl-algorithm", title: "HHL Algorithm for Linear Systems", difficulty: "Advanced" },
  { id: "shor-algorithm", title: "Shor's Factoring Algorithm", difficulty: "Advanced" },
  { id: "quantum-walks", title: "Quantum Walks", difficulty: "Advanced" },
  { id: "quantum-error-correction", title: "Quantum Error Correction Codes", difficulty: "Advanced" },
  { id: "stabilizer-codes", title: "Stabilizer Codes and Surface Codes", difficulty: "Advanced" },
  { id: "quantum-teleportation", title: "Quantum Teleportation", difficulty: "Advanced" },
  { id: "quantum-key-distribution", title: "Quantum Key Distribution (BB84)", difficulty: "Advanced" },
  { id: "amplitude-estimation", title: "Amplitude Estimation", difficulty: "Advanced" },
  { id: "iterative-phase-estimation", title: "Iterative Phase Estimation", difficulty: "Advanced" },

  // Expert Topics
  { id: "quantum-machine-learning", title: "Quantum Machine Learning", difficulty: "Expert" },
  { id: "quantum-neural-networks", title: "Quantum Neural Networks (QNN)", difficulty: "Expert" },
  { id: "qgan", title: "Quantum Generative Adversarial Networks (QGAN)", difficulty: "Expert" },
  { id: "quantum-kernel-methods", title: "Quantum Kernel Methods", difficulty: "Expert" },
  { id: "adiabatic-quantum", title: "Adiabatic Quantum Computing", difficulty: "Expert" },
  { id: "topological-quantum", title: "Topological Quantum Computing", difficulty: "Expert" },
  { id: "quantum-simulation", title: "Quantum Simulation and Hamiltonian Dynamics", difficulty: "Expert" },
  { id: "variational-ansatz", title: "Variational Ansatz Design", difficulty: "Expert" },
  { id: "quantum-chemistry", title: "Quantum Chemistry Simulation", difficulty: "Expert" },
  { id: "barren-plateaus", title: "Barren Plateaus in Quantum Circuits", difficulty: "Expert" },
  { id: "dynamical-decoupling", title: "Dynamical Decoupling and Pulse Shaping", difficulty: "Expert" },
  { id: "quantum-noise-mitigation", title: "Quantum Noise Mitigation Techniques", difficulty: "Expert" },
];

const LibraryPanel: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);

  const listBg = useColorModeValue("gray.50", "gray.800");
  const listBorderColor = useColorModeValue("gray.200", "gray.700");
  const itemBg = useColorModeValue("white", "gray.700");
  const itemHoverBg = useColorModeValue("blue.50", "gray.600");
  const selectedBg = useColorModeValue("blue.100", "blue.900");
  const textColor = useColorModeValue("gray.700", "gray.300");

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "green";
      case "Intermediate":
        return "blue";
      case "Advanced":
        return "orange";
      case "Expert":
        return "red";
      default:
        return "gray";
    }
  };

  const groupedTopics = {
    Beginner: QUANTUM_TOPICS.filter(t => t.difficulty === "Beginner"),
    Intermediate: QUANTUM_TOPICS.filter(t => t.difficulty === "Intermediate"),
    Advanced: QUANTUM_TOPICS.filter(t => t.difficulty === "Advanced"),
    Expert: QUANTUM_TOPICS.filter(t => t.difficulty === "Expert"),
  };


  return (
    <HStack h="100%" w="100%" spacing={0} align="stretch">
      {/* Topics List (Left) */}
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
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.03)' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.2)' },
        }}
        position="sticky"
        top={0}
      >
        {/* Header */}
        <Box p={3} borderBottomWidth={1} borderColor={listBorderColor} flexShrink={0}>
          <HStack justify="space-between" mb={2}>
            <Heading size="md">Quantum Library</Heading>
          </HStack>
          <Text fontSize="xs" color={textColor}>
            {QUANTUM_TOPICS.length} topics • Learn quantum computing
          </Text>
        </Box>

        {/* Topics by Difficulty */}
        <Box flex={1} overflowY="auto" w="100%">
          {Object.entries(groupedTopics).map(([difficulty, topics]) => (
            <Box key={difficulty}>
              {/* Difficulty Section Header */}
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

              {/* Topics in this difficulty */}
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
                    fontWeight={selectedTopic?.id === topic.id ? "600" : "400"}
                    textAlign="left"
                    color={textColor}
                  >
                    {topic.title}
                  </Text>
                </Button>
              ))}
            </Box>
          ))}
        </Box>
      </VStack>

      {/* Content Area (Right) */}
      <VStack flex={1} h="100%" p={6} spacing={4} align="stretch" overflowY="auto">
        {selectedTopic ? (
          <>
            <Box>
              <Heading size="lg" mb={2}>
                {selectedTopic.title}
              </Heading>
              <HStack>
                <Badge colorScheme={getDifficultyColor(selectedTopic.difficulty)}>
                  {selectedTopic.difficulty}
                </Badge>
              </HStack>
            </Box>

            <Divider />

            {/* Placeholder content */}
            <VStack align="start" spacing={4} flex={1}>
              <Box
                p={6}
                borderWidth={2}
                borderStyle="dashed"
                borderColor={listBorderColor}
                borderRadius="md"
                w="100%"
              >
                <Text fontSize="sm" color={textColor} fontStyle="italic">
                  Content for "{selectedTopic.title}" will be added here. This page will include an overview, key concepts, and relevant research links.
                </Text>
              </Box>
            </VStack>
          </>
        ) : (
          <VStack justify="center" align="center" h="100%" spacing={4}>
            <Heading size="md" color={textColor}>
              Select a Topic
            </Heading>
            <Text color={textColor} fontSize="sm">
              Click on any topic from the list to view its details
            </Text>
          </VStack>
        )}
      </VStack>
    </HStack>
  );
};

export default LibraryPanel;
