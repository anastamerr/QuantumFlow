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

interface ProjectIdea {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const PROJECT_IDEAS: ProjectIdea[] = [
  // Beginner
  { id: "grover-visualizer", title: "Grover's Algorithm Visualizer", difficulty: "Beginner" },
  { id: "qft-educational-tool", title: "Quantum Fourier Transform Explorer", difficulty: "Beginner" },
  { id: "quantum-gates-animator", title: "Interactive Quantum Gates Animator", difficulty: "Beginner" },

  // Intermediate
  { id: "qasm-to-visual", title: "QASM-to-Visualizer Converter", difficulty: "Intermediate" },
  { id: "quantum-teleportation-demo", title: "Quantum Teleportation Tutorial", difficulty: "Intermediate" },
  { id: "quantum-randomness", title: "Quantum Randomness Service", difficulty: "Intermediate" },

  // Advanced
  { id: "vqe-molecule", title: "VQE for Small Molecules (H2)", difficulty: "Advanced" },
  { id: "qaoa-optimizer", title: "QAOA for Max-Cut Problems", difficulty: "Advanced" },
  { id: "error-mitigation-playground", title: "Noise Mitigation Playground", difficulty: "Advanced" },
  { id: "quantum-chemistry-gui", title: "Quantum Chemistry Simulation App", difficulty: "Advanced" },
  { id: "quantum-ml-demos", title: "Quantum Machine Learning Demos", difficulty: "Advanced" },
  { id: "multi-backend-runner", title: "Multi-backend Experiment Runner", difficulty: "Advanced" },
];

const ProjectPanel: React.FC = () => {
  const [selected, setSelected] = useState<ProjectIdea | null>(null);

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
      default:
        return "gray";
    }
  };

  const groupedIdeas = {
    Beginner: PROJECT_IDEAS.filter(i => i.difficulty === "Beginner"),
    Intermediate: PROJECT_IDEAS.filter(i => i.difficulty === "Intermediate"),
    Advanced: PROJECT_IDEAS.filter(i => i.difficulty === "Advanced"),
  };

  return (
    <HStack h="100%" w="100%" spacing={0} align="stretch">
      {/* Projects List (Left) */}
      <VStack
        w="250px"
        h="100%"
        bg={listBg}
        borderRightWidth={0}
        borderColor={listBorderColor}
        spacing={0}
        align="stretch"
        overflowY="auto"
        position="sticky"
        top={0}
        css={{
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.03)' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.2)' },
        }}
      >
        {/* Header */}
        <Box p={3} borderBottomWidth={1} borderColor={listBorderColor} flexShrink={0}>
          <HStack justify="space-between" mb={2}>
            <Heading size="md">Projects</Heading>
          </HStack>
          <Text fontSize="xs" color={textColor}>
            {PROJECT_IDEAS.length} ideas • Qiskit projects
          </Text>
        </Box>

        {/* Project Titles grouped by difficulty */}
        <Box flex={1} overflowY="auto" w="100%">
          {Object.entries(groupedIdeas).map(([difficulty, ideas]) => (
            <Box key={difficulty}>
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
                    {ideas.length} ideas
                  </Text>
                </HStack>
              </Box>

              {ideas.map((idea) => (
                <Button
                  key={idea.id}
                  w="100%"
                  h="auto"
                  p={3}
                  justifyContent="flex-start"
                  variant="ghost"
                  bg={selected?.id === idea.id ? selectedBg : itemBg}
                  _hover={{ bg: itemHoverBg }}
                  borderRadius={0}
                  borderBottomWidth={1}
                  borderColor={listBorderColor}
                  onClick={() => setSelected(idea)}
                >
                  <Text
                    fontSize="sm"
                    fontWeight={selected?.id === idea.id ? "600" : "400"}
                    textAlign="left"
                    color={textColor}
                  >
                    {idea.title}
                  </Text>
                </Button>
              ))}
            </Box>
          ))}
        </Box>
      </VStack>

      {/* Content Area (Right) */}
      <VStack flex={1} h="100%" p={6} spacing={4} align="stretch" overflowY="auto">
        {selected ? (
          <>
            <Box>
              <Heading size="lg" mb={2}>
                {selected.title}
              </Heading>
            </Box>

            <Divider />

            {/* Placeholder content area (titles only requested) */}
            <VStack align="start" spacing={4} flex={1}>
              <Box p={6} w="100%">
                <Text fontSize="sm" color={textColor} fontStyle="italic">
                  Placeholder for "{selected.title}" project page.
                </Text>
              </Box>
            </VStack>
          </>
        ) : (
          <VStack justify="center" align="center" h="100%" spacing={4}>
            <Heading size="md" color={textColor}>
              Select a Project
            </Heading>
            <Text color={textColor} fontSize="sm">
              Click a project idea from the list to view its placeholder page
            </Text>
          </VStack>
        )}
      </VStack>
    </HStack>
  );
};

export default ProjectPanel;
