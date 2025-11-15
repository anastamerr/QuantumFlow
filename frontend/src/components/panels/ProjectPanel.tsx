import React, { useEffect, useState } from "react";
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Heading,
  useColorModeValue,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Image,
  Stack,
  Tag,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux'
import { setActivePanel, selectActivePanel } from '../../store/slices/uiSlice'

interface ProjectIdea {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description?: string;
}

const PROJECT_IDEAS: ProjectIdea[] = [
  // Beginner
  { id: "grover-visualizer", title: "Grover's Algorithm Visualizer", difficulty: "Beginner", description: "Visualize how Grover amplifies probability." },
  { id: "qft-educational-tool", title: "Quantum Fourier Transform Explorer", difficulty: "Beginner", description: "Step through QFT on few qubits." },
  { id: "quantum-gates-animator", title: "Interactive Quantum Gates Animator", difficulty: "Beginner", description: "See gate effects on qubit states." },

  // Intermediate
  { id: "qasm-to-visual", title: "QASM-to-Visualizer Converter", difficulty: "Intermediate", description: "Convert QASM text to a visual circuit." },
  { id: "quantum-teleportation-demo", title: "Quantum Teleportation Tutorial", difficulty: "Intermediate", description: "Interactive teleportation demo." },
  { id: "quantum-randomness", title: "Quantum Randomness Service", difficulty: "Intermediate", description: "Generate randomness using simulators." },

  // Advanced
  { id: "vqe-molecule", title: "VQE for Small Molecules (H2)", difficulty: "Advanced", description: "Variational approach for H2 energy." },
  { id: "qaoa-optimizer", title: "QAOA for Max-Cut Problems", difficulty: "Advanced", description: "Apply QAOA to combinatorial problems." },
  { id: "error-mitigation-playground", title: "Noise Mitigation Playground", difficulty: "Advanced", description: "Tools to mitigate simulated noise." },
  { id: "quantum-chemistry-gui", title: "Quantum Chemistry Simulation App", difficulty: "Advanced", description: "Visualize simple molecular simulations." },
  { id: "quantum-ml-demos", title: "Quantum Machine Learning Demos", difficulty: "Advanced", description: "Small QML examples and experiments." },
  { id: "multi-backend-runner", title: "Multi-backend Experiment Runner", difficulty: "Advanced", description: "Run experiments across different backends." },
];

const ProjectPanel: React.FC = () => {
  const [selected, setSelected] = useState<ProjectIdea | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const activePanel = useSelector(selectActivePanel)

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

  const groupedIdeas: Record<string, ProjectIdea[]> = {
    Beginner: PROJECT_IDEAS.filter((i) => i.difficulty === "Beginner"),
    Intermediate: PROJECT_IDEAS.filter((i) => i.difficulty === "Intermediate"),
    Advanced: PROJECT_IDEAS.filter((i) => i.difficulty === "Advanced"),
  };

  const gridCols = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  useEffect(() => {
    // open or close modal based on activePanel in the UI state
    setIsOpen(activePanel === 'projects')
    if (activePanel !== 'projects') {
      setSelected(null)
    }
  }, [activePanel]);

  const openGallery = (idea?: ProjectIdea) => {
    if (idea) setSelected(idea);
    setIsOpen(true);
  };

  const dispatch = useDispatch()

  const closeGallery = () => {
    // return to main circuit view when modal closes
    dispatch(setActivePanel('circuit'))
    setIsOpen(false);
    setSelected(null);
  };

  return (
    <>
      {/* Modal Gallery only - no intermediate page content */}
      <Modal isOpen={isOpen} onClose={closeGallery} size={useBreakpointValue({ base: 'full', md: '6xl' })} scrollBehavior="inside" isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(3px)" />
        <ModalContent maxH="90vh">
          <ModalHeader bg={useColorModeValue('blue.50', 'blue.900')} borderTopRadius="md">
            <HStack justify="space-between" w="100%">
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold">Project Ideas</Text>
                <Text fontSize="sm" color={textColor}>Browse grouped project ideas and placeholders</Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={6}>
            <Stack spacing={6}>
              {Object.entries(groupedIdeas).map(([difficulty, ideas]) => (
                <Box key={difficulty}>
                  <HStack justify="space-between" mb={4}>
                    <HStack spacing={3}>
                      <Badge colorScheme={getDifficultyColor(difficulty)} fontSize="sm">{difficulty}</Badge>
                      <Text fontWeight="600">{ideas.length} ideas</Text>
                    </HStack>
                  </HStack>

                  <SimpleGrid columns={gridCols} spacing={4}>
                    {ideas.map((idea) => (
                      <Card key={idea.id} borderRadius="md" overflow="hidden" _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }} transition="all 0.15s">
                        <CardHeader p={0}>
                          <Image alt={`${idea.title} placeholder`} src={"/placeholder-image.png"} fallbackSrc={"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'>Image</text></svg>"} objectFit="cover" w="100%" h="120px" />
                        </CardHeader>
                        <CardBody>
                          <HStack justify="space-between" align="start">
                            <Box>
                              <Text fontWeight="600" mb={1}>{idea.title}</Text>
                              <Text fontSize="sm" color={textColor}>{idea.description ?? 'Short description placeholder.'}</Text>
                            </Box>
                            <Tag size="sm" colorScheme={getDifficultyColor(idea.difficulty)}>{idea.difficulty}</Tag>
                          </HStack>
                          <HStack mt={4} spacing={2} justify="flex-end">
                            <Button size="sm" variant="outline" onClick={() => { setSelected(idea); }}>Select</Button>
                            <Button size="sm" colorScheme="blue" onClick={() => { /* placeholder action */ }}>Open</Button>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
</>
  )}
export default ProjectPanel;
