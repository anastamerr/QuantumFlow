import React, { lazy, Suspense, useState } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Spinner,
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Select,
  FormControl,
  FormLabel,
  Button,
  ButtonGroup,
  HStack,
  useColorModeValue,
  Badge,
  Icon,
  Tooltip,
  VStack,
  Divider
} from '@chakra-ui/react';
import { InfoIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { 
  Complex, 
  BlochCoordinates, 
  extractQubitAmplitudes, 
  calculateQubitProbabilities 
} from '../../utils/blochSphereUtils';

const BlochSphereVisualization = lazy(() => import('./BlochSphereVisualizer'));

interface QubitVisualizationProps {
  // The state vector as an object with basis states as keys and complex amplitudes as [real, imag] arrays
  stateVector: Record<string, [number, number]>;
  // Number of qubits in the system
  numQubits: number;
  // Optional title
  title?: string;
}

/**
 * Component that provides different visualizations for qubit states
 */
const QubitVisualization: React.FC<QubitVisualizationProps> = ({
  stateVector,
  numQubits,
  title = 'Qubit Visualization'
}) => {
  const [selectedQubit, setSelectedQubit] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Theme colors
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const accentColor = useColorModeValue('blue.600', 'blue.200');
  const selectorBg = useColorModeValue('gray.50', 'gray.700');
  const selectorHoverBorder = useColorModeValue('blue.400', 'blue.300');
  
  // Handle qubit selection change
  const handleQubitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQubit(parseInt(e.target.value, 10));
  };
  
  // Generate qubit options
  const qubitOptions = Array.from({ length: numQubits }, (_, i) => ({
    value: i,
    label: `Qubit ${i}`
  }));
  
  // Make sure we have a valid state vector
  const validStateVector: Record<string, [number, number]> = {...stateVector};
  
  // If empty, provide a default state
  if (Object.keys(validStateVector).length === 0) {
    // Default to |0...0⟩ state
    validStateVector['0'.repeat(numQubits)] = [1, 0];
  }
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={borderColor} 
      p={4}
      width="100%"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      bg={cardBg}
    >
      <Flex direction="column" gap={4}>
        <Flex justify="space-between" align="center">
          <Heading size="md" color={headingColor} fontWeight="600">{title}</Heading>
          
          {numQubits > 1 && (
            <FormControl width="auto">
              <Select 
                value={selectedQubit} 
                onChange={handleQubitChange}
                size="sm"
                width="140px"
                borderRadius="full"
                bg={selectorBg}
                _hover={{ 
                  borderColor: selectorHoverBorder,
                  boxShadow: "sm"
                }}
                icon={<ChevronDownIcon color="blue.400" />}
              >
                {qubitOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Text fontSize="xs" color="gray.500" ml={2} mt={1}>
                Select a qubit to visualize
              </Text>
            </FormControl>
          )}
        </Flex>
        
        <Tabs 
          variant="soft-rounded" 
          colorScheme="blue" 
          index={activeTab} 
          onChange={setActiveTab}
          isLazy
        >
          <TabList>
            <Tab 
              _selected={{ 
                color: "white", 
                bg: "blue.500",
                boxShadow: "md" 
              }}
              fontWeight="medium"
            >
              Bloch Sphere
            </Tab>
            <Tab 
              _selected={{ 
                color: "white", 
                bg: "blue.500",
                boxShadow: "md" 
              }}
              fontWeight="medium"
            >
              Probability
            </Tab>
            <Tab 
              _selected={{ 
                color: "white", 
                bg: "blue.500",
                boxShadow: "md" 
              }}
              fontWeight="medium"
            >
              Phase
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Suspense
                fallback={
                  <Flex justify="center" p={4}>
                    <Spinner size="lg" />
                  </Flex>
                }
              >
                <Flex justify="center" p={4}>
                  <BlochSphereVisualization 
                    stateVector={validStateVector}
                    qubitIndex={selectedQubit}
                    width={350}
                    height={350}
                    title={`Bloch Sphere - Qubit ${selectedQubit}`}
                  />
                </Flex>
              </Suspense>
              
              {/* Add a helpful explanation */}
              <Box 
                bg={accentBg} 
                p={3} 
                borderRadius="md" 
                mt={2}
                boxShadow="sm"
              >
                <Flex alignItems="center" mb={2}>
                  <Icon as={InfoIcon} color={accentColor} mr={2} />
                  <Text fontWeight="medium" color={accentColor}>What is the Bloch sphere?</Text>
                </Flex>
                <Text fontSize="sm">
                  The Bloch sphere is a geometric representation of a single-qubit quantum state.
                  The north pole corresponds to |0⟩, the south pole to |1⟩, and superposition states lie on the sphere's surface.
                  X, Y, and Z axes represent the Pauli operators.
                </Text>
              </Box>
            </TabPanel>
            
            <TabPanel>
              <ProbabilityVisualization 
                stateVector={validStateVector} 
                qubitIndex={selectedQubit} 
              />
            </TabPanel>
            
            <TabPanel>
              <PhaseVisualization 
                stateVector={validStateVector} 
                qubitIndex={selectedQubit} 
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Modern button group for tab navigation */}
        <HStack mt={1} spacing={2} justify="center">
          <ButtonGroup isAttached variant="outline" size="sm" borderRadius="md" overflow="hidden">
            <Button 
              colorScheme={activeTab === 0 ? "blue" : undefined}
              onClick={() => setActiveTab(0)}
              bg={activeTab === 0 ? "blue.500" : undefined}
              color={activeTab === 0 ? "white" : undefined}
              borderLeftRadius="md"
              borderRightRadius={0}
              fontWeight="medium"
            >
              Bloch
            </Button>
            <Button 
              colorScheme={activeTab === 1 ? "blue" : undefined}
              onClick={() => setActiveTab(1)}
              bg={activeTab === 1 ? "blue.500" : undefined}
              color={activeTab === 1 ? "white" : undefined}
              borderRadius={0}
              fontWeight="medium"
            >
              Probability
            </Button>
            <Button 
              colorScheme={activeTab === 2 ? "blue" : undefined}
              onClick={() => setActiveTab(2)}
              bg={activeTab === 2 ? "blue.500" : undefined}
              color={activeTab === 2 ? "white" : undefined}
              borderLeftRadius={0}
              borderRightRadius="md"
              fontWeight="medium"
            >
              Phase
            </Button>
          </ButtonGroup>
        </HStack>
      </Flex>
    </Box>
  );
};

// Component to visualize qubit probabilities
const ProbabilityVisualization: React.FC<{
  stateVector: Record<string, [number, number]>;
  qubitIndex: number;
}> = ({ stateVector, qubitIndex }) => {
  // Calculate probabilities for |0⟩ and |1⟩ states using the utility
  const probabilities = calculateQubitProbabilities(stateVector, qubitIndex);
  
  // Make sure we have valid probabilities
  const prob0 = isNaN(probabilities[0]) ? 1 : probabilities[0];
  const prob1 = isNaN(probabilities[1]) ? 0 : probabilities[1];
  
  const barBg = useColorModeValue('blue.50', 'blue.900');
  const barFill = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.900');
  const accentBg = useColorModeValue('gray.50', 'gray.800');
  
  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="sm" mb={3}>Qubit {qubitIndex} Measurement Probabilities</Heading>
          <Badge colorScheme="blue" fontSize="sm" borderRadius="full" px={3} py={1}>
            {prob0 > 0.99 ? "Pure |0⟩" : prob1 > 0.99 ? "Pure |1⟩" : "Superposition"}
          </Badge>
        </Flex>
        
        <Divider />
        
        {/* |0⟩ Probability */}
        <Box 
          bg={cardBg} 
          p={4} 
          borderRadius="lg" 
          boxShadow="sm" 
          borderWidth={1} 
          borderColor="blue.100"
        >
          <Text mb={1} fontWeight="medium" fontSize="lg">|0⟩ state</Text>
          <Flex 
            justify="space-between" 
            mb={2} 
            fontSize="sm" 
            color="gray.500"
          >
            <Text>0%</Text>
            <Text>50%</Text>
            <Text>100%</Text>
          </Flex>
          <Box 
            width="100%" 
            height="40px" 
            bg={barBg} 
            borderRadius="full" 
            overflow="hidden"
            position="relative"
          >
            <Box 
              bg="linear-gradient(90deg, #3182CE 0%, #63B3ED 100%)"
              height="100%" 
              width={`${prob0 * 100}%`} 
              transition="width 0.5s ease-in-out"
              borderRadius="full"
              position="relative"
            />
            <Text 
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontWeight="bold"
              fontSize="lg"
              textShadow="0px 0px 3px rgba(0,0,0,0.3)"
              color="white"
            >
              {(prob0 * 100).toFixed(1)}%
            </Text>
          </Box>
        </Box>
        
        {/* |1⟩ Probability */}
        <Box 
          bg={cardBg} 
          p={4} 
          borderRadius="lg" 
          boxShadow="sm"
          borderWidth={1} 
          borderColor="purple.100"
        >
          <Text mb={1} fontWeight="medium" fontSize="lg">|1⟩ state</Text>
          <Flex 
            justify="space-between" 
            mb={2} 
            fontSize="sm" 
            color="gray.500"
          >
            <Text>0%</Text>
            <Text>50%</Text>
            <Text>100%</Text>
          </Flex>
          <Box 
            width="100%" 
            height="40px" 
            bg={barBg} 
            borderRadius="full" 
            overflow="hidden"
            position="relative"
          >
            <Box 
              bg="linear-gradient(90deg, #805AD5 0%, #B794F4 100%)"
              height="100%" 
              width={`${prob1 * 100}%`} 
              transition="width 0.5s ease-in-out"
              borderRadius="full"
            />
            <Text 
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fontWeight="bold"
              fontSize="lg"
              textShadow="0px 0px 3px rgba(0,0,0,0.3)"
              color="white"
            >
              {(prob1 * 100).toFixed(1)}%
            </Text>
          </Box>
        </Box>
        
        <Box 
          mt={2} 
          p={4} 
          borderRadius="md" 
          bg={accentBg}
          borderLeftWidth="4px"
          borderLeftColor="blue.400"
        >
          <Flex>
            <Icon as={InfoIcon} mt={1} color="blue.500" mr={2} />
            <Text fontSize="sm" color={textColor}>
              These probabilities represent the likelihood of measuring the qubit in either 
              the |0⟩ or |1⟩ state. In quantum mechanics, a measurement causes the quantum 
              state to collapse to one of these basis states according to these probabilities.
            </Text>
          </Flex>
        </Box>
      </VStack>
    </Box>
  );
};

// Component to visualize qubit phase
const PhaseVisualization: React.FC<{
  stateVector: Record<string, [number, number]>;
  qubitIndex: number;
}> = ({ stateVector, qubitIndex }) => {
  // Extract amplitudes and phases using the utility
  const { alpha, beta } = extractQubitAmplitudes(stateVector, qubitIndex);
  
  // Calculate phases in degrees
  let alphaPhase = Math.atan2(alpha[1], alpha[0]) * (180 / Math.PI);
  let betaPhase = Math.atan2(beta[1], beta[0]) * (180 / Math.PI);
  
  // Normalize phases to [0, 360)
  if (alphaPhase < 0) alphaPhase += 360;
  if (betaPhase < 0) betaPhase += 360;
  
  // Handle NaN phases
  if (isNaN(alphaPhase)) alphaPhase = 0;
  if (isNaN(betaPhase)) betaPhase = 0;
  
  // Calculate relative phase
  let relativePhase = betaPhase - alphaPhase;
  if (relativePhase < 0) relativePhase += 360;
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  // Calculate alpha and beta magnitudes (probability amplitudes)
  const alphaMagnitude = Math.sqrt(alpha[0] * alpha[0] + alpha[1] * alpha[1]);
  const betaMagnitude = Math.sqrt(beta[0] * beta[0] + beta[1] * beta[1]);
  
  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <Heading size="sm" mb={2}>Qubit {qubitIndex} Phase Information</Heading>
        <Text fontSize="sm" color="gray.500" mt={-2}>
          The phase of a qubit determines its position around the equator of the Bloch sphere
        </Text>
        
        <Divider />
        
        {/* Visual representation */}
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          {/* State vector notation */}
          <Box
            flex={1}
            p={4}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="md"
          >
            <Text fontWeight="medium" mb={3}>State Vector Notation</Text>
            <Box 
              p={3} 
              bg={useColorModeValue('gray.50', 'gray.800')} 
              borderRadius="md"
              fontFamily="monospace"
              fontSize="md"
              mb={3}
            >
              <Text mb={1}>|ψ⟩ = α|0⟩ + β|1⟩</Text>
              <Divider my={2} />
              <HStack align="start" spacing={1}>
                <Text>α =</Text>
                <Box>
                  <Text>{alphaMagnitude.toFixed(3)}e<sup>{alphaPhase.toFixed(1)}°i</sup></Text>
                  <Text>= {alpha[0].toFixed(3)} {alpha[1] >= 0 ? "+" : ""}{alpha[1].toFixed(3)}i</Text>
                </Box>
              </HStack>
              <HStack align="start" spacing={1} mt={1}>
                <Text>β =</Text>
                <Box>
                  <Text>{betaMagnitude.toFixed(3)}e<sup>{betaPhase.toFixed(1)}°i</sup></Text>
                  <Text>= {beta[0].toFixed(3)} {beta[1] >= 0 ? "+" : ""}{beta[1].toFixed(3)}i</Text>
                </Box>
              </HStack>
            </Box>
          </Box>
          
          {/* Phase gauges */}
          <Box
            flex={1}
            p={4}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="md"
          >
            <Text fontWeight="medium" mb={3}>Relative Phase: {relativePhase.toFixed(1)}°</Text>
            
            <Box mb={4}>
              <Flex justify="space-between">
                <Text fontSize="sm">0°</Text>
                <Text fontSize="sm">180°</Text>
                <Text fontSize="sm">360°</Text>
              </Flex>
              <Box
                h="10px"
                w="100%"
                bg={useColorModeValue('gray.200', 'gray.700')}
                borderRadius="full"
                mt={1}
                mb={1}
                position="relative"
              >
                <Box
                  position="absolute"
                  h="10px"
                  w="10px"
                  borderRadius="full"
                  bg={accentColor}
                  left={`${(relativePhase / 360) * 100}%`}
                  transform="translateX(-50%)"
                  boxShadow="0 0 0 3px rgba(66, 153, 225, 0.3)"
                />
              </Box>
              <Flex justify="space-between" fontSize="xs" color="gray.500">
                <Text>+X axis</Text>
                <Text>-X axis</Text>
                <Text>+X axis</Text>
              </Flex>
            </Box>
            
            <Box 
              p={3} 
              borderRadius="md" 
              borderLeftWidth="4px" 
              borderLeftColor="purple.400"
              bg={useColorModeValue('purple.50', 'purple.900')}
              mt={4}
            >
              <Text fontSize="sm">
                The relative phase determines the qubit's position around the Bloch sphere's equator.
                A phase of 0° places it on the +X axis, 90° on the +Y axis, 180° on -X, and 270° on -Y.
              </Text>
            </Box>
          </Box>
        </Flex>
        
        <Divider />
        
        <Flex 
          p={4} 
          borderRadius="lg" 
          borderWidth="1px" 
          borderColor={borderColor} 
          bg={bgColor}
          boxShadow="sm"
          justify="space-between"
          direction={{ base: 'column', md: 'row' }}
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">Phase of |0⟩ Component:</Text>
            <Text fontSize="xl" fontFamily="monospace" color={accentColor}>
              {alphaPhase.toFixed(1)}°
            </Text>
          </VStack>
          
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">Phase of |1⟩ Component:</Text>
            <Text fontSize="xl" fontFamily="monospace" color={accentColor}>
              {betaPhase.toFixed(1)}°
            </Text>
          </VStack>
          
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">Relative Phase:</Text>
            <Text fontSize="xl" fontFamily="monospace" color={accentColor}>
              {relativePhase.toFixed(1)}°
            </Text>
          </VStack>
        </Flex>
      </VStack>
    </Box>
  );
};

export default QubitVisualization;
