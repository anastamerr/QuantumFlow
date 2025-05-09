import {
    Box,
    Heading,
    VStack,
    FormControl,
    FormLabel,
    Switch,
    Select,
    Radio,
    RadioGroup,
    Stack,
    Text,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Divider,
    Tooltip,
    HStack,
    Badge,
    useColorModeValue,
    Collapse,
    Button,
    Icon
  } from '@chakra-ui/react';
  import { InfoIcon } from '@chakra-ui/icons';
  import { useSelector } from 'react-redux';
  import { useState, useEffect } from 'react';
  import { selectQubits, selectGates, Gate as StoreGate } from '../../store/slices/circuitSlice';
  import { Gate as CircuitGate } from '../../types/circuit';
  import { 
    AdvancedOptimizationOptions, 
    defaultAdvancedOptions,
    hardwareModels,
    estimateOptimizationImpact,
    calculateCircuitDepth
  } from '../../utils/circuitOptimizer';
  import { gateLibrary } from '../../utils/gateLibrary';
  
  interface AdvancedOptimizationPanelProps {
    isEnabled: boolean;
    options: AdvancedOptimizationOptions;
    onChange: (options: AdvancedOptimizationOptions) => void;
  }
  
  /**
   * Panel for configuring advanced circuit optimization options
   */
  const AdvancedOptimizationPanel: React.FC<AdvancedOptimizationPanelProps> = ({
    isEnabled,
    options,
    onChange
  }) => {
    const qubits = useSelector(selectQubits);
    const storeGates = useSelector(selectGates);
    
    // Transform store gates to circuit gates to match the expected type for circuit optimizer
    const gates: CircuitGate[] = storeGates.map(gate => {
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
    
    const [currentOptions, setCurrentOptions] = useState<AdvancedOptimizationOptions>(options);
    
    // Color mode values
    const sectionBg = useColorModeValue('blue.50', 'blue.900');
    const highlightBg = useColorModeValue('green.50', 'green.900');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    
    // Apply changes to options and notify parent
    const handleOptionChange = <K extends keyof AdvancedOptimizationOptions>(
      option: K, 
      value: AdvancedOptimizationOptions[K]
    ) => {
      const newOptions = {
        ...currentOptions,
        [option]: value
      };
      setCurrentOptions(newOptions);
      onChange(newOptions);
    };
    
    // Calculate optimization impact using the properly transformed gates
    const impactEstimation = estimateOptimizationImpact(gates, qubits, currentOptions);
    
    // Effect to reset options when isEnabled changes
    useEffect(() => {
      if (!isEnabled) {
        // Reset to defaults when disabled
        setCurrentOptions(defaultAdvancedOptions);
        onChange(defaultAdvancedOptions);
      }
    }, [isEnabled, onChange]);
    
    // If not enabled, don't render
    if (!isEnabled) return null;
    
    // Calculate current circuit depth once
    const currentDepth = calculateCircuitDepth(gates);
    
    return (
      <Box 
        mt={4} 
        p={3}
        borderRadius="md"
        borderWidth={1}
        borderColor={borderColor}
        bg={sectionBg}
      >
        <VStack spacing={4} align="stretch">
          <Heading size="sm">Advanced Optimization Options</Heading>
          
          {gates.length === 0 ? (
            <Text color="orange.500" fontSize="sm">
              Add gates to your circuit to enable advanced optimization features.
            </Text>
          ) : (
            <>
              {/* Circuit Synthesis Options */}
              <Box>
                <FormControl>
                  <FormLabel 
                    fontSize="sm" 
                    fontWeight="medium"
                    display="flex" 
                    alignItems="center"
                  >
                    Circuit Synthesis Level
                    <Tooltip 
                      label="Automatically find more efficient representations of quantum circuits" 
                      placement="top"
                      hasArrow
                    >
                      <Icon as={InfoIcon} ml={1} color="blue.500" boxSize={3} />
                    </Tooltip>
                  </FormLabel>
                  <RadioGroup 
                    value={currentOptions.synthesisLevel.toString()} 
                    onChange={(value) => handleOptionChange('synthesisLevel', parseInt(value) as 0 | 1 | 2 | 3)}
                    size="sm"
                  >
                    <Stack direction="column" spacing={1}>
                      <Radio value="0">None</Radio>
                      <Radio value="1">Basic (Gate cancellation)</Radio>
                      <Radio value="2">Medium (Sequence optimization)</Radio>
                      <Radio value="3">Aggressive (Full synthesis)</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
              </Box>
              
              {/* Noise-Aware Optimization */}
              <Box>
                <FormControl display="flex" alignItems="center" mb={2}>
                  <FormLabel mb="0" fontSize="sm" fontWeight="medium">
                    Noise-Aware Optimization
                    <Tooltip 
                      label="Tailor circuits to specific quantum hardware characteristics" 
                      placement="top"
                      hasArrow
                    >
                      <Icon as={InfoIcon} ml={1} color="blue.500" boxSize={3} />
                    </Tooltip>
                  </FormLabel>
                  <Switch 
                    isChecked={currentOptions.noiseAware} 
                    onChange={(e) => handleOptionChange('noiseAware', e.target.checked)}
                    colorScheme="green"
                    size="sm"
                  />
                </FormControl>
                
                <Collapse in={currentOptions.noiseAware} animateOpacity>
                  <Box pl={4} mt={2}>
                    <FormControl mb={2}>
                      <FormLabel fontSize="xs">Target Hardware Model</FormLabel>
                      <Select 
                        size="xs" 
                        value={currentOptions.hardwareModel}
                        onChange={(e) => handleOptionChange('hardwareModel', e.target.value)}
                      >
                        {Object.entries(hardwareModels).map(([key, model]) => (
                          <option key={key} value={key}>{model.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Text fontSize="xs" color="gray.500">
                      Reduces noise impact by optimizing for specific hardware topology
                    </Text>
                  </Box>
                </Collapse>
              </Box>
              
              {/* Circuit Depth Reduction */}
              <Box>
                <FormControl display="flex" alignItems="center" mb={2}>
                  <FormLabel mb="0" fontSize="sm" fontWeight="medium">
                    Circuit Depth Reduction
                    <Tooltip 
                      label="Minimize circuit runtime by parallelizing gates when possible" 
                      placement="top"
                      hasArrow
                    >
                      <Icon as={InfoIcon} ml={1} color="blue.500" boxSize={3} />
                    </Tooltip>
                  </FormLabel>
                  <Switch 
                    isChecked={currentOptions.depthReduction} 
                    onChange={(e) => handleOptionChange('depthReduction', e.target.checked)}
                    colorScheme="green"
                    size="sm"
                  />
                </FormControl>
                
                <Collapse in={currentOptions.depthReduction} animateOpacity>
                  <Box pl={4} mt={2}>
                    <FormControl mb={2}>
                      <FormLabel fontSize="xs">Maximum Circuit Depth</FormLabel>
                      <NumberInput 
                        size="xs"
                        value={currentOptions.maxDepth ?? ''} 
                        onChange={(_, valueAsNumber) => handleOptionChange('maxDepth', valueAsNumber || undefined)}
                        min={1}
                      >
                        <NumberInputField placeholder="No limit" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    {currentDepth > 0 && (
                      <Text fontSize="xs" color="gray.500">
                        Current circuit depth: {currentDepth}
                      </Text>
                    )}
                  </Box>
                </Collapse>
              </Box>
              
              {/* Qubit Mapping */}
              <Box>
                <FormControl display="flex" alignItems="center" mb={2}>
                  <FormLabel mb="0" fontSize="sm" fontWeight="medium">
                    Automatic Qubit Mapping
                    <Tooltip 
                      label="Map logical qubits to physical hardware topology" 
                      placement="top"
                      hasArrow
                    >
                      <Icon as={InfoIcon} ml={1} color="blue.500" boxSize={3} />
                    </Tooltip>
                  </FormLabel>
                  <Switch 
                    isChecked={currentOptions.qubitMapping} 
                    onChange={(e) => handleOptionChange('qubitMapping', e.target.checked)}
                    colorScheme="green"
                    size="sm"
                  />
                </FormControl>
                
                <Collapse in={currentOptions.qubitMapping} animateOpacity>
                  <Box pl={4} mt={2}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0" fontSize="xs">Preserve Original Layout</FormLabel>
                      <Switch 
                        isChecked={currentOptions.preserveLayout} 
                        onChange={(e) => handleOptionChange('preserveLayout', e.target.checked)}
                        size="xs"
                        colorScheme="blue"
                      />
                    </FormControl>
                    
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Tries to maintain original qubit relationships when mapping to hardware
                    </Text>
                  </Box>
                </Collapse>
              </Box>
              
              <Divider />
              
              {/* Optimization Impact Estimate */}
              <Box 
                p={2} 
                borderRadius="md" 
                bg={highlightBg}
              >
                <Heading size="xs" mb={2}>Estimated Optimization Impact</Heading>
                <HStack spacing={4} justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="gray.500">GATES</Text>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium">{impactEstimation.originalGateCount}</Text>
                      <Text fontSize="sm">→</Text>
                      <Text fontSize="sm" fontWeight="medium">{impactEstimation.estimatedGateCount}</Text>
                    </HStack>
                  </VStack>
                  
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="gray.500">DEPTH</Text>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium">{impactEstimation.originalDepth}</Text>
                      <Text fontSize="sm">→</Text>
                      <Text fontSize="sm" fontWeight="medium">{impactEstimation.estimatedDepth}</Text>
                    </HStack>
                  </VStack>
                  
                  <Badge 
                    colorScheme={impactEstimation.reductionPercentage > 0 ? "green" : "red"} 
                    variant="solid" 
                    borderRadius="md"
                    px={2}
                    py={1}
                  >
                    {impactEstimation.reductionPercentage > 0 ? "-" : "+"}
                    {Math.abs(impactEstimation.reductionPercentage)}% Gates
                  </Badge>
                </HStack>
              </Box>
              
              <Button 
                size="xs" 
                variant="outline" 
                colorScheme="blue"
                onClick={() => {
                  setCurrentOptions(defaultAdvancedOptions);
                  onChange(defaultAdvancedOptions);
                }}
              >
                Reset to Defaults
              </Button>
              
              <Text fontSize="xs" fontStyle="italic" color="gray.500">
                Note: Actual optimization results may vary when executed on real quantum hardware.
              </Text>
            </>
          )}
        </VStack>
      </Box>
    );
  };
  
  export default AdvancedOptimizationPanel;