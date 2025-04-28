import { Box, Heading, Text, Button, VStack, HStack, Spinner, useColorModeValue, Select, FormControl, FormLabel, useToast, Flex } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { selectQubits, selectGates } from '../../store/slices/circuitSlice'
import { useState, useCallback, useEffect } from 'react'

const SimulationPanel = () => {
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const toast = useToast()
  const [isSimulating, setIsSimulating] = useState(false)
  const [results, setResults] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shots, setShots] = useState<number>(1024)
  const [method, setMethod] = useState<string>('statevector')
  
  const codeBg = useColorModeValue('gray.50', 'gray.800')
  const codeBorder = useColorModeValue('gray.200', 'gray.600')
  const successColor = useColorModeValue('blue.500', 'blue.300')
  
  // Reset simulation results when circuit changes
  useEffect(() => {
    if (results !== null) {
      setResults(null)
    }
  }, [qubits, gates])
  
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
    setResults(null)
    setError(null)
    
    try {
      // Validate circuit first
      if (gates.length === 0) {
        throw new Error('Cannot simulate an empty circuit. Add gates to the circuit first.')
      }
      
      // In a real implementation, this would call a quantum simulator API
      // For now, we'll simulate a simple result based on the circuit
      
      // Simulate API call delay (longer for more complex circuits)
      const complexity = Math.min(500 + (gates.length * 100), 3000)
      await new Promise(resolve => setTimeout(resolve, complexity))
      
      // Generate results based on circuit complexity
      const mockResults: Record<string, number> = {}
      const numQubits = qubits.length
      const totalShots = shots
      
      if (method === 'statevector') {
        // Statevector simulation - more precise
        if (hasHadamard) {
          // If we have Hadamard gates, create superposition patterns
          
          if (hasEntanglement) {
            // With entanglement, certain states are correlated
            // For a simple Bell state-like result (if circuit has H + CNOT)
            const bellPatterns = ['0'.repeat(numQubits), '1'.repeat(numQubits)]
            
            // Favor the patterns but add some noise
            for (let i = 0; i < Math.pow(2, numQubits); i++) {
              const state = i.toString(2).padStart(numQubits, '0')
              
              if (bellPatterns.includes(state)) {
                // Bell state gets approximately 45% of shots each
                mockResults[state] = Math.floor(totalShots * 0.45 + Math.random() * 50)
              } else {
                // Noise states get very little
                mockResults[state] = Math.floor(Math.random() * 10)
              }
            }
          } else {
            // Equal superposition for all states (like H on all qubits)
            for (let i = 0; i < Math.pow(2, numQubits); i++) {
              const state = i.toString(2).padStart(numQubits, '0')
              // Add some randomness to the distribution
              const baseProb = totalShots / Math.pow(2, numQubits)
              const variation = baseProb * 0.2 // 20% variation
              mockResults[state] = Math.floor(baseProb + (Math.random() * variation * 2 - variation))
            }
          }
        } else {
          // Without Hadamard, show classical-like results with X gates flipping bits
          const initialState = '0'.repeat(numQubits)
          
          // Count X gates on each qubit
          const xFlips: number[] = Array(numQubits).fill(0)
          
          for (const gate of gates) {
            if (gate.type === 'x' && gate.qubit !== undefined) {
              xFlips[gate.qubit] = (xFlips[gate.qubit] + 1) % 2
            }
          }
          
          // Apply X gates to get final state
          const finalStateArray = initialState.split('')
          for (let i = 0; i < numQubits; i++) {
            if (xFlips[i] === 1) {
              finalStateArray[i] = '1'
            }
          }
          const finalState = finalStateArray.join('')
          
          // Set all shots to the final state
          mockResults[finalState] = totalShots
        }
      } else {
        // Noisy simulator - add more randomness
        if (hasHadamard) {
          // Create a more random distribution
          let remainingShots = totalShots
          
          for (let i = 0; i < Math.pow(2, numQubits); i++) {
            const state = i.toString(2).padStart(numQubits, '0')
            
            if (i === Math.pow(2, numQubits) - 1) {
              // Last state gets all remaining shots
              mockResults[state] = remainingShots
            } else {
              // Distribute shots somewhat randomly with more noise
              const shotCount = Math.floor(Math.random() * (remainingShots / 2)) + 1
              mockResults[state] = shotCount
              remainingShots -= shotCount
              
              if (remainingShots <= 0) break
            }
          }
        } else {
          // Still mostly classical but with some noise
          const initialState = '0'.repeat(numQubits)
          
          // Count X gates on each qubit
          const xFlips: number[] = Array(numQubits).fill(0)
          
          for (const gate of gates) {
            if (gate.type === 'x' && gate.qubit !== undefined) {
              xFlips[gate.qubit] = (xFlips[gate.qubit] + 1) % 2
            }
          }
          
          // Apply X gates to get final state
          const finalState = initialState.split('').map((bit, i) => 
            xFlips[i] === 1 ? '1' : '0'
          ).join('')
          
          // Set most shots to the final state, but add noise
          mockResults[finalState] = Math.floor(totalShots * 0.95)
          
          // Add some quantum noise (5% of shots)
          let noiseShots = totalShots - mockResults[finalState]
          
          for (let i = 0; i < Math.pow(2, numQubits); i++) {
            const state = i.toString(2).padStart(numQubits, '0')
            if (state !== finalState && noiseShots > 0) {
              const noise = Math.floor(Math.random() * noiseShots) + 1
              mockResults[state] = noise 
              noiseShots -= noise
              
              if (noiseShots <= 0) break
            }
          }
        }
      }
      
      // Ensure all values sum to total shots
      const currentTotal = Object.values(mockResults).reduce((sum, count) => sum + count, 0)
      if (currentTotal !== totalShots) {
        const diff = totalShots - currentTotal
        // Add or subtract from the first non-zero state
        for (const state in mockResults) {
          if (mockResults[state] > 0 || diff > 0) {
            mockResults[state] += diff
            if (mockResults[state] < 0) mockResults[state] = 0
            break
          }
        }
      }
      
      setResults(mockResults)
      
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
    } finally {
      setIsSimulating(false)
    }
  }
  
  // Render the results as a bar chart
  const renderResultsChart = () => {
    if (!results) return null
    
    // Sort results by count (descending)
    const sortedResults = Object.entries(results)
      .filter(([_, count]) => count > 0) // Only show non-zero results
      .sort((a, b) => b[1] - a[1])
    
    if (sortedResults.length === 0) return <Text>No significant measurement results.</Text>
    
    const maxValue = Math.max(...sortedResults.map(([_, count]) => count))
    
    return (
      <VStack spacing={2} align="stretch" mt={4}>
        {sortedResults.map(([state, count]) => {
          const percentage = (count / shots) * 100
          
          return (
            <Box key={state} mb={3}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">|{state}⟩</Text>
                <Text fontSize="sm">{count} shots ({percentage.toFixed(1)}%)</Text>
              </Flex>
              <Box
                h="24px" 
                bg={successColor}
                borderRadius="md"
                w={`${(count / maxValue) * 100}%`}
                transition="width 0.3s ease-in-out"
                position="relative"
              />
            </Box>
          )
        })}
      </VStack>
    )
  }
  
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
      </Flex>
      
      <Box 
        p={4} 
        borderRadius="md" 
        bg={codeBg} 
        borderWidth={1} 
        borderColor={codeBorder}
        minH="200px"
      >
        {isSimulating ? (
          <VStack spacing={4} justify="center" h="200px">
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
        ) : results ? (
          <Box>
            <Flex justify="space-between" mb={3}>
              <Heading size="sm">Simulation Results ({shots} shots)</Heading>
              <Text fontSize="sm" color="gray.500">
                Method: {method === 'statevector' ? 'State Vector' : 'Noisy Simulator'}
              </Text>
            </Flex>
            {renderResultsChart()}
            
            {/* Circuit analysis */}
            <Box mt={6} pt={4} borderTopWidth={1} borderColor={codeBorder}>
              <Heading size="xs" mb={2}>Circuit Analysis</Heading>
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
            </Box>
            
            <Text mt={4} fontSize="sm" fontStyle="italic">
              Note: This is a simplified simulation. A real quantum computer would be affected by
              noise, decoherence, and gate errors.
            </Text>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch" justify="center" h="200px">
            <Text color="gray.500" textAlign="center">
              Click "Run Simulation" to see the results of your quantum circuit.
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
    </Box>
  )
}

export default SimulationPanel