import { Box, Heading, VStack, FormControl, FormLabel, Input, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Select, Button, useColorModeValue, Text, useToast, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Alert, AlertIcon } from '@chakra-ui/react'
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
  const [controlCount, setControlCount] = useState<number>(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const errorTextColor = useColorModeValue('red.600', 'red.300')
  const infoTextColor = useColorModeValue('blue.600', 'blue.300')
  
  // Find the selected gate
  const selectedGate = gates.find(gate => gate.id === selectedGateId)
  
  // Find the gate definition from the library
  const gateDefinition = selectedGate 
    ? gateLibrary.find(g => g.id === selectedGate.type)
    : null
  const isMCXGate = gateDefinition?.id === 'mcx'
  const minControlCount = isMCXGate ? (gateDefinition?.minControls ?? 2) : (gateDefinition?.controls ?? 0)
  const maxControlCount = isMCXGate
    ? Math.max(gateDefinition?.maxControls ?? (qubits.length - 1), minControlCount)
    : gateDefinition?.controls ?? 0
  
  // Update local state when selected gate changes
  useEffect(() => {
    if (selectedGate) {
      // Clear any previous validation errors
      setValidationError(null);
      
      // Set params
      if (selectedGate.params) {
        setParams({ ...selectedGate.params })
      } else {
        setParams({})
      }
      
      // Set targets
      if (selectedGate.targets && selectedGate.targets.length > 0) {
        setTargets([...selectedGate.targets])
      } else if (selectedGate.type === 'toffoli') {
        // Default the Toffoli target to the qubit where the gate was dropped
        setTargets([selectedGate.qubit])
      } else {
        setTargets([])
      }
      
      // Set controls
      if (selectedGate.controls) {
          setControls([...selectedGate.controls])
          setControlCount(
            isMCXGate
              ? Math.max(selectedGate.controls.length, minControlCount)
              : selectedGate.controls.length
          )
        } else {
          setControls([])
          setControlCount(isMCXGate ? minControlCount : 0)
      }
      
      setIsUpdating(false)
    } else {
      setParams({})
      setTargets([])
      setControls([])
      setControlCount(0)
      setValidationError(null)
    }
  }, [selectedGate, gateDefinition, isMCXGate, minControlCount])
  
  // Validate gate configuration (check for invalid qubit selections)
  const validateGateConfiguration = useCallback(() => {
    if (!selectedGate) return true;

    const mainQubit = selectedGate.qubit;
    const gateType = selectedGate.type;
    const isCNOTorCZ = gateType === 'cnot' || gateType === 'cz';

    const activeTargets = targets.filter((target) => target !== undefined && target !== null);
    const activeControls = controls.filter((control) => control !== undefined && control !== null);

    let errorMessage: string | null = null;

    if (isCNOTorCZ && activeTargets.includes(mainQubit)) {
      errorMessage = "Target qubit cannot be the same as the control qubit";
    }

    if (!errorMessage) {
      for (const control of activeControls) {
        if (activeTargets.includes(control)) {
          errorMessage = "Target and control qubits must be different";
          break;
        }
      }
    }

    if (!errorMessage && new Set(activeTargets).size !== activeTargets.length) {
      errorMessage = "All target qubits must be unique";
    }

    if (!errorMessage && new Set(activeControls).size !== activeControls.length) {
      errorMessage = "All control qubits must be unique";
    }

    if (!errorMessage && gateType === 'toffoli' && activeTargets.length === 0) {
      errorMessage = "Select a target qubit for the Toffoli gate";
    }

    if (!errorMessage && gateType === 'mcx') {
      const minControls = gateDefinition?.minControls ?? 2;
      const target = activeTargets[0] ?? mainQubit;
      if (activeControls.length < minControls) {
        errorMessage = `MCX requires at least ${minControls} control qubits`;
      } else if (target === undefined) {
        errorMessage = "Select a target qubit for the MCX gate";
      } else if (activeControls.includes(target)) {
        errorMessage = "Target qubit cannot also be a control for MCX";
      }
    }

    setValidationError(errorMessage);
    return errorMessage === null;
  }, [selectedGate, targets, controls]);
  
  // Run validation whenever targets or controls change
  useEffect(() => {
    validateGateConfiguration();
  }, [targets, controls, validateGateConfiguration]);
  
  // Debounced update function to prevent too many redux updates
  const updateGateWithDebounce = useCallback((updates: any) => {
    if (!validateGateConfiguration()) {
      // Don't update if validation fails
      toast({
        title: "Invalid Configuration",
        description: validationError || "Target and control qubits must be different",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsUpdating(true);
    
    // Check if gate still exists before updating
    const gateExists = gates.some(g => g.id === selectedGateId);
    if (!gateExists) {
      toast({
        title: "Gate not found",
        description: "The selected gate no longer exists.",
        status: "error",
        duration: 2000,
      });
      return;
    }
    
    try {
      if (selectedGateId) {
        dispatch(updateGate({
          id: selectedGateId,
          updates
        }));
      }
    } catch (error) {
      console.error("Error updating gate:", error);
      toast({
        title: "Update Failed",
        description: "Could not update gate parameters.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, selectedGateId, gates, toast, validateGateConfiguration, validationError]);
  
  // Handle parameter change
  const handleParamChange = (name: string, value: number | string) => {
    const newParams = { ...params, [name]: value };
    setParams(newParams);
    
    updateGateWithDebounce({ params: newParams });
  };
  
  // Get available qubits (excluding already used qubits)
  const getAvailableQubitsForTarget = (targetIndex: number) => {
    if (!selectedGate) return qubits;

    const usedQubits = new Set<number>();

    // Exclude other selected targets to keep them unique
    targets.forEach((target, idx) => {
      if (idx !== targetIndex && target !== undefined && target !== null) {
        usedQubits.add(target);
      }
    });

    // Exclude currently selected controls
    controls.forEach(control => {
      if (control !== undefined && control !== null) {
        usedQubits.add(control);
      }
    });

    // For CNOT/CZ, exclude the main control qubit from target choices
    const isCNOTorCZ = selectedGate.type === 'cnot' || selectedGate.type === 'cz';
    if (isCNOTorCZ && selectedGate.qubit !== undefined) {
      usedQubits.add(selectedGate.qubit);
    }

    return qubits.filter(qubit => !usedQubits.has(qubit.id));
  };
  
  // Get available qubits for control
  const getAvailableQubitsForControl = (controlIndex: number) => {
    if (!selectedGate) return qubits;
    
    const usedQubits = new Set<number>();
    
    // Exclude all selected targets from control choices
    targets.forEach(target => {
      if (target !== undefined && target !== null) {
        usedQubits.add(target);
      }
    });
    
    // Exclude other controls to keep them unique
    controls.forEach((control, idx) => {
      if (idx !== controlIndex && control !== undefined && control !== null) {
        usedQubits.add(control);
      }
    });
    
    return qubits.filter(qubit => !usedQubits.has(qubit.id));
  };
  
  // Handle target change
  const handleTargetChange = (index: number, value: number) => {
    // Create a new array to trigger state updates
    const newTargets = [...targets];
    newTargets[index] = value;
    setTargets(newTargets);

    const updates: Record<string, any> = { targets: newTargets };
    if (gateDefinition?.id === 'toffoli' || gateDefinition?.id === 'mcx') {
      // Keep the gate's primary qubit aligned with the selected target so
      // simulation/rendering treat the same qubit as the target line.
      updates.qubit = value;
    }
    if (gateDefinition?.id === 'mcx') {
      let filteredControls = controls.filter(control => control !== value);
      if (filteredControls.length !== controls.length) {
        if (filteredControls.length < minControlCount) {
          const forbidden = new Set<number>();
          forbidden.add(value);
          newTargets.forEach(target => forbidden.add(target));
          filteredControls.forEach(control => forbidden.add(control));
          const needed = minControlCount - filteredControls.length;
          const candidates = qubits
            .map(q => q.id)
            .filter(id => !forbidden.has(id));
          filteredControls = [...filteredControls, ...candidates.slice(0, needed)];
          if (filteredControls.length < minControlCount) {
            toast({
              title: "Not enough qubits",
              description: "Add more qubits to maintain the required MCX controls.",
              status: "warning",
              duration: 3000,
            });
          }
        }
        setControls(filteredControls);
        setControlCount(Math.max(filteredControls.length, minControlCount));
        updates.controls = filteredControls;
      }
    }
    
    // Only update the Redux store if configuration is valid
    updateGateWithDebounce(updates);
  };
  
  // Handle control change
  const handleControlChange = (index: number, value: number) => {
    // Create a new array to trigger state updates
    const newControls = [...controls];
    newControls[index] = value;
    setControls(newControls);
    
    // Only update the Redux store if configuration is valid
    updateGateWithDebounce({ controls: newControls });
  };

  const handleControlCountChange = (_: string, valueAsNumber: number) => {
    if (!isMCXGate) return;
    const maxAllowed = Math.min(maxControlCount, qubits.length - 1);
    const numericValue = Number.isFinite(valueAsNumber) ? valueAsNumber : (controlCount || minControlCount);
    const sanitized = Math.max(minControlCount, Math.min(numericValue, maxAllowed));
    if (sanitized === controlCount) return;

    let newControls = [...controls];
    if (sanitized < newControls.length) {
      newControls = newControls.slice(0, sanitized);
    } else {
      const forbidden = new Set<number>();
      if (selectedGate?.qubit !== undefined) {
        forbidden.add(selectedGate.qubit);
      }
      targets.forEach(target => forbidden.add(target));
      newControls.forEach(control => forbidden.add(control));

      const needed = sanitized - newControls.length;
      const candidates = qubits
        .map(q => q.id)
        .filter(id => !forbidden.has(id));

      if (candidates.length < needed) {
        toast({
          title: "Not enough qubits",
          description: "Add more qubits to assign additional control lines.",
          status: "warning",
          duration: 3000,
        });
        return;
      }
      newControls = [...newControls, ...candidates.slice(0, needed)];
    }

    setControlCount(sanitized);
    setControls(newControls);
    updateGateWithDebounce({ controls: newControls });
  };
  
  // Handle panel close
  const handleClose = () => {
    dispatch(toggleGateParams());
  };
  
  // If no gate is selected or panel is hidden, return null
  if (!selectedGate || !gateDefinition || !showGateParams) {
    return null;
  }
  
  // Generate color for gate based on gate definition
  const gateTypeColor = gateDefinition.color || 'gray';
  
  // For CNOT and CZ gates, the control is the main qubit and we only need to set targets
  const isCNOTorCZ = selectedGate.type === 'cnot' || selectedGate.type === 'cz';
  
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
        
        {/* Display validation error if any */}
        {validationError && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {validationError}
          </Alert>
        )}
        
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
                {Array.from({ length: gateDefinition.targets }).map((_, index) => {
                  // Get available targets for this selector
                  const availableQubits = getAvailableQubitsForTarget(index);
                  
                  // Skip if no available qubits
                  if (availableQubits.length === 0) {
                    return (
                      <Text key={`target-empty-${index}`} fontSize="xs" color={errorTextColor}>
                        No available target qubits. Add more qubits or select different controls.
                      </Text>
                    );
                  }
                  
                  return (
                    <Select
                      key={`target-${index}`}
                      size="sm"
                      value={targets[index] !== undefined ? targets[index] : (availableQubits[0]?.id || 0)}
                      onChange={(e) => handleTargetChange(index, parseInt(e.target.value))}
                      isDisabled={isUpdating || availableQubits.length === 0}
                      isInvalid={validationError !== null && validationError.includes("target")}
                    >
                      {availableQubits.map((qubit) => (
                        <option key={qubit.id} value={qubit.id}>
                          {qubit.name}
                        </option>
                      ))}
                    </Select>
                  );
                })}
                {qubits.length <= 1 && (
                  <Text fontSize="xs" color={errorTextColor}>
                    Need at least 2 qubits for multi-qubit gates
                  </Text>
                )}
              </VStack>
            )}
            
            {/* Display main qubit as control for CNOT/CZ gates */}
            {isCNOTorCZ && (
              <VStack align="stretch" spacing={2} mt={2}>
                <Text fontSize="sm" fontWeight="medium">Control Qubits:</Text>
                <Select
                  size="sm"
                  value={selectedGate.qubit}
                  isDisabled={true} // Control is fixed for CNOT/CZ
                >
                  <option value={selectedGate.qubit}>
                    {qubits.find(q => q.id === selectedGate.qubit)?.name || `q${selectedGate.qubit}`}
                  </option>
                </Select>
                <Text fontSize="xs" color={infoTextColor}>
                  The control qubit is fixed based on where you placed the gate
                </Text>
              </VStack>
            )}
            
            {/* Control qubit selectors (for non-CNOT/CZ gates) */}
            {!isCNOTorCZ && gateDefinition.controls && gateDefinition.controls > 0 && (
              <VStack align="stretch" spacing={2} mt={2}>
                <Text fontSize="sm" fontWeight="medium">Control Qubits:</Text>
                {isMCXGate && (
                  <FormControl>
                    <FormLabel fontSize="xs">Number of control qubits</FormLabel>
                    <NumberInput
                      size="sm"
                      min={minControlCount}
                      max={Math.max(minControlCount, Math.min(maxControlCount, qubits.length - 1))}
                      value={controlCount || minControlCount}
                      onChange={handleControlCountChange}
                      isDisabled={isUpdating}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="xs" color={infoTextColor} mt={1}>
                      MCX requires at least {minControlCount} distinct controls
                    </Text>
                  </FormControl>
                )}
                {Array.from({ length: isMCXGate ? Math.max(controlCount || minControlCount, minControlCount) : gateDefinition.controls }).map((_, index) => {
                  // Get available controls for this selector
                  const availableQubits = getAvailableQubitsForControl(index);
                  
                  // Skip if no available qubits
                  if (availableQubits.length === 0) {
                    return (
                      <Text key={`control-empty-${index}`} fontSize="xs" color={errorTextColor}>
                        No available control qubits. Add more qubits or select different targets.
                      </Text>
                    );
                  }
                  
                  return (
                    <Select
                      key={`control-${index}`}
                      size="sm"
                      value={controls[index] !== undefined ? controls[index] : (availableQubits[0]?.id || 0)}
                      onChange={(e) => handleControlChange(index, parseInt(e.target.value))}
                      isDisabled={isUpdating || availableQubits.length === 0}
                      isInvalid={validationError !== null && validationError.includes("control")}
                    >
                      {availableQubits.map((qubit) => (
                        <option key={qubit.id} value={qubit.id}>
                          {qubit.name}
                        </option>
                      ))}
                    </Select>
                  );
                })}
                {qubits.length <= 1 && (
                  <Text fontSize="xs" color={errorTextColor}>
                    Need at least 2 qubits for controlled gates
                  </Text>
                )}
              </VStack>
            )}
            
            {/* Info about target/control requirements */}
            {(targets.length > 0 || controls.length > 0) && (
              <Text fontSize="xs" color={infoTextColor} mt={2}>
                Target and control qubits must be different for proper quantum operations
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
  );
};

export default GateParamsPanel;