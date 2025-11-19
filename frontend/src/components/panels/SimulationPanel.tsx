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
  useBreakpointValue,
  Switch,
  Collapse
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { selectQubits, selectGates } from '../../store/slices/circuitSlice';
import { useState, useCallback, useEffect } from 'react';
// import QuantumStateVisualizer from '../visualization/QuantumStateVisualizer'; // removed
import QubitVisualization from '../visualization/QubitVisualizer';
import { transformStoreGatesToCircuitGates } from '../../utils/circuitUtils';
import { simulateGateApplication, QuantumState } from '../../utils/stateEvolution';
import { getProbabilitiesFromQuantumState, getStateMatrixFromQuantumState } from '../../utils/localMeasurement';
import StateMatrixPanel from './StateMatrixPanel';
import { InfoIcon, RepeatIcon, ChevronRightIcon, StarIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import FullViewToggle from '../common/FullViewToggle';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import CircuitTimelineGraph from '../visualization/CircuitTimelineGraph';
import QSphereTest from '../visualization/qspheretest';

const SimulationPanel = () => {
  const qubits = useSelector(selectQubits);
  const storeGates = useSelector(selectGates);
  const toast = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<number>(1024);
  const [method, setMethod] = useState<string>('statevector');
  const [activeTab, setActiveTab] = useState<number>(0);
  // const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  // const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [simulationComplete, setSimulationComplete] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'histogram' | 'timeline'>('histogram');
  const [stateMatrix, setStateMatrix] = useState<Array<{state: string; amplitude: number | string; probability: number}> | null>(null);
  const [showBlochSphere, setShowBlochSphere] = useState<boolean>(false); // Hidden by default
  
  // Store visualization instance reference
  // const visualizerRef = useRef<any>(null);
  
  // Transform store gates to circuit gates for visualization
  const gates = transformStoreGatesToCircuitGates(storeGates);
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const barBg = useColorModeValue('gray.100', 'gray.700');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const accentColor = useColorModeValue('blue.600', 'blue.300');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningColor = useColorModeValue('orange.600', 'orange.300');
  const tooltipBgColor = useColorModeValue('white', 'gray.700');
  const tooltipPrimaryText = useColorModeValue('gray.800', 'gray.100');
  const tooltipSecondaryText = useColorModeValue('gray.600', 'gray.300');
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const tabSize = useBreakpointValue({ base: "sm", md: "md" });

  // Reset simulation results when circuit changes
  useEffect(() => {
    if (results !== null || simulationComplete) {
      setResults(null);
      setStateMatrix(null);
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
  
  // Compute quantum state locally
  const computeQuantumState = useCallback((): QuantumState => {
    if (qubits.length === 0) {
      return { '0': [1, 0] };
    }

    // Initialize state vector: all qubits in |0⟩ state
    let state: QuantumState = {
      ['0'.repeat(qubits.length)]: [1, 0]
    };

    // Apply each gate in order
    const sortedGates = [...gates].sort((a, b) => (a.position || 0) - (b.position || 0));
    
    for (const gate of sortedGates) {
      try {
        state = simulateGateApplication(state, gate, qubits.length);
      } catch (err) {
        console.error('Error applying gate:', err);
      }
    }

    return state;
  }, [qubits, gates]);

  // Function to run the simulation
  const runSimulation = () => {
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
      
      // Compute quantum state locally
      const quantumState = computeQuantumState();
      
      // Calculate probabilities from quantum state
      const probabilities = getProbabilitiesFromQuantumState(quantumState);
      
      // Calculate state matrix from quantum state
      const stateMatrixData = getStateMatrixFromQuantumState(quantumState, qubits.length);
      
      console.log('Local simulation results:', {
        probabilities,
        stateMatrix: stateMatrixData,
        qubits: qubits.length,
        gates: gates.length,
      });
      
      setResults(probabilities);
      setStateMatrix(stateMatrixData);
      setSimulationComplete(true);
      setActiveTab(1);
      setIsSimulating(false);
      
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
      setIsSimulating(false);
    }
  };
  
  // Make sure tabs are enabled after simulation completes
  useEffect(() => {
    if (simulationComplete && results) {
      // Make sure the tabs are enabled
      console.log("Simulation is complete, enabling tabs");
    }
  }, [simulationComplete, results]);
  
  // Convert results to bar chart data format
  const getBarChartData = () => {
    if (!results || Object.keys(results).length === 0) {
      return [];
    }
    
    return Object.entries(results)
      .map(([state, probability]) => ({
        state: `|${state}⟩`,
        probability: probability,
      }))
      .sort((a, b) => a.state.localeCompare(b.state));
  };

  const barChartData = getBarChartData();

  const BarChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg={tooltipBgColor} p={3} borderRadius="md" boxShadow="lg">
          <Text fontWeight="bold" mb={2} color={tooltipPrimaryText}>
            {data.state}
          </Text>
          <Text fontSize="sm" color={tooltipSecondaryText}>
            Probability: {(data.probability * 100).toFixed(4)}%
          </Text>
          <Text fontSize="sm" color={tooltipSecondaryText}>
            Value: {data.probability.toFixed(6)}
          </Text>
        </Box>
      );
    }
    return null;
  };
  
  // Visualization ref removed
  
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
    <Box h="100%" overflowY="auto" overflowX="hidden" pr={{ base: 0, md: 1 }}>
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
            
            <HStack>
              <FullViewToggle />
              <Button
                leftIcon={showBlochSphere ? <ViewOffIcon /> : <ViewIcon />}
                colorScheme="purple"
                variant="solid"
                onClick={() => setShowBlochSphere(!showBlochSphere)}
                size="sm"
                aria-expanded={showBlochSphere}
                aria-label={showBlochSphere ? "Hide Bloch Sphere" : "Show Bloch Sphere"}
              >
                Bloch Sphere
              </Button>
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
            </HStack>
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
              
              {/* Real-time Visualization controls removed: backend-only measurements */}
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
                Visualization
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
                  {isSimulating ? (
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
                          Click "Run Simulation" to execute measurements on the backend and view accurate results.
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
                    <Box>
                      <Flex 
                        justify="space-between" 
                        mb={4} 
                        align="center" 
                        pb={3} 
                        borderBottomWidth="1px"
                        borderColor={borderColor}
                        wrap="wrap"
                        gap={2}
                      >
                        <Heading size="md">Measurement Results</Heading>
                        <Flex align="center" wrap="wrap" gap={2}>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              colorScheme={viewMode === 'histogram' ? 'blue' : 'gray'}
                              variant={viewMode === 'histogram' ? 'solid' : 'outline'}
                              onClick={() => setViewMode('histogram')}
                              isDisabled={!simulationComplete || !results}
                            >
                              Histogram
                            </Button>
                            <Button
                              size="sm"
                              colorScheme={viewMode === 'timeline' ? 'blue' : 'gray'}
                              variant={viewMode === 'timeline' ? 'solid' : 'outline'}
                              onClick={() => setViewMode('timeline')}
                            >
                              Timeline
                            </Button>
                          </HStack>
                          {simulationComplete && results && (
                            <>
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
                            </>
                          )}
                        </Flex>
                      </Flex>
                      
                      {viewMode === 'histogram' ? (
                        !simulationComplete || !results ? (
                          <VStack spacing={4} justify="center" h="300px">
                            <Text color="gray.500" textAlign="center" fontWeight="medium">
                              Run the simulation to see measurement results.
                            </Text>
                          </VStack>
                        ) : barChartData.length === 0 ? (
                          <VStack spacing={4} justify="center" h="300px">
                            <Text color="gray.500" textAlign="center" fontWeight="medium">
                              No Data
                            </Text>
                            <Text fontSize="sm" color="gray.400" textAlign="center">
                              Simulation results are empty. Please run the simulation again.
                            </Text>
                          </VStack>
                        ) : (
                          <Box height={isMobile ? 300 : 400}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('#E2E8F0', '#2D3748')} />
                                <XAxis
                                  dataKey="state"
                                  tick={{ fill: useColorModeValue('#4A5568', '#CBD5F5') }}
                                  angle={isMobile ? -45 : -25}
                                  textAnchor={isMobile ? 'end' : 'end'}
                                  height={isMobile ? 80 : 60}
                                />
                                <YAxis
                                  domain={[0, 1]}
                                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                  tick={{ fill: useColorModeValue('#4A5568', '#CBD5F5') }}
                                  label={{
                                    value: 'Probability',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fill: useColorModeValue('#4A5568', '#CBD5F5'), textAnchor: 'middle' },
                                  }}
                                />
                                <RechartsTooltip
                                  cursor={{ fill: useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)') }}
                                  content={<BarChartTooltip />}
                                />
                                <Bar
                                  dataKey="probability"
                                  fill={useColorModeValue('#3182CE', '#63B3ED')}
                                  radius={[4, 4, 0, 0]}
                                  isAnimationActive
                                  animationDuration={800}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        )
                      ) : (
                        <>
                          {gates.length === 0 ? (
                            <VStack spacing={4} justify="center" h="300px">
                              <Text color="gray.500" textAlign="center" fontWeight="medium">
                                Add gates to your circuit to see the timeline visualization.
                              </Text>
                            </VStack>
                          ) : (
                            <Box height={isMobile ? 300 : 400}>
                              <CircuitTimelineGraph
                                circuit={gates}
                                numQubits={qubits.length}
                                height={isMobile ? 300 : 400}
                              />
                            </Box>
                          )}
                        </>
                      )}
                      
                      {viewMode === 'histogram' && simulationComplete && results && (
                        <Box mt={6} p={3} borderRadius="md" bg={accentBg}>
                          <Flex align="center">
                            <Icon as={InfoIcon} color={accentColor} mr={2} />
                            <Text fontSize="sm" color={accentColor}>
                              These results show the probability distribution of measuring each possible state.
                              In a real quantum computer, each shot produces a single measurement result according to these probabilities.
                            </Text>
                          </Flex>
                        </Box>
                      )}
                      {viewMode === 'timeline' && gates.length > 0 && (
                        <Box mt={6} p={3} borderRadius="md" bg={accentBg}>
                          <Flex align="center">
                            <Icon as={InfoIcon} color={accentColor} mr={2} />
                            <Text fontSize="sm" color={accentColor}>
                              This timeline shows how the probability distribution evolves after each gate in your circuit.
                              Each line represents a basis state, and the Y-axis shows its probability at each step.
                            </Text>
                          </Flex>
                        </Box>
                      )}
                    </Box>
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
                          Run the simulation to see quantum state visualization.
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        <StateMatrixPanel data={stateMatrix} />
                        {qubits.length > 0 && (
                          <Box>
                            <QubitVisualization
                              stateVector={computeQuantumState()}
                              numQubits={qubits.length}
                              title="Qubit State Visualization"
                            />
                          </Box>
                        )}
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {/* Bloch Sphere Section */}
          <Collapse in={showBlochSphere} animateOpacity>
            <Box mt={4}>
              <QSphereTest />
            </Box>
          </Collapse>
        </CardBody>
      </Card>
    </Box>
  );
};

export default SimulationPanel;
