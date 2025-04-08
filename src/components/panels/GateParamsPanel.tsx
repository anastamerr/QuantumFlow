import { Box, Heading, VStack, FormControl, FormLabel, Input, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Select, Button, useColorModeValue, Text } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { selectSelectedGateId, selectShowGateParams, toggleGateParams } from '../../store/slices/uiSlice'
import { selectGates, updateGate } from '../../store/slices/circuitSlice'
import { useState, useEffect } from 'react'
import { gateLibrary } from '../../utils/gateLibrary'

const GateParamsPanel = () => {
  const dispatch = useDispatch()
  const selectedGateId = useSelector(selectSelectedGateId)
  const showGateParams = useSelector(selectShowGateParams)
  const gates = useSelector(selectGates)
  const [params, setParams] = useState<Record<string, number | string>>({})
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  // Find the selected gate
  const selectedGate = gates.find(gate => gate.id === selectedGateId)
  
  // Find the gate definition from the library
  const gateDefinition = selectedGate 
    ? gateLibrary.find(g => g.id === selectedGate.type)
    : null
  
  // Update local params when selected gate changes
  useEffect(() => {
    if (selectedGate && selectedGate.params) {
      setParams({ ...selectedGate.params })
    } else {
      setParams({})
    }
  }, [selectedGate])
  
  // Handle parameter change
  const handleParamChange = (name: string, value: number | string) => {
    const newParams = { ...params, [name]: value }
    setParams(newParams)
    
    if (selectedGateId) {
      dispatch(updateGate({
        id: selectedGateId,
        updates: { params: newParams }
      }))
    }
  }
  
  // Handle panel close
  const handleClose = () => {
    dispatch(toggleGateParams())
  }
  
  // If no gate is selected or panel is hidden, return null
  if (!selectedGate || !gateDefinition || !showGateParams) {
    return null
  }
  
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
          bg={useColorModeValue(`${gateDefinition.color}.50`, `${gateDefinition.color}.900`)}
        >
          <Heading size="sm" mb={2}>{gateDefinition.name}</Heading>
          <Text fontSize="sm">{gateDefinition.description}</Text>
        </Box>
        
        {gateDefinition.params && gateDefinition.params.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {gateDefinition.params.map(param => (
              <FormControl key={param.name}>
                <FormLabel>{param.name}</FormLabel>
                
                {param.type === 'number' && (
                  <Input
                    type="number"
                    value={params[param.name] !== undefined ? params[param.name] : param.default}
                    min={param.min}
                    max={param.max}
                    step={param.step || 1}
                    onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                  />
                )}
                
                {param.type === 'angle' && (
                  <>
                    <Slider
                      value={Number(params[param.name] !== undefined ? params[param.name] : param.default)}
                      min={param.min || 0}
                      max={param.max || 360}
                      step={param.step || 1}
                      onChange={(val) => handleParamChange(param.name, val)}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg={`${gateDefinition.color}.500`} />
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
        
        {(gateDefinition.targets || gateDefinition.controls) && (
          <Box mt={4}>
            <Heading size="sm" mb={2}>Connection Information</Heading>
            {gateDefinition.targets && (
              <Text fontSize="sm">Target Qubits: {gateDefinition.targets}</Text>
            )}
            {gateDefinition.controls && (
              <Text fontSize="sm">Control Qubits: {gateDefinition.controls}</Text>
            )}
            <Text fontSize="sm" mt={2} fontStyle="italic">
              For multi-qubit gates, you'll need to specify target and control qubits.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default GateParamsPanel