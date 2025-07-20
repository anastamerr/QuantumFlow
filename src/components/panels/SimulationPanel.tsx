import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Spinner, 
  useColorModeValue, 
  Select, 
  FormControl, 
  FormLabel, 
  useToast, 
  Flex, 
  Tab, 
  TabList, 
  TabPanel, 
  TabPanels, 
  Tabs, 
  Switch, 
  Slider, 
  SliderTrack, 
  SliderFilledTrack, 
  SliderThumb, 
  Divider,
  Badge,
  Icon,
  Grid,
  GridItem,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Progress,
  Stack,
  Tag,
  useBreakpointValue
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { selectQubits, selectGates } from '../../store/slices/circuitSlice';
import { useState, useCallback, useEffect, useRef } from 'react';
import QuantumStateVisualizer from '../visualization/QuantumStateVisualizer';
import QubitVisualization from '../visualization/QubitVisualizer';
import BlochSphereVisualization from '../visualization/BlochSphereVisualizer';
import { simulateCircuit } from '../../utils/stateEvolution';
import { transformStoreGatesToCircuitGates } from '../../utils/circuitUtils';
import { stateVectorToBloch } from '../../utils/blochSphereUtils';
import { InfoIcon, RepeatIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons';

const SimulationPanel = () => {
  const qubits = useSelector(selectQubits);
  const storeGates = useSelector(selectGates);
  const toast = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<number>(1024);
  const [method, setMethod] = useState<string>('statevector');
  const [showRealTimeVisualization, setShowRealTimeVisualization] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [simulationComplete, setSimulationComplete] = useState<boolean>(false);
  
  // Store visualization instance reference
  const visualizerRef = useRef<any>(null);
  
  // Transform store gates to circuit gates for visualization
  const gates = transformStoreGatesToCircuitGates(storeGates);
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const barBg = useColorModeValue('gray.100', 'gray.700');
  const successColor = useColorModeValue('blue.500', 'blue.300');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const accentColor = useColorModeValue('blue.600', 'blue.300');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningColor = useColorModeValue('orange.600', 'orange.300');
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const tabSize = useBreakpointValue({ base: "sm", md: "md" });
  
  // Reset simulation results when circuit changes
  useEffect(() => {
    if (results !== null || simulationComplete) {
      setResults(null);
      setSimulationComplete(false);
      setActiveTab(0); // Reset to simulation tab when circuit changes
    }
  }, [qubits, storeGates]);
  
  // Check if circuit has a Hadamard gate (creates superposition)
  const hasHadamard = gates.some(gate => gate.type === 'h');
  const hasEntanglement = gates.some(gate => 
    gate.type === 'cnot' || gate.type === 'cz' || gate.type === 'swap' || gate.type === 'toffoli'
  );
  
  // Get gate counts for analysis
  const getGateStats = useCallback(() => {
    const stats: Record<string, number> = {};
    
    gates.forEach(gate => {
      const type = gate.type;
      stats[type] = (stats[type] || 0) + 1;
    });
    
    return stats;
  }, [gates]);
  
  // Function to run the simulation
  const runSimulation = async () => {
    // Reset state
    setIsSimulating(true);
    setSimulationComplete(false);
    setResults(null);
    setError(null);
    
    try {
      // Validate circuit first
      if (gates.length === 0) {
        throw new Error('Cannot simulate an empty circuit. Add gates to the circuit first.');
      }
      
      // If real-time visualization is not enabled, perform the full simulation immediately
      if (!showRealTimeVisualization) {
        // In a real implementation, this would call a quantum simulator API
        // For now, we'll simulate a simple result based on the circuit
        
        // Simulate API call delay (longer for more complex circuits)
        const complexity = Math.min(500 + (gates.length * 100), 3000);
        await new Promise(resolve => setTimeout(resolve, complexity));
        
        // Use our local simulator or API call
        try {
          // Use the stateEvolution utility to simulate the circuit
          const simulationResults = simulateCircuit(gates, qubits.length);
          setResults(simulationResults);
          setSimulationComplete(true);
          
          // Automatically switch to results tab
          setActiveTab(1);
        } catch (err) {
          console.error('Simulation calculation error:', err);
          throw new Error('An error occurred during quantum simulation calculations.');
        }
      } else {
        // With real-time visualization, the QuantumStateVisualizer component will handle the simulation
        // Just set isSimulating to true to trigger the visualization
        // We'll stay on the simulation tab
      }
      
      // Log simulation details to help with debugging
      console.log('Circuit simulation:', {
        method,
        shots,
        qubits: qubits.length,
        gates: gates.length,
        hasHadamard,
        hasEntanglement,
        gateStats: getGateStats()
      });
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during simulation.');
      setIsSimulating(false); // Make sure we're not stuck in simulating state
    }
  };
  
  // Handle completion of the real-time visualization
  const handleVisualizationComplete = useCallback((finalResults: Record<string, number>) => {
    console.log("Simulation completed with results:", finalResults);
    
    setResults(finalResults);
    setIsSimulating(false);
    setSimulationComplete(true);
    
    // Auto-switch to Results tab when complete if auto-play was on
    if (autoPlay) {
      setTimeout(() => setActiveTab(1), 500);
    }
    
    // Show success toast
    toast({
      title: "Simulation complete",
      description: "You can now explore the results and analysis",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top-right"
    });
  }, [autoPlay, toast]);
  
  // Make sure tabs are enabled after simulation completes
  useEffect(() => {
    if (simulationComplete && results) {
      // Make sure the tabs are enabled
      console.log("Simulation is complete, enabling tabs");
    }
  }, [simulationComplete, results]);
  
  // Render the results as a bar chart
  const renderResultsChart = () => {
    if (!results) return null;
    
    // Sort results by count (descending)
    const sortedResults = Object.entries(results)
      .filter(([_, count]) => count > 0.001) // Only show non-zero results
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedResults.length === 0) return <Text>No significant measurement results.</Text>;
    
    const maxValue = Math.max(...sortedResults.map(([_, count]) => count));
    const maxResults = isMobile ? 6 : 10; // Show fewer results on mobile
    const displayResults = sortedResults.slice(0, maxResults);
    const hiddenResults = sortedResults.length - displayResults.length;
    
    return (
      <VStack spacing={3} align="stretch" mt={4}>
        {displayResults.map(([state, prob]) => {
          const percentage = prob * 100;
          const count = Math.round(shots * prob);
          
          return (
            <Box key={state} mb={2}>
              <Flex justify="space-between" align="center" mb={1}>
                <HStack>
                  <Text 
                    fontSize="md" 
                    fontWeight="medium" 
                    fontFamily="monospace"
                    bg={useColorModeValue("gray.100", "gray.700")} 
                    px={2} 
                    py={1} 
                    borderRadius="md"
                  >
                    |{state}⟩
                  </Text>
                  {prob > 0.2 && <StarIcon color="yellow.400" />}
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {count} shots ({percentage.toFixed(1)}%)
                </Text>
              </Flex>
              <Box
                h="24px" 
                bg={barBg}
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  h="100%" 
                  bg={`linear-gradient(90deg, ${useColorModeValue('#3182CE', '#63B3ED')} 0%, ${useColorModeValue('#805AD5', '#B794F4')} 100%)`}
                  w={`${(prob / maxValue) * 100}%`}
                  transition="width 0.3s ease-in-out"
                  borderRadius="full"
                />
              </Box>
            </Box>
          );
        })}
        
        {hiddenResults > 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            {hiddenResults} more results not shown
          </Text>
        )}
      </VStack>
    );
  };
  
  // Function to get visualizer state for test/debug
  const getVisualizer = (instance: any) => {
    visualizerRef.current = instance;
  };
  
  // Manual switch to results tab
  const goToResults = () => {
    setActiveTab(1);
  };
  
  // Manual switch to analysis tab
  const goToAnalysis = () => {
    setActiveTab(2);
  };
  
  // Calculate circuit depth - safely handle undefined positions
  const calculateCircuitDepth = () => {
    if (gates.length === 0) return 0;
    // Filter out undefined positions and ensure we have valid numbers
    const validPositions = gates
      .map(g => g.position)
      .filter(p => p !== undefined && p !== null && !isNaN(p)) as number[];
    
    if (validPositions.length === 0) return 1; // If no valid positions, depth is 1
    return Math.max(...validPositions) + 1;
  };
  
  return (
    <Box>
      <Card mb={4} borderRadius="lg" boxShadow="sm" bg={cardBg}>
        <CardHeader pb={0}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            <HStack>
              <Heading size="md">Quantum Simulation</Heading>
              {simulationComplete && (
                <Badge colorScheme="green" variant="solid" borderRadius="full" px={2}>
                  Complete
                </Badge>
              )}
            </HStack>
            
            <Button 
              colorScheme="blue" 
              onClick={runSimulation} 
              isLoading={isSimulating}
              loadingText="Simulating"
              isDisabled={gates.length === 0}
              rightIcon={<ChevronRightIcon />}
              boxShadow="sm"
            >
              Run Simulation
            </Button>
          </Flex>
        </CardHeader>
        
        <CardBody>
          {/* Simulation options */}
          <Box 
            mb={4} 
            p={4} 
            borderRadius="lg" 
            bg={accentBg}
            border="1px solid"
            borderColor={useColorModeValue('blue.200', 'blue.700')}
          >
            <Grid 
              templateColumns={isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))"}
              gap={4}
            >
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Simulation Method</FormLabel>
                  <Select 
                    size="sm" 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)}
                    isDisabled={isSimulating}
                    borderRadius="md"
                    bg={useColorModeValue('white', 'gray.700')}
                    boxShadow="sm"
                  >
                    <option value="statevector">State Vector</option>
                    <option value="noisy">Noisy Simulator</option>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Number of Shots</FormLabel>
                  <Select 
                    size="sm" 
                    value={shots.toString()} 
                    onChange={(e) => setShots(parseInt(e.target.value))}
                    isDisabled={isSimulating}
                    borderRadius="md"
                    bg={useColorModeValue('white', 'gray.700')}
                    boxShadow="sm"
                  >
                    <option value="100">100</option>
                    <option value="1024">1024</option>
                    <option value="5000">5000</option>
                    <option value="10000">10000</option>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl display="flex" flexDirection="column">
                  <FormLabel htmlFor="real-time-viz" mb="0" fontSize="sm" fontWeight="medium">
                    Real-time Visualization
                  </FormLabel>
                  <Switch 
                    id="real-time-viz" 
                    isChecked={showRealTimeVisualization} 
                    onChange={(e) => setShowRealTimeVisualization(e.target.checked)}
                    colorScheme="blue"
                    isDisabled={isSimulating}
                    mb={2}
                    size="md"
                  />
                  
                  {showRealTimeVisualization && (
                    <>
                      <FormControl display="flex" alignItems="center" mt={2}>
                        <FormLabel htmlFor="auto-play" mb="0" fontSize="xs">
                          Auto-Play
                        </FormLabel>
                        <Switch 
                          id="auto-play" 
                          isChecked={autoPlay} 
                          onChange={(e) => setAutoPlay(e.target.checked)}
                          colorScheme="green"
                          size="sm"
                          isDisabled={isSimulating}
                        />
                      </FormControl>
                      
                      <FormControl mt={2}>
                        <FormLabel fontSize="xs" mb={1}>Playback Speed</FormLabel>
                        <Flex align="center">
                          <Text fontSize="xs" mr={2}>Slow</Text>
                          <Slider
                            aria-label="playback-speed"
                            min={0.2}
                            max={3}
                            step={0.2}
                            value={playbackSpeed}
                            onChange={setPlaybackSpeed}
                            isDisabled={isSimulating}
                            size="sm"
                            w="100px"
                            colorScheme="blue"
                          >
                            <SliderTrack>
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb boxShadow="md" />
                          </Slider>
                          <Text fontSize="xs" ml={2}>Fast</Text>
                          <Text fontSize="xs" fontWeight="bold" ml={3}>{playbackSpeed.toFixed(1)}x</Text>
                        </Flex>
                      </FormControl>
                    </>
                  )}
                </FormControl>
              </GridItem>
            </Grid>
            
            {gates.length === 0 && (
              <Box mt={4} p={3} borderRadius="md" bg={warningBg}>
                <Flex align="center">
                  <Icon as={InfoIcon} color={warningColor} mr={2} />
                  <Text color={warningColor} fontSize="sm">
                    Your circuit is empty. Add gates from the sidebar to enable simulation.
                  </Text>
                </Flex>
              </Box>
            )}
          </Box>
          
          {/* Tabbed interface for visualization and results */}
          <Tabs 
            variant="soft-rounded" 
            colorScheme="blue" 
            index={activeTab} 
            onChange={(index) => setActiveTab(index)}
            isLazy
            size={tabSize}
          >
            <TabList overflowX="auto" overflowY="hidden" py={2}>
              <Tab 
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Simulation
              </Tab>
              <Tab 
                isDisabled={!simulationComplete || !results}
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Results
              </Tab>
              <Tab 
                isDisabled={!simulationComplete || !results}
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Analysis
              </Tab>
              <Tab 
                isDisabled={!simulationComplete || !results}
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Bloch Sphere
              </Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  {isSimulating && showRealTimeVisualization ? (
                    <CardBody>
                      <VStack spacing={4}>
                        <QuantumStateVisualizer 
                          key={`sim-${gates.length}-${qubits.length}`} // Force re-mount when circuit changes
                          qubits={qubits}
                          gates={gates}
                          isRunning={isSimulating}
                          onComplete={handleVisualizationComplete}
                          playbackSpeed={playbackSpeed}
                          autoPlay={autoPlay}
                          ref={getVisualizer}
                        />
                      </VStack>
                    </CardBody>
                  ) : isSimulating ? (
                    <CardBody>
                      <VStack spacing={4} justify="center" h="300px">
                        <Spinner size="xl" thickness="4px" color="blue.500" />
                        <Text fontWeight="medium">Running quantum simulation...</Text>
                        <HStack>
                          <Progress 
                            size="sm" 
                            isIndeterminate 
                            width="200px" 
                            colorScheme="blue" 
                            borderRadius="full" 
                          />
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          Simulating circuit with {gates.length} gates on {qubits.length} qubits
                        </Text>
                      </VStack>
                    </CardBody>
                  ) : error ? (
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Flex 
                          p={4} 
                          bg={useColorModeValue('red.50', 'red.900')} 
                          color={useColorModeValue('red.600', 'red.200')}
                          borderRadius="md"
                          align="center"
                        >
                          <Icon as={InfoIcon} mr={2} />
                          <Text fontWeight="medium">Error:</Text>
                        </Flex>
                        <Text color={useColorModeValue('red.600', 'red.200')}>{error}</Text>
                        <Box mt={2} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                          <Text fontSize="sm">Try simplifying your circuit or checking for invalid gate configurations.</Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  ) : simulationComplete && results ? (
                    <CardBody>
                      <VStack spacing={4}>
                        <QuantumStateVisualizer 
                          key={`complete-${gates.length}-${qubits.length}`} // Force re-mount when circuit changes
                          qubits={qubits}
                          gates={gates}
                          isRunning={false}
                          onComplete={handleVisualizationComplete}
                          playbackSpeed={playbackSpeed}
                          autoPlay={false}
                          ref={getVisualizer}
                        />
                        
                        <HStack mt={4} spacing={4}>
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            onClick={goToResults}
                            leftIcon={<ChevronRightIcon />}
                            boxShadow="sm"
                          >
                            View Results
                          </Button>
                          <Button 
                            size="sm" 
                            colorScheme="purple" 
                            onClick={goToAnalysis}
                            leftIcon={<ChevronRightIcon />}
                            boxShadow="sm"
                          >
                            View Analysis
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  ) : (
                    <CardBody>
                      <VStack spacing={4} align="stretch" justify="center" h="300px">
                        <Icon as={InfoIcon} fontSize="5xl" color="blue.400" alignSelf="center" />
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Click "Run Simulation" to see the step-by-step evolution of your quantum circuit.
                        </Text>
                        {gates.length === 0 ? (
                          <Box p={3} borderRadius="md" bg={warningBg}>
                            <Text fontSize="sm" color={warningColor} textAlign="center" fontWeight="medium">
                              Add gates to your circuit first
                            </Text>
                          </Box>
                        ) : (
                          <Box p={3} borderRadius="md" bg={accentBg}>
                            <Text fontSize="sm" color={accentColor} textAlign="center">
                              Your circuit has {gates.length} gates on {qubits.length} qubits
                            </Text>
                          </Box>
                        )}
                        <Button 
                          alignSelf="center" 
                          mt={2} 
                          colorScheme="blue" 
                          onClick={runSimulation}
                          isDisabled={gates.length === 0}
                          leftIcon={<RepeatIcon />}
                          size="md"
                          boxShadow="md"
                        >
                          Run Simulation
                        </Button>
                      </VStack>
                    </CardBody>
                  )}
                </Card>
              </TabPanel>
              
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <CardBody>
                    {!simulationComplete || !results ? (
                      <VStack spacing={4} justify="center" h="300px">
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Run the simulation to see measurement results.
                        </Text>
                      </VStack>
                    ) : (
                      <Box>
                        <Flex 
                          justify="space-between" 
                          mb={4} 
                          align="center" 
                          pb={3} 
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Heading size="md">Measurement Results</Heading>
                          <Flex align="center">
                            <Badge 
                              colorScheme="blue" 
                              variant="solid" 
                              borderRadius="full" 
                              px={3} 
                              py={1}
                              boxShadow="sm"
                            >
                              {shots} shots
                            </Badge>
                            <Text fontSize="sm" color="gray.500" ml={2}>
                              {method === 'statevector' ? 'State Vector' : 'Noisy Simulator'}
                            </Text>
                          </Flex>
                        </Flex>
                        
                        {renderResultsChart()}
                        
                        <Box mt={6} p={3} borderRadius="md" bg={accentBg}>
                          <Flex align="center">
                            <Icon as={InfoIcon} color={accentColor} mr={2} />
                            <Text fontSize="sm" color={accentColor}>
                              These results show the probability distribution of measuring each possible state.
                              In a real quantum computer, each shot produces a single measurement result according to these probabilities.
                            </Text>
                          </Flex>
                        </Box>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
              
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <CardBody>
                    {!simulationComplete || !results ? (
                      <VStack spacing={4} align="stretch" justify="center" h="300px">
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Run the simulation to see circuit analysis.
                        </Text>
                      </VStack>
                    ) : (
                      <Box mt={2}>
                        <Heading size="md" mb={4}>Circuit Analysis</Heading>
                        <Grid 
                          templateColumns={isMobile ? "1fr" : "repeat(3, 1fr)"}
                          gap={4}
                          mb={6}
                        >
                          <Card borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="xs" color={accentColor} textTransform="uppercase" fontWeight="bold">
                                Circuit Type
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              <Text fontSize="xl" fontWeight="bold">
                                {hasEntanglement 
                                  ? 'Entangled'
                                  : hasHadamard
                                    ? 'Superposition'
                                    : 'Classical'
                                }
                              </Text>
                              <Tag 
                                size="sm" 
                                colorScheme={hasEntanglement ? "purple" : hasHadamard ? "blue" : "gray"}
                                mt={1}
                                borderRadius="full"
                              >
                                {hasEntanglement ? "Quantum Correlation" : hasHadamard ? "Quantum" : "Deterministic"}
                              </Tag>
                            </CardBody>
                          </Card>
                          
                          <Card borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="xs" color={accentColor} textTransform="uppercase" fontWeight="bold">
                                Circuit Size
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                                <Box>
                                  <Text fontSize="xs" color="gray.500">QUBITS</Text>
                                  <Text fontSize="xl" fontWeight="bold">{qubits.length}</Text>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="gray.500">GATES</Text>
                                  <Text fontSize="xl" fontWeight="bold">{gates.length}</Text>
                                </Box>
                              </Stack>
                            </CardBody>
                          </Card>
                          
                          <Card borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="xs" color={accentColor} textTransform="uppercase" fontWeight="bold">
                                Circuit Depth
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              <Text fontSize="xl" fontWeight="bold">
                                {calculateCircuitDepth()}
                              </Text>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Maximum number of time steps
                              </Text>
                            </CardBody>
                          </Card>
                        </Grid>
                        
                        <Card mt={4} borderRadius="md" overflow="hidden" variant="outline">
                          <CardHeader bg={accentBg} py={2} px={4}>
                            <Text fontSize="sm" color={accentColor} fontWeight="bold">
                              Quantum Properties
                            </Text>
                          </CardHeader>
                          <CardBody py={3} px={4}>
                            <VStack align="start" spacing={3} mt={1}>
                              <Flex align="center">
                                <Badge 
                                  colorScheme={hasHadamard ? "blue" : "gray"}
                                  mr={2}
                                  variant="subtle"
                                  borderRadius="full"
                                >
                                  {hasHadamard ? "Present" : "Absent"}
                                </Badge>
                                <Text fontSize="sm">
                                  <strong>Superposition:</strong> 
                                  {hasHadamard && ' Hadamard gates create quantum superposition'}
                                </Text>
                                <Tooltip 
                                  label="Superposition allows a qubit to exist in multiple states simultaneously" 
                                  placement="right"
                                >
                                  <InfoIcon ml={1} boxSize={3} color="gray.500" />
                                </Tooltip>
                              </Flex>
                              
                              <Flex align="center">
                                <Badge 
                                  colorScheme={hasEntanglement ? "purple" : "gray"}
                                  mr={2}
                                  variant="subtle"
                                  borderRadius="full"
                                >
                                  {hasEntanglement ? "Present" : "Absent"}
                                </Badge>
                                <Text fontSize="sm">
                                  <strong>Entanglement:</strong>
                                  {hasEntanglement && ' Multi-qubit gates create quantum entanglement'}
                                </Text>
                                <Tooltip 
                                  label="Entanglement creates correlations between qubits that cannot be described classically" 
                                  placement="right"
                                >
                                  <InfoIcon ml={1} boxSize={3} color="gray.500" />
                                </Tooltip>
                              </Flex>
                              
                              {/* Gate distribution */}
                              <Box mt={2} w="100%">
                                <Text fontSize="sm" fontWeight="medium" mb={2}>Gate Distribution:</Text>
                                <Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))" gap={2}>
                                  {Object.entries(getGateStats()).map(([gateType, count]) => (
                                    <Box 
                                      key={gateType} 
                                      p={2} 
                                      borderRadius="md" 
                                      bg={useColorModeValue('gray.50', 'gray.700')}
                                      textAlign="center"
                                    >
                                      <Text fontSize="xs" fontWeight="bold" mb={1}>
                                        {gateType.toUpperCase()}
                                      </Text>
                                      <Text fontSize="lg" fontWeight="medium">
                                        {count}
                                      </Text>
                                    </Box>
                                  ))}
                                </Grid>
                              </Box>
                            </VStack>
                          </CardBody>
                        </Card>
                        
                        {/* Bloch coordinates for a single qubit case */}
                        {qubits.length === 1 && results && (
                          <Card mt={4} borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="sm" color={accentColor} fontWeight="bold">
                                Bloch Sphere Coordinates
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              {(() => {
                                // Convert probability results to complex amplitude format for Bloch calculation
                                const stateVector = Object.fromEntries(
                                  Object.entries(results || {}).map(([key, prob]) => [key, [Math.sqrt(prob), 0]])
                                );
                                const blochCoords = stateVectorToBloch(stateVector, 0);
                                return blochCoords;
                              })() && (
                                <Grid 
                                  templateColumns={isMobile ? "1fr" : "repeat(3, 1fr)"} 
                                  gap={4}
                                  textAlign="center"
                                >
                                  <Box>
                                    <Text fontSize="sm" color="gray.500">X COORDINATE</Text>
                                    <Text 
                                      fontSize="lg" 
                                      fontWeight="bold" 
                                      fontFamily="monospace"
                                      color="red.500"
                                    >
                                      {(() => {
                                        const stateVector = Object.fromEntries(
                                          Object.entries(results || {}).map(([key, prob]) => [key, [Math.sqrt(prob), 0]])
                                        );
                                        return stateVectorToBloch(stateVector, 0)?.x.toFixed(4);
                                      })()}
                                    </Text>
                                  </Box>
                                  <Box>
                                    <Text fontSize="sm" color="gray.500">Y COORDINATE</Text>
                                    <Text 
                                      fontSize="lg" 
                                      fontWeight="bold" 
                                      fontFamily="monospace"
                                      color="green.500"
                                    >
                                      {(() => {
                                        const stateVector = Object.fromEntries(
                                          Object.entries(results || {}).map(([key, prob]) => [key, [Math.sqrt(prob), 0]])
                                        );
                                        return stateVectorToBloch(stateVector, 0)?.y.toFixed(4);
                                      })()}
                                    </Text>
                                  </Box>
                                  <Box>
                                    <Text fontSize="sm" color="gray.500">Z COORDINATE</Text>
                                    <Text 
                                      fontSize="lg" 
                                      fontWeight="bold" 
                                      fontFamily="monospace"
                                      color="blue.500"
                                    >
                                      {(() => {
                                        const stateVector = Object.fromEntries(
                                          Object.entries(results || {}).map(([key, prob]) => [key, [Math.sqrt(prob), 0]])
                                        );
                                        return stateVectorToBloch(stateVector, 0)?.z.toFixed(4);
                                      })()}
                                    </Text>
                                  </Box>
                                </Grid>
                              )}
                              <Divider my={3} />
                              <Text fontSize="sm" color="gray.500" mt={1}>
                                These coordinates represent the position of your qubit state on the Bloch sphere.
                                X, Y, and Z values correspond to the expectation values of the Pauli operators.
                              </Text>
                            </CardBody>
                          </Card>
                        )}
                        
                        <Box 
                          mt={4} 
                          p={4} 
                          borderRadius="md" 
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          borderWidth="1px"
                          borderColor={borderColor}
                        >
                          <Flex align="center" mb={2}>
                            <Icon as={InfoIcon} mr={2} color="blue.500" />
                            <Text fontSize="sm" fontWeight="medium">Simulation Details</Text>
                          </Flex>
                          <Text fontSize="sm" fontStyle="italic" color="gray.500">
                            This is a simplified simulation. A real quantum computer would be affected by
                            noise, decoherence, and gate errors. For noisy simulations, try the "Noisy Simulator" method.
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
              
              {/* New Bloch Sphere Tab */}
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <CardBody>
                    {!simulationComplete || !results ? (
                      <VStack spacing={4} align="stretch" justify="center" h="300px">
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Run the simulation to see Bloch sphere visualization.
                        </Text>
                      </VStack>
                    ) : (
                      <Box>
                        <Heading size="md" mb={4}>Qubit Visualization</Heading>
                        
                        {qubits.length === 1 ? (
                          <Flex direction={isMobile ? "column" : "row"} align="center" justify="center">
                            {/* Single qubit case - Show just the Bloch sphere */}
                            <Box flex="1">
                              <BlochSphereVisualization 
                                stateVector={Object.fromEntries(
                                  Object.entries(results || {}).map(([key, prob]) => [key, [Math.sqrt(prob), 0]])
                                )}
                                width={isMobile ? 300 : 400}
                                height={isMobile ? 300 : 400}
                                title="Single Qubit Bloch Sphere"
                              />
                            </Box>
                            
                            <Box 
                              flex="1" 
                              mt={isMobile ? 6 : 0} 
                              ml={isMobile ? 0 : 6}
                              p={4}
                              borderRadius="md"
                              bg={accentBg}
                            >
                              <Heading size="sm" mb={3}>Bloch Sphere Explained</Heading>
                              <Text fontSize="sm" mb={3}>
                                The Bloch sphere is a geometrical representation of a single-qubit quantum state.
                                Any pure state of a qubit can be represented as a point on the surface of the sphere.
                              </Text>
                              
                              <VStack align="start" spacing={2} fontSize="sm">
                                <HStack>
                                  <Box 
                                    w="12px" 
                                    h="12px" 
                                    borderRadius="full" 
                                    bg="red.400" 
                                  />
                                  <Text>X-axis: Corresponds to the Pauli-X operator</Text>
                                </HStack>
                                <HStack>
                                  <Box 
                                    w="12px" 
                                    h="12px" 
                                    borderRadius="full" 
                                    bg="green.400" 
                                  />
                                  <Text>Y-axis: Corresponds to the Pauli-Y operator</Text>
                                </HStack>
                                <HStack>
                                  <Box 
                                    w="12px" 
                                    h="12px" 
                                    borderRadius="full" 
                                    bg="blue.400" 
                                  />
                                  <Text>Z-axis: Corresponds to the Pauli-Z operator</Text>
                                </HStack>
                              </VStack>
                              
                              <Text fontSize="sm" mt={3}>
                                <strong>North pole (|0⟩):</strong> The standard computational basis state |0⟩
                              </Text>
                              <Text fontSize="sm">
                                <strong>South pole (|1⟩):</strong> The standard computational basis state |1⟩
                              </Text>
                              <Text fontSize="sm">
                                <strong>Equator:</strong> Equal superpositions of |0⟩ and |1⟩, differing by phase
                              </Text>
                            </Box>
                          </Flex>
                        ) : (
                          // Multi-qubit case - Show the full QubitVisualization component
                          <QubitVisualization 
                            stateVector={Object.fromEntries(
                              Object.entries(results).map(([key, prob]) => [key, [Math.sqrt(prob), 0]])
                            )}
                            numQubits={qubits.length}
                            title="Qubit State Visualization"
                          />
                        )}
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Box>
  );
};

export default SimulationPanel;