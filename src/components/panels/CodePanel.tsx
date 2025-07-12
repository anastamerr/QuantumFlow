import { Box, Heading, Text, Button, useColorModeValue, HStack, VStack, Select, Switch, FormControl, FormLabel, Collapse, Divider, Tooltip, Icon } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { selectQubits, selectGates, Gate as StoreGate } from '../../store/slices/circuitSlice'
import { selectCodeFormat, setCodeFormat } from '../../store/slices/uiSlice'
import { generateQiskitCode, generateCirqCode, OptimizationOptions } from '../../utils/codeGenerator'
import { useState, useCallback } from 'react'
import { InfoIcon } from '@chakra-ui/icons'
import { gateLibrary } from '../../utils/gateLibrary'
import { Gate as CircuitGate } from '../../types/circuit'
import AdvancedOptimizationPanel from './AdvancedOptimizationPanel'
import { defaultAdvancedOptions } from '../../utils/circuitOptimizer'

const CodePanel = () => {
  const dispatch = useDispatch()
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const codeFormat = useSelector(selectCodeFormat)
  
  // State for optimization options
  const [optimize, setOptimize] = useState<boolean>(false)
  const [optimizationOptions, setOptimizationOptions] = useState<OptimizationOptions>({
    consolidateGates: true,
    cancelAdjacentGates: true,
    convertGateSequences: false,
    transpileToBackend: false,
    backendName: 'qasm_simulator',
    enableAdvancedOptimization: false,
    advancedOptions: defaultAdvancedOptions
  })
  
  const codeBg = useColorModeValue('gray.50', 'gray.800')
  const codeBorder = useColorModeValue('gray.200', 'gray.600')
  const optimizationBg = useColorModeValue('blue.50', 'blue.900')
  
  // Function to transform Redux store gates to Circuit gates
  const transformStoreGatesToCircuitGates = useCallback((storeGates: StoreGate[]): CircuitGate[] => {
    return storeGates.map(gate => {
      // Find the gate definition from the library
      const gateDef = gateLibrary.find(g => g.id === gate.type);
      
      if (!gateDef) {
        // If gate definition not found, create a generic one
        return {
          ...gate,
          name: gate.type,
          symbol: gate.type.substring(0, 2).toUpperCase(),
          description: 'Custom gate',
          category: 'Custom',
          color: 'gray'
        } as CircuitGate;
      }
      
      // Return a gate with properties from both the store gate and the gate definition
      return {
        ...gate,
        name: gateDef.name,
        symbol: gateDef.symbol,
        description: gateDef.description,
        category: gateDef.category,
        color: gateDef.color
      } as CircuitGate;
    });
  }, []);
  
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCodeFormat(e.target.value as 'qiskit' | 'cirq' | 'json'))
  }
  
  const handleCopyCode = () => {
    let code = ''
    
    if (codeFormat === 'qiskit' || codeFormat === 'cirq') {
      // Transform the gates to match expected type
      const circuitGates = transformStoreGatesToCircuitGates(gates);
      
      if (codeFormat === 'qiskit') {
        code = generateQiskitCode(qubits, circuitGates, optimize, optimizationOptions)
      } else {
        code = generateCirqCode(qubits, circuitGates, optimize, optimizationOptions)
      }
    } else if (codeFormat === 'json') {
      code = JSON.stringify({ qubits, gates }, null, 2)
    }
    
    navigator.clipboard.writeText(code)
      .then(() => {
        // Show success feedback
        setShowCopied(true)
        setTimeout(() => setShowCopied(false), 2000)
      })
      .catch(err => console.error('Failed to copy code:', err))
  }
  
  const handleOptimizationChange = (option: keyof OptimizationOptions, value: boolean | string) => {
    setOptimizationOptions({
      ...optimizationOptions,
      [option]: value
    })
  }
  
  // Handle advanced optimization options change
  const handleAdvancedOptionsChange = (advancedOptions: typeof defaultAdvancedOptions) => {
    setOptimizationOptions({
      ...optimizationOptions,
      advancedOptions
    });
  };
  
  const getGeneratedCode = () => {
    if (codeFormat === 'qiskit' || codeFormat === 'cirq') {
      // Transform the gates to match expected type
      const circuitGates = transformStoreGatesToCircuitGates(gates);
      
      if (codeFormat === 'qiskit') {
        return generateQiskitCode(qubits, circuitGates, optimize, optimizationOptions)
      } else {
        return generateCirqCode(qubits, circuitGates, optimize, optimizationOptions)
      }
    } else if (codeFormat === 'json') {
      return JSON.stringify({ qubits, gates }, null, 2)
    }
    return ''
  }
  
  // State for copy feedback
  const [showCopied, setShowCopied] = useState(false)
  
  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" mb={2}>
          <Heading size="md">Generated Code</Heading>
          <HStack>
            <Select size="sm" value={codeFormat} onChange={handleFormatChange} w="120px">
              <option value="qiskit">Qiskit</option>
              <option value="cirq">Cirq</option>
              <option value="json">JSON</option>
            </Select>
            <Button 
              size="sm" 
              colorScheme="blue" 
              onClick={handleCopyCode}
              position="relative"
            >
              {showCopied ? 'Copied!' : 'Copy Code'}
            </Button>
          </HStack>
        </HStack>
        
        {/* Optimization options section */}
        {codeFormat !== 'json' && (
          <Box 
            p={3} 
            borderRadius="md" 
            bg={optimizationBg} 
            mb={3}
          >
            <HStack justifyContent="space-between" mb={2}>
              <HStack>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="optimize-circuit" mb="0" fontSize="sm" fontWeight="medium">
                    Optimize Circuit
                  </FormLabel>
                  <Switch 
                    id="optimize-circuit" 
                    isChecked={optimize} 
                    onChange={(e) => setOptimize(e.target.checked)}
                    colorScheme="blue"
                  />
                </FormControl>
                <Tooltip 
                  label="Circuit optimization can reduce gate count and improve efficiency" 
                  placement="top"
                >
                  <Icon as={InfoIcon} color="blue.500" />
                </Tooltip>
              </HStack>
              
              {optimize && !optimizationOptions.enableAdvancedOptimization && (
                <Text fontSize="xs" color="blue.500">
                  {gates.length} gates → ~{Math.max(Math.floor(gates.length * 0.7), 1)} gates (est.)
                </Text>
              )}
            </HStack>
            
            <Collapse in={optimize} animateOpacity>
              <VStack align="stretch" spacing={2} mt={2}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="consolidate-gates" mb="0" fontSize="sm">
                    Consolidate Adjacent Gates
                  </FormLabel>
                  <Switch 
                    id="consolidate-gates" 
                    isChecked={optimizationOptions.consolidateGates} 
                    onChange={(e) => handleOptimizationChange('consolidateGates', e.target.checked)}
                    size="sm"
                    colorScheme="teal"
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="cancel-gates" mb="0" fontSize="sm">
                    Cancel Redundant Gates
                  </FormLabel>
                  <Switch 
                    id="cancel-gates" 
                    isChecked={optimizationOptions.cancelAdjacentGates} 
                    onChange={(e) => handleOptimizationChange('cancelAdjacentGates', e.target.checked)}
                    size="sm"
                    colorScheme="teal"
                  />
                </FormControl>
                
                {/* Add Gate Sequence conversion option */}
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="convert-sequences" mb="0" fontSize="sm">
                    Convert Gate Sequences
                  </FormLabel>
                  <Switch 
                    id="convert-sequences" 
                    isChecked={optimizationOptions.convertGateSequences} 
                    onChange={(e) => handleOptimizationChange('convertGateSequences', e.target.checked)}
                    size="sm"
                    colorScheme="teal"
                  />
                </FormControl>
                
                {codeFormat === 'qiskit' && (
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="transpile" mb="0" fontSize="sm">
                      Transpile to Backend
                    </FormLabel>
                    <Switch 
                      id="transpile" 
                      isChecked={optimizationOptions.transpileToBackend} 
                      onChange={(e) => handleOptimizationChange('transpileToBackend', e.target.checked)}
                      size="sm"
                      colorScheme="teal"
                    />
                  </FormControl>
                )}
                
                {codeFormat === 'qiskit' && optimizationOptions.transpileToBackend && (
                  <FormControl>
                    <FormLabel htmlFor="backend" fontSize="xs" mb={1}>
                      Target Backend
                    </FormLabel>
                    <Select 
                      id="backend" 
                      size="xs" 
                      value={optimizationOptions.backendName}
                      onChange={(e) => handleOptimizationChange('backendName', e.target.value)}
                    >
                      <option value="qasm_simulator">QASM Simulator</option>
                      <option value="statevector_simulator">Statevector Simulator</option>
                      <option value="aer_simulator">Aer Simulator</option>
                      <option value="fake_lagos">Fake IBM Lagos</option>
                      <option value="fake_manila">Fake IBM Manila</option>
                      <option value="fake_nairobi">Fake IBM Nairobi</option>
                    </Select>
                  </FormControl>
                )}
                
                {/* Advanced Optimization Toggle */}
                <Divider my={2} />
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel 
                    htmlFor="advanced-optimization" 
                    mb="0" 
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Advanced Optimization
                    <Tooltip 
                      label="Enable sophisticated optimization techniques like circuit synthesis, noise-aware optimization, and qubit mapping" 
                      placement="top"
                      hasArrow
                    >
                      <Icon as={InfoIcon} ml={1} color="blue.500" boxSize={3} />
                    </Tooltip>
                  </FormLabel>
                  <Switch 
                    id="advanced-optimization" 
                    isChecked={optimizationOptions.enableAdvancedOptimization} 
                    onChange={(e) => handleOptimizationChange('enableAdvancedOptimization', e.target.checked)}
                    size="sm"
                    colorScheme="purple"
                  />
                </FormControl>
                
                {/* Advanced Optimization Panel */}
                <AdvancedOptimizationPanel
                  isEnabled={optimize && (optimizationOptions.enableAdvancedOptimization ?? false)}
                  options={optimizationOptions.advancedOptions || defaultAdvancedOptions}
                  onChange={handleAdvancedOptionsChange}
                />
                
                <Text fontSize="xs" color="blue.600" mt={1}>
                  Note: Optimization may alter circuit behavior in some edge cases
                </Text>
              </VStack>
            </Collapse>
          </Box>
        )}
        
        <Box 
          p={4} 
          borderRadius="md" 
          bg={codeBg} 
          borderWidth={1} 
          borderColor={codeBorder}
          overflowX="auto"
          fontFamily="monospace"
          fontSize="sm"
          whiteSpace="pre"
          minH="300px"
          maxH="800px"
          position="relative"
          resize="vertical"
          overflow="auto"
          sx={{
            resize: 'vertical',
            '&::-webkit-resizer': {
              background: codeBorder,
              borderRadius: '2px'
            }
          }}
        >
          {gates.length === 0 ? (
            <Text color="gray.500" fontStyle="italic">
              Your circuit is empty. Drag and drop gates to generate code.
            </Text>
          ) : (
            getGeneratedCode()
          )}
        </Box>
        
        {/* Additional info about optimizations */}
        {optimize && codeFormat !== 'json' && gates.length > 0 && (
          <Box fontSize="sm" p={3} borderRadius="md" bg={codeBg} borderWidth={1} borderColor={codeBorder}>
            <Heading size="xs" mb={2}>Optimization Details</Heading>
            <Divider mb={2} />
            <VStack align="stretch" spacing={1}>
              <Text>
                <strong>Consolidate Adjacent Gates:</strong> Combines sequential gates of the same type on the same qubit.
              </Text>
              <Text>
                <strong>Cancel Redundant Gates:</strong> Removes pairs of gates that cancel each other (e.g., two X gates).
              </Text>
              <Text>
                <strong>Convert Gate Sequences:</strong> Replaces sequences of gates with equivalent simpler forms (e.g., H-Z-H → X).
              </Text>
              {codeFormat === 'qiskit' && (
                <Text>
                  <strong>Transpile to Backend:</strong> Optimizes circuit for specific quantum hardware or simulator.
                </Text>
              )}
              
              {optimizationOptions.enableAdvancedOptimization && (
                <>
                  <Divider my={2} />
                  <Heading size="xs" mb={1} color="purple.500">Advanced Optimization Features</Heading>
                  
                  {optimizationOptions.advancedOptions?.synthesisLevel !== 0 && (
                    <Text>
                      <strong>Circuit Synthesis:</strong> Auto-discovers efficient implementations using mathematical equivalence.
                    </Text>
                  )}
                  
                  {optimizationOptions.advancedOptions?.noiseAware && (
                    <Text>
                      <strong>Noise-Aware Optimization:</strong> Tailors circuits to reduce errors on specific quantum hardware.
                    </Text>
                  )}
                  
                  {optimizationOptions.advancedOptions?.depthReduction && (
                    <Text>
                      <strong>Depth Reduction:</strong> Parallelizes operations to minimize circuit runtime.
                    </Text>
                  )}
                  
                  {optimizationOptions.advancedOptions?.qubitMapping && (
                    <Text>
                      <strong>Qubit Mapping:</strong> Optimally arranges logical qubits on physical hardware topology.
                    </Text>
                  )}
                </>
              )}
              
              <Text fontSize="xs" color="gray.500" mt={1}>
                The generated code includes both optimized and unoptimized circuits for comparison.
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default CodePanel