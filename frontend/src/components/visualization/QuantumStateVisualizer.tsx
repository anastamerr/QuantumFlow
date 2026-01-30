import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Slider, 
  SliderTrack, 
  SliderFilledTrack, 
  SliderThumb, 
  Button, 
  ButtonGroup, 
  HStack, 
  VStack, 
  Tooltip, 
  useColorModeValue,
  Progress
} from '@chakra-ui/react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  RepeatIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon 
} from '@chakra-ui/icons';
import { Gate, Qubit } from '../../types/circuit';

// Import helper function to perform quantum state calculations
import { simulateGateApplication, formatComplexNumber, calculateProbabilities } from '../../utils/stateEvolution';

interface QuantumStateVisualizerProps {
  qubits: Qubit[];
  gates: Gate[];
  isRunning: boolean;
  playbackSpeed?: number;
  autoPlay?: boolean;
  onComplete?: (results: Record<string, number>) => void;
}

/**
 * Component that visualizes quantum state evolution as gates are applied
 */
const QuantumStateVisualizer = forwardRef<any, QuantumStateVisualizerProps>(({ 
  qubits, 
  gates, 
  isRunning,
  playbackSpeed = 1,
  autoPlay = false,
  onComplete 
}, ref) => {
  // Sort gates by position for step-by-step application
  const sortedGates = useMemo(() => (
    [...gates].sort((a, b) =>
      (a.position !== undefined ? a.position : 0) - (b.position !== undefined ? b.position : 0)
    )
  ), [gates]);
  
  // Track current state evolution
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 means initial state
  const [quantumState, setQuantumState] = useState<Record<string, [number, number]>>({}); // Complex amplitudes as [real, imag]
  const [probabilities, setProbabilities] = useState<Record<string, number>>({}); // Measurement probabilities
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [localPlaybackSpeed, setLocalPlaybackSpeed] = useState<number>(playbackSpeed);
  const [frameRate, setFrameRate] = useState<number>(30); // Frames per second for smoother animation
  const stateRef = useRef<Record<string, [number, number]>>({});
  const stepRef = useRef<number>(-1);
  
  // Refs for animation
  const animationRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);
  const frameTimeRef = useRef<number>(0);
  const simulationStartTimeRef = useRef<number>(0);
  
  // Calculate total steps (gates + final measurement)
  const totalSteps = sortedGates.length;

  const buildInitialState = () => {
    const initialState: Record<string, [number, number]> = {};
    const zeroState = '0'.repeat(qubits.length);
    initialState[zeroState] = [1, 0];

    for (let i = 1; i < Math.pow(2, qubits.length); i++) {
      const binaryString = i.toString(2).padStart(qubits.length, '0');
      initialState[binaryString] = [0, 0];
    }

    return { initialState, zeroState };
  };
  
  // Colors
  const barColor = useColorModeValue('blue.500', 'blue.300');
  const barBgColor = useColorModeValue('gray.100', 'gray.700');
  const stateBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // When playbackSpeed prop changes, update local state
  useEffect(() => {
    setLocalPlaybackSpeed(playbackSpeed);
  }, [playbackSpeed]);
  
  // Initialize quantum state when qubits change
  useEffect(() => {
    if (qubits.length > 0) {
      const { initialState, zeroState } = buildInitialState();
      setQuantumState(initialState);
      setProbabilities({ [zeroState]: 1 });
      setCurrentStep(-1);
      stateRef.current = initialState;
      stepRef.current = -1;
    }
  }, [qubits]);
  
  // Reset animation when gates change
  useEffect(() => {
    handleReset();
  }, [gates]);
  
  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    reset: handleReset,
    jumpToEnd: handleJumpToEnd,
    getCurrentStep: () => currentStep,
    getTotalSteps: () => totalSteps,
    getState: () => ({
      currentStep,
      totalSteps,
      isPlaying,
      probabilities,
      quantumState
    })
  }));
  
  // Effect for auto-play animation with improved performance
  useEffect(() => {
    if (isPlaying) {
      // Calculate how many milliseconds each step should take based on playback speed
      const stepDuration = 1000 / localPlaybackSpeed;
      const frameDuration = 1000 / frameRate; // ms per frame
      
      simulationStartTimeRef.current = performance.now();
      lastStepTimeRef.current = simulationStartTimeRef.current;
      frameTimeRef.current = simulationStartTimeRef.current;
      
      const animate = (timestamp: number) => {
        // Handle frame rate limiting for smoother animation
        const frameTimeDelta = timestamp - frameTimeRef.current;
        if (frameTimeDelta < frameDuration) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        
        frameTimeRef.current = timestamp;
        
        // Check if it's time for the next step
        const timeSinceLastStep = timestamp - lastStepTimeRef.current;
        
        if (timeSinceLastStep >= stepDuration) {
          // Time to move to the next step
          setCurrentStep(prevStep => {
            if (prevStep < totalSteps) {
              return prevStep + 1;
            } else {
              // Reached the end, stop playing
              setIsPlaying(false);
              return prevStep;
            }
          });
          
          lastStepTimeRef.current = timestamp;
        }
        
        if (isPlaying) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      // Cleanup function
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, localPlaybackSpeed, totalSteps, frameRate]);
  
  // Effect to update quantum state when the step changes
  useEffect(() => {
    if (currentStep === -1) {
      const { initialState, zeroState } = buildInitialState();
      stateRef.current = initialState;
      stepRef.current = -1;
      setQuantumState(initialState);
      setProbabilities({ [zeroState]: 1 });
      return;
    }

    if (currentStep >= 0 && currentStep < sortedGates.length) {
      try {
        let newState = stateRef.current;
        if (stepRef.current === -1 || currentStep < stepRef.current) {
          newState = buildInitialState().initialState;
          for (let i = 0; i <= currentStep; i++) {
            newState = simulateGateApplication(newState, sortedGates[i], qubits.length);
          }
        } else {
          for (let i = stepRef.current + 1; i <= currentStep; i++) {
            newState = simulateGateApplication(newState, sortedGates[i], qubits.length);
          }
        }

        stateRef.current = newState;
        stepRef.current = currentStep;
        setQuantumState(newState);
        setProbabilities(calculateProbabilities(newState));
      } catch (err) {
        console.error("Error applying gate:", err);
        setIsPlaying(false);
      }
    } else if (currentStep === sortedGates.length) {
      if (onComplete) {
        onComplete(calculateProbabilities(stateRef.current));
      }
    }
  }, [currentStep, onComplete, sortedGates, qubits.length]);
  
  // Start simulation if isRunning changes to true
  useEffect(() => {
    if (isRunning && currentStep === -1 && autoPlay) {
      // Only auto-start if we're at the beginning and autoPlay is true
      setIsPlaying(true);
    }
  }, [isRunning, currentStep, autoPlay]);
  
  // Handle stepping manually
  const handleStepForward = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleStepBackward = () => {
    if (currentStep <= -1) return;

    const targetStep = currentStep - 1;
    if (targetStep < 0) {
      handleReset();
      return;
    }

    const { initialState } = buildInitialState();
    let newState = initialState;
    for (let i = 0; i <= targetStep; i++) {
      newState = simulateGateApplication(newState, sortedGates[i], qubits.length);
    }

    setQuantumState(newState);
    setProbabilities(calculateProbabilities(newState));
    setCurrentStep(targetStep);
    stateRef.current = newState;
    stepRef.current = targetStep;
  };
  
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(-1);

    const { initialState, zeroState } = buildInitialState();
    setQuantumState(initialState);
    setProbabilities({ [zeroState]: 1 });
    stateRef.current = initialState;
    stepRef.current = -1;
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleJumpToStart = () => {
    handleReset();
  };
  
  const handleJumpToEnd = () => {
    // Apply all gates at once to get the final state
    setIsPlaying(false);
    
    // This needs to be done in chunks to prevent UI freezing
    const chunkSize = 5; // Process 5 gates at a time
    let currentGateIndex = currentStep + 1;
    let currentStateSnapshot = { ...stateRef.current };
    
    const processNextChunk = () => {
      if (currentGateIndex >= sortedGates.length) {
        // We've processed all gates
        const finalProbs = calculateProbabilities(currentStateSnapshot);
        setQuantumState(currentStateSnapshot);
        setProbabilities(finalProbs);
        setCurrentStep(sortedGates.length);
        stateRef.current = currentStateSnapshot;
        stepRef.current = sortedGates.length;
        
        // Notify completion
        if (onComplete) {
          onComplete(finalProbs);
        }
        return;
      }
      
      // Process a chunk of gates
      const endIndex = Math.min(currentGateIndex + chunkSize, sortedGates.length);
      
      for (let i = currentGateIndex; i < endIndex; i++) {
        try {
          currentStateSnapshot = simulateGateApplication(currentStateSnapshot, sortedGates[i], qubits.length);
        } catch (err) {
          console.error("Error applying gate during jump:", err);
        }
      }
      
      // Update where we are
      currentGateIndex = endIndex;
      
      // Schedule the next chunk
      setTimeout(processNextChunk, 10);
    };
    
    // Start processing
    processNextChunk();
  };
  
  // Get current gate name
  const getCurrentGateName = () => {
    if (currentStep === -1) return "Initial State";
    if (currentStep >= sortedGates.length) return "Measurement";
    
    const gate = sortedGates[currentStep];
    return gate.name || (gate.type.charAt(0).toUpperCase() + gate.type.slice(1));
  };
  
  // Render the quantum state visualization
  return (
    <Box w="100%">
      <VStack spacing={4} align="stretch">
        <Heading size="sm">Quantum State Evolution</Heading>
        
        {/* State visualizer */}
        <Box 
          p={4} 
          borderWidth={1} 
          borderRadius="md" 
          borderColor={borderColor}
          bg={stateBg}
        >
          <Text fontSize="sm" mb={1}>
            Step {currentStep + 1} of {totalSteps + 1}
          </Text>
          <Text fontSize="sm" fontWeight="medium" mb={3}>
            {getCurrentGateName()}
          </Text>
          
          {/* Probabilities visualization */}
          <VStack spacing={2} align="stretch" my={4}>
            {Object.entries(probabilities)
              .sort((a, b) => b[1] - a[1]) // Sort by probability (descending)
              .filter(([_, prob]) => prob > 0.001) // Filter out very small probabilities
              .slice(0, 8) // Only show top 8 states for performance
              .map(([state, prob]) => (
                <Box key={state}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm">|{state}⟩</Text>
                    <Tooltip label={`Amplitude: ${formatComplexNumber(quantumState[state])}`}>
                      <Text fontSize="sm">{(prob * 100).toFixed(1)}%</Text>
                    </Tooltip>
                  </Flex>
                  <Progress 
                    value={prob * 100} 
                    size="sm" 
                    colorScheme="blue" 
                    bg={barBgColor}
                    borderRadius="full"
                  />
                </Box>
              ))}
              
            {/* Show total number of states if there are many */}
            {Object.keys(probabilities).filter(key => probabilities[key] > 0.001).length > 8 && (
              <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
                {Object.keys(probabilities).filter(key => probabilities[key] > 0.001).length - 8} more states hidden
              </Text>
            )}
          </VStack>
        </Box>
        
        {/* Playback controls */}
        <Box>
          <Flex justify="center" mt={2}>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button 
                onClick={handleJumpToStart}
                isDisabled={currentStep === -1 || isPlaying}
                aria-label="Jump to start"
              >
                <ArrowLeftIcon />
              </Button>
              <Button 
                onClick={handleStepBackward}
                isDisabled={currentStep === -1 || isPlaying}
                aria-label="Step backward"
              >
                <ChevronLeftIcon />
              </Button>
              <Button 
                onClick={handlePlayPause}
                colorScheme={isPlaying ? "red" : "blue"}
                aria-label={isPlaying ? "Pause" : "Play"}
                minWidth="80px"
              >
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button 
                onClick={handleStepForward}
                isDisabled={currentStep === totalSteps || isPlaying}
                aria-label="Step forward"
              >
                <ChevronRightIcon />
              </Button>
              <Button 
                onClick={handleJumpToEnd}
                isDisabled={currentStep === totalSteps || isPlaying}
                aria-label="Jump to end"
              >
                <ArrowRightIcon />
              </Button>
            </ButtonGroup>
          </Flex>
          
          <Flex justify="center" mt={2}>
            <Button 
              size="sm" 
              leftIcon={<RepeatIcon />} 
              variant="ghost"
              onClick={handleReset}
              isDisabled={isPlaying}
            >
              Reset
            </Button>
          </Flex>
        </Box>
        
        {/* Progress bar */}
        <Progress 
          value={(currentStep + 1) * (100 / (totalSteps + 1))} 
          size="xs" 
          colorScheme="blue"
          borderRadius="full"
        />
      </VStack>
    </Box>
  );
});

export default QuantumStateVisualizer;
