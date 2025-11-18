import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Flex,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  ButtonGroup,
  Tooltip,
  Progress,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RepeatIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TriangleDownIcon as PlayIcon,
  TriangleUpIcon as PauseIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
import { Gate, Qubit } from "../../store/slices/circuitSlice";
import {
  executeCircuit,
  checkHealth,
  fetchSnapshots,
} from "../../lib/quantumApi";
import FullViewToggle from "../common/FullViewToggle";

// --- TYPE DEFINITIONS ---

interface StepResult {
  step: number;
  gates: Gate[];
  result: Record<string, number> | null;
  error: string | null;
  isLoading: boolean;
  entanglement?: any;
  impact?: any;
}

interface ComponentState {
  currentStep: number;
  isPlaying: boolean;
  playbackSpeed: number;
  stepResults: StepResult[];
  serverConnected: boolean | null;
  globalError: string | null;
  isGloballyLoading: boolean;
}

// --- REDUCER ACTIONS ---

type Action =
  | { type: "INITIALIZE"; gates: Gate[] }
  | { type: "RESET" }
  | { type: "PLAY_PAUSE" }
  | { type: "SET_SPEED"; speed: number }
  | { type: "JUMP_TO_STEP"; step: number }
  | { type: "SET_SERVER_STATUS"; connected: boolean }
  | { type: "FETCH_STEP_START"; stepIndex: number }
  | {
      type: "FETCH_STEP_SUCCESS";
      stepIndex: number;
      result: Record<string, number>;
    }
  | { type: "FETCH_STEP_ERROR"; stepIndex: number; error: string }
  | { type: "BULK_LOAD_SNAPSHOTS"; snapshots: any[] };

// --- PROPS INTERFACE ---

interface QuantumTimeMachineProps {
  qubits: Qubit[];
  gates: Gate[];
  onComplete?: (finalProbabilities: Record<string, number>) => void;
  shots?: number;
}

// --- REDUCER LOGIC ---

const initialState: ComponentState = {
  currentStep: -1,
  isPlaying: false,
  playbackSpeed: 1,
  stepResults: [],
  serverConnected: null,
  globalError: null,
  isGloballyLoading: false,
};

function timeMachineReducer(
  state: ComponentState,
  action: Action
): ComponentState {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...initialState,
        stepResults: action.gates.map((_, index) => ({
          step: index,
          gates: action.gates.slice(0, index + 1),
          result: null,
          error: null,
          isLoading: false,
        })),
      };
    case "RESET":
      return {
        ...state,
        currentStep: -1,
        isPlaying: false,
      };
    case "PLAY_PAUSE":
      return { ...state, isPlaying: !state.isPlaying };
    case "SET_SPEED":
      return { ...state, playbackSpeed: action.speed };
    case "JUMP_TO_STEP":
      if (
        action.step < -1 ||
        action.step >= state.stepResults.length ||
        action.step === state.currentStep
      ) {
        return state;
      }
      return {
        ...state,
        currentStep: action.step,
        isPlaying:
          action.step >= state.stepResults.length - 1 ? false : state.isPlaying,
      };
    case "SET_SERVER_STATUS":
      return { ...state, serverConnected: action.connected };
    case "FETCH_STEP_START":
      return {
        ...state,
        isGloballyLoading: true,
        globalError: null,
        stepResults: state.stepResults.map((s, i) =>
          i === action.stepIndex ? { ...s, isLoading: true, error: null } : s
        ),
      };
    case "FETCH_STEP_SUCCESS":
      return {
        ...state,
        isGloballyLoading: false,
        serverConnected: true,
        stepResults: state.stepResults.map((s, i) =>
          i === action.stepIndex
            ? { ...s, isLoading: false, result: action.result }
            : s
        ),
      };
    case "FETCH_STEP_ERROR":
      return {
        ...state,
        isGloballyLoading: false,
        serverConnected: false,
        globalError: action.error,
        stepResults: state.stepResults.map((s, i) =>
          i === action.stepIndex
            ? { ...s, isLoading: false, error: action.error }
            : s
        ),
      };
    case "BULK_LOAD_SNAPSHOTS":
      return {
        ...state,
        stepResults: action.snapshots.map((s) => ({
          step: s.step,
          gates: [],
          result: s.probabilities,
          error: null,
          isLoading: false,
          entanglement: s.entanglement,
          impact: s.impact,
        })),
        isGloballyLoading: false,
        globalError: null,
      };
    default:
      return state;
  }
}

// --- COMPONENT DEFINITION ---

const QuantumTimeMachine = forwardRef<any, QuantumTimeMachineProps>(
  ({ qubits, gates, onComplete, shots = 1024 }, ref) => {
    const [state, dispatch] = useReducer(timeMachineReducer, initialState);
    const {
      currentStep,
      isPlaying,
      playbackSpeed,
      stepResults,
      serverConnected,
      globalError,
      isGloballyLoading,
    } = state;

    const toast = useToast();
    const animationRef = useRef<number>();
    const lastStepTimeRef = useRef<number>(0);

    const sortedGates = useMemo(
      () => [...gates].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      [gates]
    );

    const totalSteps = stepResults.length;

    useImperativeHandle(ref, () => ({
      play: () => dispatch({ type: "PLAY_PAUSE" }),
      pause: () => dispatch({ type: "PLAY_PAUSE" }),
      reset: () => dispatch({ type: "RESET" }),
      jumpToStep: (step: number) => dispatch({ type: "JUMP_TO_STEP", step }),
      getCurrentStep: () => currentStep,
      getTotalSteps: () => totalSteps,
      getTimeMachineState: () => state,
    }));

    // --- SIDE EFFECTS ---

    // Check server connectivity on mount
    useEffect(() => {
      const checkServerHealth = async () => {
        try {
          const connected = await checkHealth();
          dispatch({ type: "SET_SERVER_STATUS", connected });
        } catch (error) {
          console.error("Health check failed:", error);
          dispatch({ type: "SET_SERVER_STATUS", connected: false });
        }
      };
      checkServerHealth();
    }, []);

    useEffect(() => {
      dispatch({ type: "INITIALIZE", gates: sortedGates });
    }, [sortedGates]);

    useEffect(() => {
      let mounted = true;
      if (!sortedGates || sortedGates.length === 0) return;

      (async () => {
        dispatch({ type: "FETCH_STEP_START", stepIndex: 0 });
        try {
          const body = await fetchSnapshots({
            num_qubits: qubits.length,
            gates: sortedGates,
            mode: "statevector",
            computeEntanglement: true,
            computeImpacts: true,
          });
          if (!mounted) return;
          dispatch({ type: "BULK_LOAD_SNAPSHOTS", snapshots: body.snapshots });
        } catch (err: any) {
          if (!mounted) return;
          dispatch({
            type: "FETCH_STEP_ERROR",
            stepIndex: 0,
            error: err.message,
          });
          toast({
            title: "Snapshots error",
            description: err.message,
            status: "error",
          });
        }
      })();

      return () => {
        mounted = false;
      };
    }, [sortedGates, qubits.length]);

    useEffect(() => {
      if (!isPlaying) return;

      const stepDuration = 1000 / playbackSpeed;
      lastStepTimeRef.current = performance.now();

      const animate = (timestamp: number) => {
        if (performance.now() - lastStepTimeRef.current >= stepDuration) {
          dispatch({ type: "JUMP_TO_STEP", step: currentStep + 1 });
          lastStepTimeRef.current = performance.now();
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isPlaying, playbackSpeed, currentStep, totalSteps]);

    useEffect(() => {
      if (currentStep < 0) return;

      const stepToExecute = stepResults[currentStep];
      if (!stepToExecute || stepToExecute.result || stepToExecute.isLoading) {
        return;
      }

      const execute = async () => {
        dispatch({ type: "FETCH_STEP_START", stepIndex: currentStep });
        try {
          const response = await executeCircuit({
            num_qubits: qubits.length,
            gates: stepToExecute.gates,
            shots,
            memory: false,
          });

          dispatch({
            type: "FETCH_STEP_SUCCESS",
            stepIndex: currentStep,
            result: response.probabilities,
          });

          // Trigger onComplete when the final step is successfully executed
          if (currentStep === totalSteps - 1 && onComplete) {
            onComplete(response.probabilities);
          }
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Backend execution failed";
          dispatch({
            type: "FETCH_STEP_ERROR",
            stepIndex: currentStep,
            error: errorMsg,
          });
          toast({
            title: "Backend Error",
            description: `Failed to execute step ${
              currentStep + 1
            }: ${errorMsg}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      };

      execute();
    }, [
      currentStep,
      stepResults,
      qubits.length,
      shots,
      toast,
      onComplete,
      totalSteps,
    ]);

    const handlePlayPause = useCallback(
      () => dispatch({ type: "PLAY_PAUSE" }),
      []
    );
    const handleReset = useCallback(() => dispatch({ type: "RESET" }), []);
    const handleJumpToStart = useCallback(
      () => dispatch({ type: "JUMP_TO_STEP", step: -1 }),
      []
    );
    const handleJumpToEnd = useCallback(
      () => dispatch({ type: "JUMP_TO_STEP", step: stepResults.length - 1 }),
      [stepResults.length]
    );
    const handleStepForward = useCallback(
      () => dispatch({ type: "JUMP_TO_STEP", step: currentStep + 1 }),
      [currentStep]
    );
    const handleStepBackward = useCallback(
      () => dispatch({ type: "JUMP_TO_STEP", step: currentStep - 1 }),
      [currentStep]
    );
    const handleSpeedChange = useCallback(
      (speed: number) => dispatch({ type: "SET_SPEED", speed }),
      []
    );
    const handleJumpToStep = useCallback(
      (step: number) => dispatch({ type: "JUMP_TO_STEP", step }),
      []
    );

    const currentStepData = useMemo(() => {
      if (currentStep < 0) {
        const initialStateStr = "0".repeat(qubits.length);
        return {
          name: "Initial State",
          description: "The circuit begins in the ground state.",
          probabilities: { [initialStateStr]: 1.0 },
        };
      }

      // Get the current step result
      const step = stepResults[currentStep];

      // Calculate the number of gates applied up to this step
      const gatesApplied = currentStep + 1;

      return {
        name: `Step ${currentStep + 1}`,
        description: `After applying ${gatesApplied} gate(s).`,
        probabilities: step?.result ?? null,
      };
    }, [currentStep, stepResults, qubits.length]);

    // --- UI COLORS ---

    const timeMachineBg = useColorModeValue("white", "gray.800");
    const timeMachineBorder = useColorModeValue("gray.200", "gray.600");
    const activeGateColor = useColorModeValue("blue.500", "blue.300");
    const inactiveGateColor = useColorModeValue("gray.400", "gray.600");
    const highlightColor = useColorModeValue("yellow.400", "yellow.300");
    const tooltipBg = useColorModeValue("gray.50", "gray.700");

    // --- RENDER FUNCTIONS ---

    const renderGateTimeline = () => {
      if (sortedGates.length === 0) {
        return (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            Add gates to the circuit to begin the simulation.
          </Text>
        );
      }

      return (
        <Box mb={4}>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Gate Timeline
          </Text>
          <HStack spacing={2} overflowX="auto" p={2}>
            {sortedGates.map((gate, index) => {
              const step = stepResults[index];
              const isActive = index <= currentStep;
              const hasError = !!step?.error;

              return (
                <Tooltip
                  key={gate.id}
                  label={`${gate.type.toUpperCase()} on qubit ${gate.qubit}${
                    gate.targets ? ` → ${gate.targets.join(", ")}` : ""
                  }`}
                  placement="top"
                >
                  <Box
                    minW="50px"
                    h="36px"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                    cursor="pointer"
                    transition="all 0.2s"
                    bg={
                      hasError
                        ? "red.500"
                        : isActive
                        ? activeGateColor
                        : inactiveGateColor
                    }
                    color="white"
                    opacity={index <= currentStep ? 1 : 0.5}
                    borderWidth={2}
                    borderColor={
                      index === currentStep ? highlightColor : "transparent"
                    }
                    onClick={() => handleJumpToStep(index)}
                    _hover={{ transform: "scale(1.05)", opacity: 1 }}
                  >
                    {step?.isLoading ? (
                      <Spinner size="xs" />
                    ) : (
                      gate.type.toUpperCase()
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </HStack>
        </Box>
      );
    };

    const renderProbabilityBars = () => {
      const { probabilities } = currentStepData;

      if (!probabilities) {
        return (
          <Box textAlign="center" p={4}>
            <Text fontSize="sm" color="gray.500">
              Execute this step on the backend to view measurement
              probabilities.
            </Text>
          </Box>
        );
      }

      const sortedStates = Object.entries(probabilities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8); // Show top 8 states

      return (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            State Probabilities (Backend)
          </Text>
          <VStack spacing={2} maxH="150px" overflowY="auto" pr={2}>
            {sortedStates.map(([state, prob]) => (
              <Box key={state} w="100%">
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs" fontWeight="mono">
                    |{state}⟩
                  </Text>
                  <Text fontSize="xs" fontWeight="medium">
                    {(prob * 100).toFixed(1)}%
                  </Text>
                </Flex>
                <Progress
                  value={prob * 100}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                />
              </Box>
            ))}
          </VStack>
        </Box>
      );
    };

    // --- MAIN RENDER ---

    return (
      <Card
        bg={timeMachineBg}
        borderColor={timeMachineBorder}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="sm"
        overflow="hidden"
      >
        <CardBody p={4}>
          <VStack spacing={4} align="stretch" h="100%">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <Heading size="sm">Quantum Time Machine</Heading>
              <HStack spacing={2}>
                <FullViewToggle />
                <Badge
                  colorScheme={
                    serverConnected === null
                      ? "gray"
                      : serverConnected
                      ? "green"
                      : "red"
                  }
                >
                  Backend:{" "}
                  {serverConnected === null
                    ? "Checking..."
                    : serverConnected
                    ? "Connected"
                    : "Error"}
                </Badge>
                {isGloballyLoading && <Spinner size="xs" color="blue.500" />}
              </HStack>
            </Flex>

            {/* Global Error Display */}
            {globalError && (
              <Box p={2} bg="red.50" borderRadius="md">
                <Text fontSize="xs" color="red.700">
                  <strong>Error:</strong> {globalError}
                </Text>
              </Box>
            )}

            {/* Current Step Info */}
            <Box
              p={3}
              bg={tooltipBg}
              borderRadius="md"
              borderLeftWidth={4}
              borderLeftColor={activeGateColor}
            >
              <Text fontWeight="medium" fontSize="sm">
                {currentStepData.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {currentStepData.description}
              </Text>
            </Box>

            {/* Gate Timeline */}
            {renderGateTimeline()}

            {/* Probability Visualization */}
            {renderProbabilityBars()}

            {/* Spacer to push controls to the bottom */}
            <Box flex={1} />

            {/* Timeline Slider */}
            <VStack spacing={1} align="stretch">
              <Slider
                aria-label="timeline-slider"
                value={currentStep}
                min={-1}
                max={stepResults.length - 1}
                onChange={handleJumpToStep}
                isDisabled={stepResults.length === 0}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <Tooltip label={`Step: ${currentStep + 1}`} placement="top">
                  <SliderThumb />
                </Tooltip>
              </Slider>
              <Flex justify="space-between" fontSize="xs" color="gray.500">
                <Text>Initial</Text>
                <Text>
                  Step {currentStep + 1} / {stepResults.length}
                </Text>
                <Text>Final</Text>
              </Flex>
            </VStack>

            {/* Playback Controls */}
            <HStack justify="center" spacing={2} w="100%">
              <ButtonGroup size="sm" isAttached variant="outline">
                <IconButton
                  aria-label="Jump to start"
                  icon={<ArrowLeftIcon />}
                  onClick={handleJumpToStart}
                  isDisabled={currentStep <= -1}
                />
                <IconButton
                  aria-label="Step backward"
                  icon={<ChevronLeftIcon />}
                  onClick={handleStepBackward}
                  isDisabled={currentStep <= -1}
                />
              </ButtonGroup>
              <Button
                size="sm"
                onClick={handlePlayPause}
                colorScheme={isPlaying ? "red" : "blue"}
                isDisabled={currentStep >= stepResults.length - 1}
                w="80px"
              >
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <ButtonGroup size="sm" isAttached variant="outline">
                <IconButton
                  aria-label="Step forward"
                  icon={<ChevronRightIcon />}
                  onClick={handleStepForward}
                  isDisabled={currentStep >= stepResults.length - 1}
                />
                <IconButton
                  aria-label="Jump to end"
                  icon={<ArrowRightIcon />}
                  onClick={handleJumpToEnd}
                  isDisabled={currentStep >= stepResults.length - 1}
                />
              </ButtonGroup>

              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<SettingsIcon />}
                  size="sm"
                  variant="ghost"
                  aria-label="Playback speed"
                />
                <MenuList minW="120px">
                  <MenuItem onClick={() => handleSpeedChange(0.5)}>
                    0.5x Speed
                  </MenuItem>
                  <MenuItem onClick={() => handleSpeedChange(1)}>
                    1x Speed
                  </MenuItem>
                  <MenuItem onClick={() => handleSpeedChange(2)}>
                    2x Speed
                  </MenuItem>
                  <MenuItem onClick={() => handleSpeedChange(5)}>
                    5x Speed
                  </MenuItem>
                </MenuList>
              </Menu>

              <IconButton
                size="sm"
                variant="ghost"
                icon={<RepeatIcon />}
                onClick={handleReset}
                aria-label="Reset simulation"
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  }
);

QuantumTimeMachine.displayName = "QuantumTimeMachine";

export default QuantumTimeMachine;
