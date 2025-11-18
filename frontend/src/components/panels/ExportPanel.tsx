import { 
  Box, 
  Heading, 
  VStack, 
  Button, 
  useColorModeValue, 
  Radio, 
  RadioGroup, 
  Stack, 
  Text, 
  useToast, 
  Divider, 
  Switch, 
  FormControl, 
  FormLabel, 
  Collapse,
  Select,
  Icon,
  Tooltip,
  HStack,
  Badge,
  Input,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { selectQubits, selectGates, selectCircuitName, selectCircuitDescription, Gate as StoreGate } from '../../store/slices/circuitSlice'
import { useState, useRef, useMemo, useCallback } from 'react'
import { generateQiskitCode, generateCirqCode, OptimizationOptions } from '../../utils/codeGenerator'
import { InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { renderCircuitSvg } from '../../utils/circuitRenderer'
import { gateLibrary } from '../../utils/gateLibrary'
import { Gate as CircuitGate } from '../../types/circuit'
import AdvancedOptimizationPanel from './AdvancedOptimizationPanel'
import { defaultAdvancedOptions, estimateOptimizationImpact } from '../../utils/circuitOptimizer'
import FullViewToggle from '../common/FullViewToggle'

const ExportPanel = () => {
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const circuitName = useSelector(selectCircuitName)
  const circuitDescription = useSelector(selectCircuitDescription)
  const [exportFormat, setExportFormat] = useState<string>('json')
  const toast = useToast()
  
  // Alert dialog for error handling
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  
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
  
  // State for custom backend
  const [customBackend, setCustomBackend] = useState<string>('')
  const [showCustomBackend, setShowCustomBackend] = useState<boolean>(false)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const optimizationBg = useColorModeValue('blue.50', 'blue.900')
  
  // Function to transform Redux gates to Circuit gates
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
  
  // Generate the export data based on the selected format
  const getExportData = useCallback((): string => {
    // Apply the custom backend name if selected
    const options = {
      ...optimizationOptions,
      backendName: showCustomBackend ? customBackend : optimizationOptions.backendName
    }
    
    // Transform the gates for formats that need CircuitGate type
    const circuitGates = transformStoreGatesToCircuitGates(gates);
    
    switch (exportFormat) {
      case 'json':
        return JSON.stringify({
          name: circuitName,
          description: circuitDescription,
          qubits,
          gates, // Use original gates for JSON
        }, null, 2)
      case 'qiskit':
        return generateQiskitCode(qubits, circuitGates, optimize, options)
      case 'cirq':
        return generateCirqCode(qubits, circuitGates, optimize, options)
      case 'svg':
        try {
          // Actually generate SVG instead of placeholder
          return renderCircuitSvg(qubits, circuitGates)
        } catch (err) {
          console.error('Error generating SVG:', err)
          return '<!-- Error generating SVG: ' + (err instanceof Error ? err.message : String(err)) + ' -->'
        }
      default:
        return ''
    }
  }, [
    exportFormat, 
    qubits, 
    gates, 
    circuitName, 
    circuitDescription, 
    optimize, 
    optimizationOptions,
    customBackend,
    showCustomBackend,
    transformStoreGatesToCircuitGates
  ])
  
  // Handle export button click
  const handleExport = () => {
    try {
      const data = getExportData()
      let filename = ''
      let mimeType = ''
      
      // Set filename and MIME type based on format
      switch (exportFormat) {
        case 'json':
          filename = `${circuitName.replace(/\s+/g, '_')}.json`
          mimeType = 'application/json'
          break
        case 'qiskit':
        case 'cirq':
          filename = `${circuitName.replace(/\s+/g, '_')}.py`
          mimeType = 'text/plain'
          break
        case 'svg':
          filename = `${circuitName.replace(/\s+/g, '_')}.svg`
          mimeType = 'image/svg+xml'
          break
        default:
          filename = `${circuitName.replace(/\s+/g, '_')}.txt`
          mimeType = 'text/plain'
      }
      
      // Create a download link
      const blob = new Blob([data], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Show success toast
      toast({
        title: 'Export successful',
        description: `Circuit exported as ${filename}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error('Export failed:', err)
      setErrorMessage((err instanceof Error) ? err.message : 'Unknown error during export.')
      onOpen()
    }
  }
  
  // Calculate estimated gate reduction - using the estimator from circuitOptimizer for advanced options
  const reductionInfo = useMemo(() => {
    if (!optimize || gates.length === 0) return null
    
    if (optimizationOptions.enableAdvancedOptimization && optimizationOptions.advancedOptions) {
      const circuitGates = transformStoreGatesToCircuitGates(gates);
      return estimateOptimizationImpact(circuitGates, qubits, optimizationOptions.advancedOptions);
    }
    
    // For basic optimization, use the existing calculation
    // Map of gate types for smarter analysis
    const gateTypes = gates.reduce((acc, gate) => {
      acc[gate.type] = (acc[gate.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Count potentially redundant gates (X, H, Z)
    const redundantGates = (gateTypes['x'] || 0) + (gateTypes['h'] || 0) + (gateTypes['z'] || 0)
    
    // Calculate a more realistic reduction based on circuit composition
    let reductionFactor = 1.0
    
    if (optimizationOptions.cancelAdjacentGates) {
      // Estimate redundant gates that could be canceled (more realistic than fixed %)
      const potentialCancelations = Math.floor(redundantGates / 2) * 2
      reductionFactor -= (potentialCancelations / Math.max(gates.length, 1)) * 0.8
    }
    
    if (optimizationOptions.consolidateGates) {
      // Look for rotation gates that might be consolidated
      const rotationGates = (gateTypes['rx'] || 0) + (gateTypes['ry'] || 0) + (gateTypes['rz'] || 0)
      reductionFactor -= (rotationGates / Math.max(gates.length, 1)) * 0.3
    }
    
    if (optimizationOptions.convertGateSequences) {
      // Rough estimate of potential sequence conversions
      reductionFactor -= 0.05
    }
    
    if (optimizationOptions.transpileToBackend) {
      // Backend-specific optimizations vary but are typically significant
      reductionFactor -= 0.15
    }
    
    // Ensure we don't predict more than 75% reduction
    reductionFactor = Math.max(reductionFactor, 0.25)
    
    // Calculate estimated gates after optimization
    const estimatedGates = Math.max(Math.floor(gates.length * reductionFactor), 1)
    return {
      original: gates.length,
      optimized: estimatedGates,
      reductionPercent: Math.round((1 - reductionFactor) * 100),
      originalDepth: 0, // Not calculated for basic optimization
      estimatedDepth: 0
    }
  }, [gates, qubits, optimize, optimizationOptions])
  
  return (
    <Box h="100%" overflowY="auto" overflowX="hidden" pr={{ base: 0, md: 1 }}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Export Circuit</Heading>
        <FullViewToggle />
      </HStack>
      
      <VStack spacing={4} align="stretch">
        <Box 
          p={4} 
          borderRadius="md" 
          bg={bg} 
          borderWidth={1} 
          borderColor={borderColor}
        >
          <Heading size="sm" mb={3}>Export Format</Heading>
          
          <RadioGroup onChange={setExportFormat} value={exportFormat}>
            <Stack direction="column" spacing={2}>
              <Radio value="json" aria-label="Export as JSON">JSON (Circuit Design)</Radio>
              <Radio value="qiskit" aria-label="Export as Qiskit Python code">Qiskit Python Code</Radio>
              <Radio value="cirq" aria-label="Export as Cirq Python code">Cirq Python Code</Radio>
              <Radio value="svg" aria-label="Export as SVG diagram">SVG (Circuit Diagram)</Radio>
            </Stack>
          </RadioGroup>
        </Box>
        
        {/* Optimization options section - only show for code exports */}
        {(exportFormat === 'qiskit' || exportFormat === 'cirq') && (
          <Box 
            p={3} 
            borderRadius="md" 
            bg={optimizationBg}
          >
            <HStack justifyContent="space-between" mb={2}>
              <HStack>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="optimize-export" mb="0" fontSize="sm" fontWeight="medium">
                    Optimize Circuit
                  </FormLabel>
                  <Switch 
                    id="optimize-export" 
                    isChecked={optimize} 
                    onChange={(e) => setOptimize(e.target.checked)}
                    colorScheme="blue"
                    aria-label="Enable circuit optimization"
                  />
                </FormControl>
                <Tooltip 
                  label="Circuit optimization can reduce gate count and improve efficiency" 
                  placement="top"
                  aria-label="Information about circuit optimization"
                >
                  <Icon as={InfoIcon} color="blue.500" />
                </Tooltip>
              </HStack>
              
              {reductionInfo && (
                <Badge colorScheme="green" variant="subtle" px={2} py={1}>
                  {('reductionPercent' in reductionInfo 
                    ? reductionInfo.reductionPercent 
                    : reductionInfo.reductionPercentage)}% fewer gates
                </Badge>
              )}
            </HStack>
            
            <Collapse in={optimize} animateOpacity>
              <VStack align="stretch" spacing={2} mt={2}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="consolidate-gates-export" mb="0" fontSize="sm">
                    Consolidate Adjacent Gates
                  </FormLabel>
                  <Switch 
                    id="consolidate-gates-export" 
                    isChecked={optimizationOptions.consolidateGates} 
                    onChange={(e) => handleOptimizationChange('consolidateGates', e.target.checked)}
                    size="sm"
                    colorScheme="teal"
                    aria-label="Consolidate adjacent gates"
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="cancel-gates-export" mb="0" fontSize="sm">
                    Cancel Redundant Gates
                  </FormLabel>
                  <Switch 
                    id="cancel-gates-export" 
                    isChecked={optimizationOptions.cancelAdjacentGates} 
                    onChange={(e) => handleOptimizationChange('cancelAdjacentGates', e.target.checked)}
                    size="sm"
                    colorScheme="teal"
                    aria-label="Cancel redundant gates"
                  />
                </FormControl>
                
                {/* Added missing gate sequence option */}
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="convert-sequences-export" mb="0" fontSize="sm">
                    Convert Gate Sequences
                  </FormLabel>
                  <Switch 
                    id="convert-sequences-export" 
                    isChecked={optimizationOptions.convertGateSequences} 
                    onChange={(e) => handleOptimizationChange('convertGateSequences', e.target.checked)}
                    size="sm"
                    colorScheme="teal"
                    aria-label="Convert gate sequences to simpler forms"
                  />
                </FormControl>
                
                {exportFormat === 'qiskit' && (
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="transpile-export" mb="0" fontSize="sm">
                      Transpile to Backend
                    </FormLabel>
                    <Switch 
                      id="transpile-export" 
                      isChecked={optimizationOptions.transpileToBackend} 
                      onChange={(e) => handleOptimizationChange('transpileToBackend', e.target.checked)}
                      size="sm"
                      colorScheme="teal"
                      aria-label="Transpile circuit to backend"
                    />
                  </FormControl>
                )}
                
                {exportFormat === 'qiskit' && optimizationOptions.transpileToBackend && (
                  <FormControl>
                    <FormLabel htmlFor="backend-export" fontSize="xs" mb={1}>
                      Target Backend
                    </FormLabel>
                    <HStack>
                      <Select 
                        id="backend-export" 
                        size="xs" 
                        value={showCustomBackend ? 'custom' : optimizationOptions.backendName}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setShowCustomBackend(true)
                          } else {
                            setShowCustomBackend(false)
                            handleOptimizationChange('backendName', e.target.value)
                          }
                        }}
                        aria-label="Select backend for transpilation"
                      >
                        <option value="qasm_simulator">QASM Simulator</option>
                        <option value="statevector_simulator">Statevector Simulator</option>
                        <option value="aer_simulator">Aer Simulator</option>
                        <option value="fake_lagos">Fake IBM Lagos</option>
                        <option value="fake_manila">Fake IBM Manila</option>
                        <option value="fake_nairobi">Fake IBM Nairobi</option>
                        <option value="custom">Custom Backend</option>
                      </Select>
                    </HStack>
                    
                    {/* Custom backend input */}
                    {showCustomBackend && (
                      <Input 
                        mt={1}
                        size="xs"
                        placeholder="Enter custom backend name"
                        value={customBackend}
                        onChange={(e) => setCustomBackend(e.target.value)}
                        aria-label="Custom backend name"
                      />
                    )}
                  </FormControl>
                )}
                
                {/* Advanced Optimization Toggle */}
                <Divider my={2} />
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel 
                    htmlFor="advanced-optimization-export" 
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
                    id="advanced-optimization-export" 
                    isChecked={optimizationOptions.enableAdvancedOptimization} 
                    onChange={(e) => handleOptimizationChange('enableAdvancedOptimization', e.target.checked)}
                    size="sm"
                    colorScheme="purple"
                  />
                </FormControl>
                
                {/* Advanced Optimization Panel */}
                <AdvancedOptimizationPanel
                  isEnabled={optimize && (optimizationOptions.enableAdvancedOptimization || false)}
                  options={optimizationOptions.advancedOptions || defaultAdvancedOptions}
                  onChange={handleAdvancedOptionsChange}
                />
                
                {reductionInfo && (
                  <Box fontSize="xs" mt={1}>
                    <Text color="blue.600">
                      Estimated gate count: {
                        'original' in reductionInfo 
                          ? `${reductionInfo.original} → ${reductionInfo.optimized}` 
                          : `${reductionInfo.originalGateCount} → ${reductionInfo.estimatedGateCount}`
                      }
                    </Text>
                    {optimizationOptions.enableAdvancedOptimization && reductionInfo.originalDepth > 0 && (
                      <Text color="blue.600">
                        Estimated circuit depth: {reductionInfo.originalDepth} → {reductionInfo.estimatedDepth}
                      </Text>
                    )}
                    <Text color="gray.500" fontSize="xs" mt={1}>
                      Actual results may vary based on specific circuit structure
                    </Text>
                  </Box>
                )}
              </VStack>
            </Collapse>
          </Box>
        )}
        
        <Box 
          p={4} 
          borderRadius="md" 
          bg={bg} 
          borderWidth={1} 
          borderColor={borderColor}
        >
          <Heading size="sm" mb={3}>Circuit Information</Heading>
          
          <Text><strong>Name:</strong> {circuitName}</Text>
          {circuitDescription && (
            <Text><strong>Description:</strong> {circuitDescription}</Text>
          )}
          <Divider my={2} />
          <Text><strong>Qubits:</strong> {qubits.length}</Text>
          <Text><strong>Gates:</strong> {gates.length}</Text>
          
          {optimize && (exportFormat === 'qiskit' || exportFormat === 'cirq') && (
            <Box mt={3} p={2} borderRadius="md" bg={optimizationBg}>
              {optimizationOptions.enableAdvancedOptimization ? (
                <>
                  <Heading size="xs" mb={1}>Advanced Optimization Applied</Heading>
                  <Text fontSize="sm">
                    {optimizationOptions.advancedOptions?.synthesisLevel !== 0 && '• Circuit Synthesis '}
                    {optimizationOptions.advancedOptions?.noiseAware && '• Noise-Aware Optimization '}
                    {optimizationOptions.advancedOptions?.depthReduction && '• Depth Reduction '}
                    {optimizationOptions.advancedOptions?.qubitMapping && '• Qubit Mapping'}
                  </Text>
                </>
              ) : (
                <Text color="green.500" fontSize="sm">
                  <strong>Optimized Gates:</strong> ~{reductionInfo ? ('optimized' in reductionInfo ? reductionInfo.optimized : reductionInfo.estimatedGateCount) : ''} (estimated)
                </Text>
              )}
            </Box>
          )}
        </Box>
        
        <Button 
          colorScheme="blue" 
          onClick={handleExport}
          isDisabled={gates.length === 0}
          leftIcon={<span>📥</span>}
          aria-label="Export circuit"
        >
          Export Circuit
        </Button>
        
        {gates.length === 0 && (
          <Text color="orange.500" fontSize="sm">
            Your circuit is empty. Add gates to enable export.
          </Text>
        )}
      </VStack>
      
      {/* Error Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              <HStack>
                <WarningIcon color="red.500" />
                <Text>Export Error</Text>
              </HStack>
            </AlertDialogHeader>

            <AlertDialogBody>
              {errorMessage}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default ExportPanel