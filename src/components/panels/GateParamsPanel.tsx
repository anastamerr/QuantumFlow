import { Box, Heading, VStack, FormControl, FormLabel, Input, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Select, Button, useColorModeValue, Text, useToast, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { selectSelectedGateId, selectShowGateParams, toggleGateParams } from '../../store/slices/uiSlice'
import { selectGates, updateGate, selectQubits } from '../../store/slices/circuitSlice'
import { useState, useEffect, useCallback } from 'react'
import { gateLibrary } from '../../utils/gateLibrary'

const GateParamsPanel = () => {
  const dispatch = useDispatch()
  const toast = useToast()
  const selectedGateId = useSelector(selectSelectedGateId)
  const showGateParams = useSelector(selectShowGateParams)
  const gates = useSelector(selectGates)
  const qubits = useSelector(selectQubits)
  const [params, setParams] = useState<Record<string, number | string>>({})
  const [targets, setTargets] = useState<number[]>([])
  const [controls, setControls] = useState<number[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  // Find the selected gate
  const selectedGate = gates.find(gate => gate.id === selectedGateId)
  
  // Find the gate definition from the library
  const gateDefinition = selectedGate 
    ? gateLibrary.find(g => g.id === selectedGate.type)
    : null
  
  // Update local state when selected gate changes
  useEffect(() => {
    if (selectedGate) {
      // Set params
      if (selectedGate.params) {
        setParams({ ...selectedGate.params })
      } else {
        setParams({})
      }
      
      // Set targets
      if (selectedGate.targets) {
        setTargets([...selectedGate.targets])
      } else {
        setTargets([])
      }
      
      // Set controls
      if (selectedGate.controls) {
        setControls([...selectedGate.controls])
      } else {
        setControls([])
      }
      
      setIsUpdating(false)
    } else {
      setParams({})
      setTargets([])
      setControls([])
    }
  }, [selectedGate])
  
  // Debounced update function to prevent too many redux updates
  const updateGateWithDebounce = useCallback((updates: any) => {
    setIsUpdating(true)
    
    // Check if gate still exists before updating
    const gateExists = gates.some(g => g.id === selectedGateId)
    if (!gateExists) {
      toast({
        title: "Gate not found",
        description: "The selected gate no longer exists.",
        status: "error",
        duration: 2000,
      })
      return
    }
    
    try {
      if (selectedGateId) {
        dispatch(updateGate({
          id: selectedGateId,
          updates
        }))
      }
    } catch (error) {
      console.error("Error updating gate:", error)
      toast({
        title: "Update Failed",
        description: "Could not update gate parameters.",
        status: "error",
        duration: 3000,
      })
    } finally {
      setIsUpdating(false)
    }
  }, [dispatch, selectedGateId, gates, toast])
  
  // Handle parameter change
  const handleParamChange = (name: string, value: number | string) => {
    const newParams = { ...params, [name]: value }
    setParams(newParams)
    
    updateGateWithDebounce({ params: newParams })
  }
  
  // Handle target change
  const handleTargetChange = (index: number, value: number) => {
    // Validate that target is not the same as control or current qubit
    if (selectedGate && selectedGate.qubit === value) {
      toast({
        title: "Invalid Target",
        description: "Target qubit cannot be the same as the control qubit.",
        status: "warning",
        duration: 3000,
      })
      return
    }
    
    if (controls.includes(value)) {
      toast({
        title: "Invalid Target",
        description: "Target qubit cannot be the same as a control qubit.",
        status: "warning",
        duration: 3000,
      })
      return
    }
    
    const newTargets = [...targets]
    newTargets[index] = value
    setTargets(newTargets)
    
    updateGateWithDebounce({ targets: newTargets })
  }
  
  // Handle control change
  const handleControlChange = (index: number, value: number) => {
    // Validate that control is not the same as target
    if (targets.includes(value)) {
      toast({
        title: "Invalid Control",
        description: "Control qubit cannot be the same as a target qubit.",
        status: "warning",
        duration: 3000,
      })
      return
    }
    
    // Also validate it's not the same as the primary qubit (if applicable)
    if (selectedGate && selectedGate.qubit === value) {
      toast({
        title: "Invalid Control",
        description: "Control qubit cannot be the same as the main qubit.",
        status: "warning",
        duration: 3000,
      })
      return
    }
    
    const newControls = [...controls]
    newControls[index] = value
    setControls(newControls)
    
    updateGateWithDebounce({ controls: newControls })
  }
  
  // Handle panel close
  const handleClose = () => {
    dispatch(toggleGateParams())
  }
  
  // If no gate is selected or panel is hidden, return null
  if (!selectedGate || !gateDefinition || !showGateParams) {
    return null
  }
  
  // Generate color for gate based on gate definition
  const gateTypeColor = gateDefinition.color || 'gray'
  
  return (
    <Box
      w="300px"
      h="100%"
      bg={bg}
      p={4}
      borderLeftWidth={1}
      borderColor={borderColor}
      overflowY="auto"
    >
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="md">Gate Parameters</Heading>
          <Button size="sm" onClick={handleClose}>Close</Button>
        </Box>
        
        <Box
          p={3}
          borderWidth={1}
          borderRadius="md"
          borderColor={borderColor}
          bg={useColorModeValue(`${gateTypeColor}.50`, `${gateTypeColor}.900`)}
        >
          <Heading size="sm" mb={2}>{gateDefinition.name}</Heading>
          <Text fontSize="sm">{gateDefinition.description}</Text>
        </Box>
        
        {/* Gate Params Section */}
        {gateDefinition.params && gateDefinition.params.length > 0 ? (
          <VStack spacing={4} align="stretch">
            <Heading size="sm">Parameters</Heading>
            {gateDefinition.params.map(param => (
              <FormControl key={param.name}>
                <FormLabel>{param.name}</FormLabel>
                
                {param.type === 'number' && (
                  <NumberInput
                    value={params[param.name] !== undefined ? Number(params[param.name]) : Number(param.default)}
                    min={param.min}
                    max={param.max}
                    step={param.step || 1}
                    onChange={(_, valueAsNumber) => handleParamChange(param.name, valueAsNumber)}
                    isDisabled={isUpdating}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                )}
                
                {param.type === 'angle' && (
                  <>
                    <Slider
                      value={Number(params[param.name] !== undefined ? params[param.name] : param.default)}
                      min={param.min || 0}
                      max={param.max || 360}
                      step={param.step || 1}
                      onChange={(val) => handleParamChange(param.name, val)}
                      isDisabled={isUpdating}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg={`${gateTypeColor}.500`} />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <Text textAlign="right" fontSize="sm">
                      {params[param.name] !== undefined ? params[param.name] : param.default}°
                    </Text>
                  </>
                )}
                
                {param.type === 'select' && param.options && (
                  <Select
                    value={params[param.name] !== undefined ? String(params[param.name]) : String(param.default)}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    isDisabled={isUpdating}
                  >
                    {param.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                )}
              </FormControl>
            ))}
          </VStack>
        ) : (
          <Text>This gate has no configurable parameters.</Text>
        )}
        
        {/* Multi-qubit gate connections section */}
        {((gateDefinition.targets && gateDefinition.targets > 0) || 
          (gateDefinition.controls && gateDefinition.controls > 0)) && (
          <Box mt={4}>
            <Heading size="sm" mb={2}>Qubit Connections</Heading>
            
            {/* Target qubit selectors */}
            {gateDefinition.targets && gateDefinition.targets > 0 && (
              <VStack align="stretch" spacing={2} mt={2}>
                <Text fontSize="sm" fontWeight="medium">Target Qubits:</Text>
                {Array.from({ length: gateDefinition.targets }).map((_, index) => (
                  <Select
                    key={`target-${index}`}
                    size="sm"
                    value={targets[index] !== undefined ? targets[index] : 0}
                    onChange={(e) => handleTargetChange(index, parseInt(e.target.value))}
                    isDisabled={isUpdating || qubits.length <= 1}
                  >
                    {qubits.map((qubit) => (
                      <option key={qubit.id} value={qubit.id}>
                        {qubit.name}
                      </option>
                    ))}
                  </Select>
                ))}
                {qubits.length <= 1 && (
                  <Text fontSize="xs" color="red.500">
                    Need at least 2 qubits for multi-qubit gates
                  </Text>
                )}
              </VStack>
            )}
            
            {/* Control qubit selectors */}
            {gateDefinition.controls && gateDefinition.controls > 0 && (
              <VStack align="stretch" spacing={2} mt={2}>
                <Text fontSize="sm" fontWeight="medium">Control Qubits:</Text>
                {Array.from({ length: gateDefinition.controls }).map((_, index) => (
                  <Select
                    key={`control-${index}`}
                    size="sm"
                    value={controls[index] !== undefined ? controls[index] : 0}
                    onChange={(e) => handleControlChange(index, parseInt(e.target.value))}
                    isDisabled={isUpdating || qubits.length <= 1}
                  >
                    {qubits.map((qubit) => (
                      <option key={qubit.id} value={qubit.id}>
                        {qubit.name}
                      </option>
                    ))}
                  </Select>
                ))}
                {qubits.length <= 1 && (
                  <Text fontSize="xs" color="red.500">
                    Need at least 2 qubits for controlled gates
                  </Text>
                )}
              </VStack>
            )}
            
            {/* Warning for target/control overlap */}
            {targets.length > 0 && controls.length > 0 && (
              <Text fontSize="xs" color="orange.500" mt={2}>
                Make sure control and target qubits are different
              </Text>
            )}
          </Box>
        )}
        
        {/* Quick help section */}
        <Box 
          mt={4} 
          p={3} 
          borderRadius="md" 
          bg={useColorModeValue("gray.50", "gray.700")}
          fontSize="sm"
        >
          <Text fontWeight="medium" mb={2}>Gate Info:</Text>
          <Text>Type: {gateDefinition.name}</Text>
          <Text>Category: {gateDefinition.category}</Text>
          
          {/* Show keyboard shortcuts */}
          <Text fontWeight="medium" mt={3} mb={1}>Keyboard Shortcuts:</Text>
          <Text>Delete: Remove selected gate</Text>
          <Text>Esc: Close parameter panel</Text>
        </Box>
      </VStack>
    </Box>
  )
}

export default GateParamsPanel