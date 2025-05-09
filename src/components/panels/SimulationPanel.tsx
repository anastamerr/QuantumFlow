import { Box, Heading, Text, Button, VStack, HStack, Spinner, useColorModeValue, Select, FormControl, FormLabel, useToast, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Switch, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Divider } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { selectQubits, selectGates } from '../../store/slices/circuitSlice'
import { useState, useCallback, useEffect, useRef } from 'react'
import QuantumStateVisualizer from '../visualization/QuantumStateVisualizer'
import { simulateCircuit } from '../../utils/stateEvolution'
import { transformStoreGatesToCircuitGates } from '../../utils/circuitUtils'

const SimulationPanel = () => {
  const qubits = useSelector(selectQubits)
  const storeGates = useSelector(selectGates)
  const toast = useToast()
  const [isSimulating, setIsSimulating] = useState(false)
  const [results, setResults] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shots, setShots] = useState<number>(1024)
  const [method, setMethod] = useState<string>('statevector')
  const [showRealTimeVisualization, setShowRealTimeVisualization] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const [autoPlay, setAutoPlay] = useState<boolean>(false)
  const [simulationComplete, setSimulationComplete] = useState<boolean>(false)
  
  // Store visualization instance reference
  const visualizerRef = useRef<any>(null);
  
  // Transform store gates to circuit gates for visualization
  const gates = transformStoreGatesToCircuitGates(storeGates);
  
  const codeBg = useColorModeValue('gray.50', 'gray.800')
  const codeBorder = useColorModeValue('gray.200', 'gray.600')
  const successColor = useColorModeValue('blue.500', 'blue.300')
  
  // Reset simulation results when circuit changes
  useEffect(() => {
    if (results !== null || simulationComplete) {
      setResults(null);
      setSimulationComplete(false);
      setActiveTab(0); // Reset to simulation tab when circuit changes
    }
  }, [qubits, storeGates]);
  
  // Check if circuit has a Hadamard gate (creates superposition)
  const hasHadamard = gates.some(gate => gate.type === 'h')
  const hasEntanglement = gates.some(gate => 
    gate.type === 'cnot' || gate.type === 'cz' || gate.type === 'swap' || gate.type === 'toffoli'
  )
  
  // Get gate counts for analysis
  const getGateStats = useCallback(() => {
    const stats: Record<string, number> = {}
    
    gates.forEach(gate => {
      const type = gate.type
      stats[type] = (stats[type] || 0) + 1
    })
    
    return stats
  }, [gates])
  
  // Function to run the simulation
  const runSimulation = async () => {
    // Reset state
    setIsSimulating(true)
    setSimulationComplete(false)
    setResults(null)
    setError(null)
    
    try {
      // Validate circuit first
      if (gates.length === 0) {
        throw new Error('Cannot simulate an empty circuit. Add gates to the circuit first.')
      }
      
      // If real-time visualization is not enabled, perform the full simulation immediately
      if (!showRealTimeVisualization) {
        // In a real implementation, this would call a quantum simulator API
        // For now, we'll simulate a simple result based on the circuit
        
        // Simulate API call delay (longer for more complex circuits)
        const complexity = Math.min(500 + (gates.length * 100), 3000)
        await new Promise(resolve => setTimeout(resolve, complexity))
        
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
      })
    } catch (err) {
      console.error('Simulation error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during simulation.')
      setIsSimulating(false); // Make sure we're not stuck in simulating state
    }
  }
  
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
  }, [autoPlay]);
  
  // Make sure tabs are enabled after simulation completes
  useEffect(() => {
    if (simulationComplete && results) {
      // Make sure the tabs are enabled
      console.log("Simulation is complete, enabling tabs");
    }
  }, [simulationComplete, results]);
  
  // Render the results as a bar chart
  const renderResultsChart = () => {
    if (!results) return null
    
    // Sort results by count (descending)
    const sortedResults = Object.entries(results)
      .filter(([_, count]) => count > 0.001) // Only show non-zero results
      .sort((a, b) => b[1] - a[1])
    
    if (sortedResults.length === 0) return <Text>No significant measurement results.</Text>
    
    const maxValue = Math.max(...sortedResults.map(([_, count]) => count))
    
    return (
      <VStack spacing={2} align="stretch" mt={4}>
        {sortedResults.map(([state, prob]) => {
          const percentage = prob * 100
          const count = Math.round(shots * prob)
          
          return (
            <Box key={state} mb={3}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm">|{state}⟩</Text>
                <Text fontSize="sm">{count} shots ({percentage.toFixed(1)}%)</Text>
              </Flex>
              <Box
                h="24px" 
                bg={successColor}
                borderRadius="md"
                w={`${(prob / maxValue) * 100}%`}
                transition="width 0.3s ease-in-out"
                position="relative"
              />
            </Box>
          )
        })}
      </VStack>
    )
  }
  
  // Function to get visualizer state for test/debug
  const getVisualizer = (instance: any) => {
    visualizerRef.current = instance;
  }
  
  // Manual switch to results tab
  const goToResults = () => {
    setActiveTab(1);
  }
  
  // Manual switch to analysis tab
  const goToAnalysis = () => {
    setActiveTab(2);
  }
  
  // Calculate circuit depth - safely handle undefined positions
  const calculateCircuitDepth = () => {
    if (gates.length === 0) return 0;
    return Math.max(...gates.map(g => g.position !== undefined ? g.position : 0)) + 1;
  };
  
  return (
    <Box>
      <Flex justify="space-between" mb={4} align="center" wrap="wrap">
        <Heading size="md">Quantum Simulation</Heading>
        <HStack spacing={3}>
          <Button 
            colorScheme="blue" 
            onClick={runSimulation} 
            isLoading={isSimulating}
            loadingText="Simulating"
            isDisabled={gates.length === 0}
          >
            Run Simulation
          </Button>
        </HStack>
      </Flex>
      
      {/* Simulation options */}
      <Flex 
        mb={4} 
        p={3} 
        borderRadius="md" 
        bg={useColorModeValue('gray.50', 'gray.700')}
        gap={4}
        wrap="wrap"
      >
        <FormControl w="auto" minW="150px">
          <FormLabel fontSize="sm">Simulation Method</FormLabel>
          <Select 
            size="sm" 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            isDisabled={isSimulating}
          >
            <option value="statevector">State Vector</option>
            <option value="noisy">Noisy Simulator</option>
          </Select>
        </FormControl>
        
        <FormControl w="auto" minW="150px">
          <FormLabel fontSize="sm">Number of Shots</FormLabel>
          <Select 
            size="sm" 
            value={shots.toString()} 
            onChange={(e) => setShots(parseInt(e.target.value))}
            isDisabled={isSimulating}
          >
            <option value="100">100</option>
            <option value="1024">1024</option>
            <option value="5000">5000</option>
            <option value="10000">10000</option>
          </Select>
        </FormControl>
        
        <FormControl display="flex" flexDirection="column" minW="150px">
          <FormLabel htmlFor="real-time-viz" mb="0" fontSize="sm">
            Real-time Visualization
          </FormLabel>
          <Switch 
            id="real-time-viz" 
            isChecked={showRealTimeVisualization} 
            onChange={(e) => setShowRealTimeVisualization(e.target.checked)}
            colorScheme="blue"
            isDisabled={isSimulating}
            mb={2}
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
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Text fontSize="xs" ml={2}>Fast</Text>
                  <Text fontSize="xs" fontWeight="bold" ml={3}>{playbackSpeed.toFixed(1)}x</Text>
                </Flex>
              </FormControl>
            </>
          )}
        </FormControl>
      </Flex>
      
      {/* Tabbed interface for visualization and results */}
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        index={activeTab} 
        onChange={(index) => setActiveTab(index)}
        isLazy
      >
        <TabList>
          <Tab>Simulation</Tab>
          <Tab isDisabled={!simulationComplete || !results}>Results</Tab>
          <Tab isDisabled={!simulationComplete || !results}>Analysis</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel p={0} mt={3}>
            <Box 
              p={4} 
              borderRadius="md" 
              bg={codeBg} 
              borderWidth={1} 
              borderColor={codeBorder}
              minH="350px"
            >
              {isSimulating && showRealTimeVisualization ? (
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
              ) : isSimulating ? (
                <VStack spacing={4} justify="center" h="300px">
                  <Spinner size="xl" color="blue.500" />
                  <Text>Running quantum simulation...</Text>
                  <Text fontSize="sm" color="gray.500">Simulating circuit with {gates.length} gates on {qubits.length} qubits</Text>
                </VStack>
              ) : error ? (
                <VStack spacing={3} align="stretch">
                  <Text color="red.500" fontWeight="medium">Error:</Text>
                  <Text color="red.500">{error}</Text>
                  <Box mt={2} p={3} bg={useColorModeValue('red.50', 'red.900')} borderRadius="md">
                    <Text fontSize="sm">Try simplifying your circuit or checking for invalid gate configurations.</Text>
                  </Box>
                </VStack>
              ) : simulationComplete && results ? (
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
                    <Button size="sm" colorScheme="blue" onClick={goToResults}>
                      View Results
                    </Button>
                    <Button size="sm" colorScheme="purple" onClick={goToAnalysis}>
                      View Analysis
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch" justify="center" h="300px">
                  <Text color="gray.500" textAlign="center">
                    Click "Run Simulation" to see the step-by-step evolution of your quantum circuit.
                  </Text>
                  {gates.length === 0 ? (
                    <Text fontSize="sm" color="orange.500" textAlign="center">
                      Add gates to your circuit first
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Your circuit has {gates.length} gates on {qubits.length} qubits
                    </Text>
                  )}
                </VStack>
              )}
            </Box>
          </TabPanel>
          
          <TabPanel p={0} mt={3}>
            <Box 
              p={4} 
              borderRadius="md" 
              bg={codeBg} 
              borderWidth={1} 
              borderColor={codeBorder}
              minH="350px"
            >
              {!simulationComplete || !results ? (
                <VStack spacing={4} justify="center" h="300px">
                  <Text color="gray.500" textAlign="center">
                    Run the simulation to see measurement results.
                  </Text>
                </VStack>
              ) : (
                <Box>
                  <Flex justify="space-between" mb={3}>
                    <Heading size="sm">Measurement Results ({shots} shots)</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Method: {method === 'statevector' ? 'State Vector' : 'Noisy Simulator'}
                    </Text>
                  </Flex>
                  {renderResultsChart()}
                </Box>
              )}
            </Box>
          </TabPanel>
          
          <TabPanel p={0} mt={3}>
            <Box 
              p={4} 
              borderRadius="md" 
              bg={codeBg} 
              borderWidth={1} 
              borderColor={codeBorder}
              minH="350px"
            >
              {!simulationComplete || !results ? (
                <VStack spacing={4} align="stretch" justify="center" h="300px">
                  <Text color="gray.500" textAlign="center">
                    Run the simulation to see circuit analysis.
                  </Text>
                </VStack>
              ) : (
                <Box mt={2}>
                  <Heading size="xs" mb={2}>Circuit Analysis</Heading>
                  <Divider mb={4} />
                  <Flex gap={4} wrap="wrap">
                    <Box>
                      <Text fontSize="xs" color="gray.500">CIRCUIT TYPE</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {hasEntanglement 
                          ? 'Entangled'
                          : hasHadamard
                            ? 'Superposition'
                            : 'Classical'
                        }
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">QUBITS</Text>
                      <Text fontSize="sm" fontWeight="medium">{qubits.length}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">GATES</Text>
                      <Text fontSize="sm" fontWeight="medium">{gates.length}</Text>
                    </Box>
                  </Flex>
                  
                  <Box mt={6}>
                    <Heading size="xs" mb={2}>Circuit Properties</Heading>
                    <VStack align="start" spacing={2} mt={3}>
                      <Text fontSize="sm">
                        <strong>Superposition:</strong> {hasHadamard ? 'Present' : 'Not present'}
                        {hasHadamard && ' (Hadamard gates create quantum superposition)'}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Entanglement:</strong> {hasEntanglement ? 'Present' : 'Not present'}
                        {hasEntanglement && ' (Multi-qubit gates create quantum entanglement)'}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Circuit Depth:</strong> {calculateCircuitDepth()}
                      </Text>
                    </VStack>
                  </Box>
                  
                  <Text mt={6} fontSize="sm" fontStyle="italic">
                    Note: This is a simplified simulation. A real quantum computer would be affected by
                    noise, decoherence, and gate errors.
                  </Text>
                </Box>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default SimulationPanel