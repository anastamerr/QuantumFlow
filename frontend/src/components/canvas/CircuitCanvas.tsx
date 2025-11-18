import {
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Divider,
  useColorModeValue,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Flex,
  IconButton,
  Tooltip,
  useToast,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectQubits,
  selectGates,
  selectMaxPosition,
  addGate,
  removeGate,
  Gate,
} from "../../store/slices/circuitSlice";
import {
  selectSelectedGateId,
  selectGate,
  selectZoomLevel,
  setZoomLevel,
} from "../../store/slices/uiSlice";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  CircuitPosition,
  DroppedGate,
  Gate as CircuitGate,
} from "../../types/circuit";
import { gateLibrary } from "../../utils/gateLibrary";
import { renderCircuitSvg } from "../../utils/circuitRenderer";
import GridCell from "./GridCell";
import ResizablePanel from "../layout/ResizablePanel";
import QuantumTimeMachine from "../visualization/QuantumTimeMachine";
import { AddIcon, MinusIcon, InfoIcon } from "@chakra-ui/icons";
import { QuantumState } from "../../utils/stateEvolution";
import { formatComplexNumber } from "../../utils/stateEvolution";

/**
 * CircuitCanvas component displays the quantum circuit grid and visualization
 */
const CircuitCanvas: React.FC = () => {
  // Redux state and dispatch
  const dispatch = useDispatch();
  const qubits = useSelector(selectQubits);
  const gates = useSelector(selectGates);
  const maxPosition = useSelector(selectMaxPosition);
  const selectedGateId = useSelector(selectSelectedGateId);
  const zoomLevel = useSelector(selectZoomLevel);
  const toast = useToast();

  // Local state
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [timeMachineStep, setTimeMachineStep] = useState(-1);
  const [showTimeMachine, setShowTimeMachine] = useState(true);
  const [gateEffects, setGateEffects] = useState<
    Record<string, { amplitude: [number, number]; change: number }>
  >({});
  const [gridHeight, setGridHeight] = useState(300);
  const [visualizationHeight, setVisualizationHeight] = useState(300);

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  const baseCellSize =
    useBreakpointValue({
      base: 60, // Mobile: same size as desktop for readability
      md: 60, // Tablet: same as desktop
      lg: 60, // Desktop: standard size
    }) || 60;

  const cellSize = useMemo(() => {
    if (isMobile) {
      return Math.max(baseCellSize * zoomLevel, 60);
    }
    return baseCellSize * zoomLevel;
  }, [baseCellSize, zoomLevel, isMobile]);

  // Theme colors
  const gridBg = useColorModeValue("gray.50", "gray.700");
  const gridBorderColor = useColorModeValue("gray.200", "gray.600");
  const qubitLabelBg = useColorModeValue("blue.50", "blue.900");
  const qubitLabelColor = useColorModeValue("blue.800", "blue.100");
  const canvasBg = useColorModeValue("white", "gray.800");
  const canvasBorder = useColorModeValue("gray.200", "gray.600");
  const headingColor = useColorModeValue("gray.700", "gray.200");
  const controlsBg = useColorModeValue("gray.100", "gray.700");

  // Sort gates by position for Time Machine compatibility
  const sortedGates = useMemo(() => {
    return [...gates].sort(
      (a, b) =>
        (a.position !== undefined ? a.position : 0) -
        (b.position !== undefined ? b.position : 0)
    );
  }, [gates]);

  // Convert SliceGate[] to CircuitGate[] for GridCell compatibility - with error protection
  const circuitGates = useMemo(() => {
    try {
      return gates.map((gate) => {
        // Find the gate definition for additional properties
        const gateDefinition = gateLibrary.find((g) => g.id === gate.type);

        if (!gateDefinition) {
          console.warn(`Gate type "${gate.type}" not found in library`);
          return {
            ...gate,
            name: gate.type,
            symbol: gate.type.substring(0, 2).toUpperCase(),
            description: "Unknown gate type",
            category: "unknown",
            color: "gray",
          } as CircuitGate;
        }

        // Return a compatible gate object
        return {
          ...gate,
          name: gateDefinition.name,
          symbol: gateDefinition.symbol,
          description: gateDefinition.description || "",
          category: gateDefinition.category || "unknown",
          color: gateDefinition.color || "gray",
        } as CircuitGate;
      });
    } catch (err) {
      console.error("Error processing circuit gates:", err);
      return [];
    }
  }, [gates]);

  useEffect(() => {
    if (qubits.length === 0) return;

    const debounceTimer = setTimeout(() => {
      try {
        const svg = renderCircuitSvg(qubits, circuitGates);
        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Error rendering circuit SVG:", err);
        // Show error toast to user
        toast({
          title: "Visualization Error",
          description: "Could not render the circuit visualization.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(debounceTimer);
  }, [qubits, circuitGates, toast]); // Updated dependency array

  // Handle zoom level changes
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 0.1, 2.0);
    dispatch(setZoomLevel(newZoom));
  }, [zoomLevel, dispatch]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.5);
    dispatch(setZoomLevel(newZoom));
  }, [zoomLevel, dispatch]);

  const handleZoomChange = useCallback(
    (value: number) => {
      dispatch(setZoomLevel(value));
    },
    [dispatch]
  );

  /**
   * Handle dropping a gate onto the circuit - Fixed to ensure valid multi-qubit gate configurations
   * with special handling for two-qubit scenarios
   */
  const handleDrop = useCallback(
    (item: DroppedGate, position: CircuitPosition): void => {
      try {
        const gateDefinition = gateLibrary.find((g) => g.id === item.gateType);

        if (!gateDefinition) {
          console.warn(`Gate type "${item.gateType}" not found in library`);
          return;
        }

        const isMultiQubitGate =
          (gateDefinition.targets && gateDefinition.targets > 0) ||
          (gateDefinition.controls && gateDefinition.controls > 0);

        if (isMultiQubitGate && qubits.length < 2) {
          toast({
            title: "Not enough qubits",
            description: "Add more qubits to use multi-qubit gates.",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Create a new gate instance with required properties and proper typing
        const newGate: Omit<Gate, "id"> = {
          type: gateDefinition.id,
          qubit: position.qubit,
          position: position.position,
          params: {},
        };

        // For gates with parameters, initialize with defaults
        if (gateDefinition.params && gateDefinition.params.length > 0) {
          newGate.params = gateDefinition.params.reduce((acc, param) => {
            return { ...acc, [param.name]: param.default };
          }, {});
        }

        // For multi-qubit gates, set targets and controls
        if (gateDefinition.targets && gateDefinition.targets > 0) {
          // Two-qubit special case: If we have exactly 2 qubits, set the other one as target
          if (qubits.length === 2) {
            // The target should be the qubit that is not the current one
            const targetQubit = position.qubit === 0 ? 1 : 0;
            newGate.targets = [targetQubit];
          } else {
            // For more qubits, find the first available qubit that's not the current one
            const availableQubits = qubits
              .filter((q) => q.id !== position.qubit)
              .map((q) => q.id);

            if (availableQubits.length < gateDefinition.targets) {
              // Check against required targets
              toast({
                title: "No available target qubits",
                description: `This gate requires ${gateDefinition.targets} target qubit(s). Add more qubits or adjust gate placement.`,
                status: "warning",
                duration: 3000,
                isClosable: true,
              });
              return;
            }

            // Set default target to the first available qubit(s)
            newGate.targets = availableQubits.slice(0, gateDefinition.targets);
          }
        }

        if (gateDefinition.controls && gateDefinition.controls > 0) {
          const mainQubit = position.qubit;
          const targetQubits = newGate.targets || [];

          // For CNOT and CZ, the control is implicitly the qubit the gate is dropped on,
          // and the target is set in the previous block. We don't need to find additional control qubits.
          if (gateDefinition.id === "cnot" || gateDefinition.id === "cz") {
            // Ensure the target is different from the control for CNOT/CZ
            if (targetQubits.includes(mainQubit)) {
              toast({
                title: "Invalid CNOT/CZ placement",
                description: "Control and target qubits cannot be the same.",
                status: "warning",
                duration: 3000,
                isClosable: true,
              });
              return;
            }
          } else {
            // For other multi-control gates (e.g., Toffoli)
            const availableControlQubits = qubits
              .filter((q) => q.id !== mainQubit && !targetQubits.includes(q.id))
              .map((q) => q.id);

            if (gateDefinition.controls > availableControlQubits.length) {
              toast({
                title: "Not enough qubits for controls",
                description: `This gate requires ${gateDefinition.controls} control qubit(s).`,
                status: "warning",
                duration: 3000,
                isClosable: true,
              });
              return;
            }
            newGate.controls = availableControlQubits.slice(
              0,
              gateDefinition.controls
            );
          }
        }

        // Add the gate to the circuit
        dispatch(addGate(newGate));
      } catch (err) {
        // More specific error handling
        let errorMessage = "Could not add the gate to the circuit.";

        if (err instanceof Error) {
          console.error(`Error adding gate: ${err.message}`);
          errorMessage = `Error: ${err.message}`;
        } else {
          console.error("Unknown error adding gate:", err);
        }

        toast({
          title: "Error Adding Gate",
          description: errorMessage,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [dispatch, qubits, toast]
  );

  /**
   * Handle clicking on a gate in the circuit
   */
  const handleGateClick = useCallback(
    (gateId: string): void => {
      dispatch(selectGate(gateId));
    },
    [dispatch]
  );

  /**
   * Handle removing a gate from the circuit
   */
  const handleGateRemove = useCallback(
    (gateId: string): void => {
      dispatch(removeGate(gateId));
    },
    [dispatch]
  );

  /**
   * Create the grid cells for the circuit
   */
  const renderGrid = useMemo(() => {
    if (qubits.length === 0) return null;

    const grid = [];

    // For each qubit, create a row
    for (let qubit = 0; qubit < qubits.length; qubit++) {
      const cells = [];

      // For each position, create a cell
      for (let position = 0; position < maxPosition; position++) {
        cells.push(
          <GridCell
            key={`cell-${qubit}-${position}`}
            qubit={qubit}
            position={position}
            gates={circuitGates}
            selectedGateId={selectedGateId}
            gridBorderColor={gridBorderColor}
            gridBg={gridBg}
            onDrop={handleDrop}
            onGateClick={handleGateClick}
            onGateRemove={handleGateRemove}
            width={`${cellSize}px`}
            height={`${cellSize}px`}
            timeMachineStep={timeMachineStep}
            gateEffects={gateEffects}
          />
        );
      }

      // Add the row to the grid
      grid.push(
        <HStack key={`row-${qubit}`} spacing={0} align="center">
          <Box
            w={`${Math.max(
              cellSize + (isMobile ? 10 : 20),
              isMobile ? 70 : cellSize + 20
            )}px`}
            h={`${cellSize}px`}
            bg={qubitLabelBg}
            color={qubitLabelColor}
            borderWidth={1}
            borderColor={gridBorderColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            borderRadius="md 0 0 md"
            fontSize={isMobile ? "sm" : "sm"}
          >
            {qubits[qubit].name}
          </Box>
          {cells}
        </HStack>
      );
    }

    return grid;
  }, [
    qubits,
    maxPosition,
    circuitGates,
    selectedGateId,
    gridBorderColor,
    gridBg,
    qubitLabelBg,
    qubitLabelColor,
    handleDrop,
    handleGateClick,
    handleGateRemove,
    cellSize,
    isMobile,
  ]);

  // If no qubits, show a message
  if (qubits.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="md" color={headingColor}>
          No qubits in circuit
        </Heading>
        <Text mt={2}>
          Add qubits from the sidebar to start building your circuit
        </Text>
      </Box>
    );
  }

  return (
    <Box bg={canvasBg} borderRadius="md" boxShadow="sm" px={isMobile ? 2 : 4}>
      {/* Zoom Controls */}
      <Flex
        p={isMobile ? 2 : 3}
        bg={controlsBg}
        borderRadius="md"
        mb={2}
        alignItems="center"
        justifyContent="space-between"
        direction={isMobile ? "column" : "row"}
        gap={isMobile ? 2 : 0}
      >
        <Flex
          alignItems="center"
          flex={isMobile ? "1" : "auto"}
          justifyContent={isMobile ? "center" : "flex-start"}
        >
          <Text fontSize={isMobile ? "sm" : "sm"} mr={2}>
            Zoom:
          </Text>
          <Tooltip label="Zoom Out">
            <IconButton
              aria-label="Zoom out"
              icon={<MinusIcon />}
              size="sm"
              onClick={handleZoomOut}
              mr={2}
            />
          </Tooltip>

          <Slider
            value={zoomLevel}
            min={0.5}
            max={2}
            step={0.1}
            onChange={handleZoomChange}
            w={isMobile ? "150px" : "150px"}
            colorScheme="blue"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>

          <Tooltip label="Zoom In">
            <IconButton
              aria-label="Zoom in"
              icon={<AddIcon />}
              size="sm"
              onClick={handleZoomIn}
              ml={2}
            />
          </Tooltip>

          <Text fontSize={isMobile ? "sm" : "sm"} ml={2}>
            {Math.round(zoomLevel * 100)}%
          </Text>
        </Flex>
      </Flex>

      {/* Circuit Grid */}
      <ResizablePanel
        direction="vertical"
        defaultSize={gridHeight}
        minSize={200}
        maxSize={600}
        onResize={setGridHeight}
        mb={4}
      >
        <Box p={isMobile ? 2 : 4}>
          <Heading size={isMobile ? "sm" : "md"} mb={4} color={headingColor}>
            Quantum Circuit
          </Heading>
          <Box
            borderWidth={1}
            borderColor={canvasBorder}
            borderRadius="md"
            overflowX="auto"
            overflowY="auto"
            className="circuit-grid-container"
            h="100%"
            maxW="100%"
            sx={{
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "gray.100",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "gray.400",
                borderRadius: "4px",
              },
            }}
          >
            <VStack spacing={0} align="stretch">
              {renderGrid}
            </VStack>
          </Box>
        </Box>
      </ResizablePanel>

      <Divider borderColor={canvasBorder} />

      {/* Circuit Visualization */}
      <ResizablePanel
        direction="vertical"
        defaultSize={visualizationHeight}
        minSize={200}
        maxSize={600}
        onResize={setVisualizationHeight}
      >
        <Box p={isMobile ? 2 : 4}>
          <Flex
            justify="space-between"
            align="center"
            mb={4}
            direction={isMobile ? "column" : "row"}
            gap={2}
          >
            <Heading size={isMobile ? "sm" : "md"} color={headingColor}>
              Circuit Visualization
            </Heading>
            {gates.length > 0 && (
              <Flex gap={2}>
                <Badge
                  colorScheme="green"
                  variant="subtle"
                  fontSize={isMobile ? "sm" : "sm"}
                >
                  {timeMachineStep >= 0
                    ? `${timeMachineStep + 1}/${gates.length}`
                    : `0/${gates.length}`}{" "}
                  Steps
                </Badge>
              </Flex>
            )}
          </Flex>
          <Box
            ref={svgContainerRef}
            borderWidth={1}
            borderColor={canvasBorder}
            borderRadius="md"
            p={isMobile ? 2 : 4}
            overflowX="auto"
            overflowY="auto"
            className="circuit-svg-container"
            h="100%"
            maxW="100%"
            sx={{
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "gray.100",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "gray.400",
                borderRadius: "4px",
              },
            }}
          />
        </Box>
      </ResizablePanel>
    </Box>
  );
};

export default CircuitCanvas;
