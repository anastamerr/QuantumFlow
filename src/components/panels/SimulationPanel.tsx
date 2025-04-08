import { Box, Heading, Text, Button, VStack, HStack, Spinner, useColorModeValue } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { selectQubits, selectGates } from '../../store/slices/circuitSlice'
import { useState } from 'react'

const SimulationPanel = () => {
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const [isSimulating, setIsSimulating] = useState(false)
  const [results, setResults] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const codeBg = useColorModeValue('gray.50', 'gray.800')
  const codeBorder = useColorModeValue('gray.200', 'gray.600')
  
  // Function to run the simulation
  const runSimulation = async () => {
    // Reset state
    setIsSimulating(true)
    setResults(null)
    setError(null)
    
    try {
      // In a real implementation, this would call a quantum simulator API
      // For now, we'll simulate a simple result based on the circuit
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate mock results
      if (gates.length === 0) {
        setError('Cannot simulate an empty circuit. Add gates to the circuit first.')
        return
      }
      
      const mockResults: Record<string, number> = {}
      const numQubits = qubits.length
      
      // Generate results based on circuit complexity
      // This is just a placeholder - real simulation would use quantum mechanics
      const hasHadamard = gates.some(gate => gate.type === 'h')
      
      if (hasHadamard) {
        // If we have Hadamard gates, show superposition results
        const possibleStates = Math.min(8, Math.pow(2, numQubits))
        const totalShots = 1024
        
        // Distribute shots somewhat randomly but favor balanced states
        let remainingShots = totalShots
        
        for (let i = 0; i < possibleStates; i++) {
          const state = i.toString(2).padStart(numQubits, '0')
          const shots = i === possibleStates - 1 
            ? remainingShots 
            : Math.floor(Math.random() * (remainingShots / 2)) + 1
          
          mockResults[state] = shots
          remainingShots -= shots
          
          if (remainingShots <= 0) break
        }
      } else {
        // Without Hadamard, show classical-like results
        const state = '0'.repeat(numQubits)
        mockResults[state] = 1024 // All shots in the |0...0⟩ state
      }
      
      setResults(mockResults)
    } catch (err) {
      setError('An error occurred during simulation.')
      console.error(err)
    } finally {
      setIsSimulating(false)
    }
  }
  
  // Render the results as a bar chart
  const renderResultsChart = () => {
    if (!results) return null
    
    const maxValue = Math.max(...Object.values(results))
    const sortedResults = Object.entries(results).sort((a, b) => b[1] - a[1])
    
    return (
      <VStack spacing={2} align="stretch" mt={4}>
        {sortedResults.map(([state, count]) => (
          <Box key={state}>
            <Text fontSize="sm" mb={1}>|{state}⟩</Text>
            <HStack spacing={2}>
              <Box 
                h="20px" 
                bg="blue.500" 
                borderRadius="md"
                w={`${(count / maxValue) * 100}%`}
              />
              <Text fontSize="sm" width="60px">{count} shots</Text>
              <Text fontSize="sm" width="60px">{((count / 1024) * 100).toFixed(1)}%</Text>
            </HStack>
          </Box>
        ))}
      </VStack>
    )
  }
  
  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Quantum Simulation</Heading>
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
          </VStack>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : results ? (
          <Box>
            <Heading size="sm" mb={2}>Simulation Results (1024 shots)</Heading>
            {renderResultsChart()}
            <Text mt={4} fontSize="sm" fontStyle="italic">
              Note: This is a simplified simulation. A real quantum computer or full simulator
              would calculate the actual quantum state vector based on the gates applied.
            </Text>
          </Box>
        ) : (
          <Text color="gray.500" fontStyle="italic">
            Click "Run Simulation" to see the results of your quantum circuit.
          </Text>
        )}
      </Box>
    </Box>
  )
}

export default SimulationPanel