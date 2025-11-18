import {
  Box,
  useColorModeValue,
  useBreakpointValue,
  Tooltip,
  Text,
} from "@chakra-ui/react";
import { useDrop } from "react-dnd";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedMobileGate,
  setSelectedMobileGate,
} from "../../store/slices/uiSlice";
import { addGate } from "../../store/slices/circuitSlice";
import { gateLibrary } from "../../utils/gateLibrary";
import { Gate, CircuitPosition, DroppedGate } from "../../types/circuit";
import CircuitGate from "./CircuitGate";
import { formatComplexNumber } from "../../utils/stateEvolution";

/**
 * GridCell component represents a single cell in the quantum circuit grid
 * It handles drag and drop functionality for gates
 */
interface GridCellProps {
  qubit: number;
  position: number;
  gates: Gate[];
  selectedGateId: string | null;
  gridBorderColor: string;
  gridBg: string;
  onDrop: (item: DroppedGate, position: CircuitPosition) => void;
  onGateClick: (gateId: string) => void;
  onGateRemove: (gateId: string) => void;
  width?: string;
  height?: string;
  // Time Machine integration props
  timeMachineStep?: number;
  gateEffects?: Record<string, { amplitude: [number, number]; change: number }>;
}

const GridCell: React.FC<GridCellProps> = ({
  qubit,
  position,
  gates,
  selectedGateId,
  gridBorderColor,
  gridBg,
  onDrop,
  onGateClick,
  onGateRemove,
  width = "60px",
  height = "60px",
  timeMachineStep = -1,
  gateEffects = {},
}) => {
  const dispatch = useDispatch();
  const selectedMobileGate = useSelector(selectSelectedMobileGate);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Time Machine theme colors
  const activeGateBg = useColorModeValue("green.200", "green.700");
  const completedGateBg = useColorModeValue("blue.200", "blue.700");
  const futureGateBg = useColorModeValue("gray.200", "gray.600");
  const gateGlowColor = useColorModeValue("yellow.300", "yellow.500");

  // Theme colors
  const hoverBg = useColorModeValue("blue.50", "blue.900");
  const dropIndicatorBg = useColorModeValue("blue.100", "blue.800");
  const mobilePlacementIndicator = useColorModeValue("green.100", "green.800");

  // Find gates at this position
  const gatesAtPosition = gates.filter(
    (gate) => gate.qubit === qubit && gate.position === position
  );

  // Helper function to determine gate status based on Time Machine step
  const getGateStatus = (gate: Gate): "active" | "completed" | "future" => {
    const gateIndex = gates.findIndex((g) => g.id === gate.id);
    if (gateIndex === -1) return "future";

    if (gateIndex <= timeMachineStep) return "completed";
    if (gateIndex === timeMachineStep + 1) return "active";
    return "future";
  };

  // Helper function to get gate tooltip content
  const getGateTooltip = (gate: Gate): string => {
    const effect = gateEffects[gate.id];
    const status = getGateStatus(gate);
    const gateDefinition = gateLibrary.find((g) => g.id === gate.type);

    let tooltip = `${gateDefinition?.name || gate.type.toUpperCase()} Gate`;
    if (gate.targets && gate.targets.length > 0) {
      tooltip += ` → Targets: ${gate.targets.join(", ")}`;
    }
    if (gate.controls && gate.controls.length > 0) {
      tooltip += ` → Controls: ${gate.controls.join(", ")}`;
    }

    tooltip += `\nStatus: ${status.charAt(0).toUpperCase() + status.slice(1)}`;

    if (effect) {
      tooltip += `\nAmplitude Change: ${formatComplexNumber(effect.amplitude)}`;
      tooltip += `\nState Impact: ${effect.change.toFixed(3)}`;
    }

    return tooltip;
  };

  // Create a drop target for this cell
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: "gate",
      drop: (item: DroppedGate) => onDrop(item, { qubit, position }),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [qubit, position, onDrop]
  ); // Add dependencies to fix React hooks rule violation

  // Handle tap-to-place functionality for both mobile and desktop
  const handleCellClick = () => {
    if (selectedMobileGate && gatesAtPosition.length === 0) {
      const gateDefinition = gateLibrary.find(
        (g) => g.id === selectedMobileGate
      );
      if (gateDefinition) {
        const newGate = {
          type: gateDefinition.id,
          qubit: qubit,
          position: position,
          params:
            gateDefinition.params?.reduce((acc, param) => {
              return { ...acc, [param.name]: param.default };
            }, {}) || {},
        };

        // Add targets and controls for multi-qubit gates
        if (gateDefinition.targets && gateDefinition.targets > 0) {
          // For two-qubit gates, use the other qubit as target if available
          const targetQubit = qubit === 0 ? 1 : 0;
          newGate.targets = [targetQubit];
        }

        dispatch(addGate(newGate));
        dispatch(setSelectedMobileGate(null)); // Clear selection after placing
      }
    }
  };

  // Determine background color based on drop state
  const cellBg =
    isOver && canDrop
      ? dropIndicatorBg
      : selectedMobileGate && gatesAtPosition.length === 0
      ? mobilePlacementIndicator
      : gridBg;

  return (
    <Box
      ref={drop}
      w={width}
      h={height}
      borderWidth={1}
      borderColor={gridBorderColor}
      bg={cellBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      transition="all 0.2s"
      _hover={{ bg: gatesAtPosition.length === 0 ? hoverBg : cellBg }}
      data-testid={`grid-cell-${qubit}-${position}`}
      onClick={handleCellClick}
      cursor={
        selectedMobileGate && gatesAtPosition.length === 0
          ? "pointer"
          : "default"
      }
    >
      {gatesAtPosition.map((gate) => {
        const gateStatus = getGateStatus(gate);
        const effect = gateEffects[gate.id];
        const tooltip = getGateTooltip(gate);

        return (
          <Tooltip
            key={gate.id}
            label={tooltip}
            placement="top"
            hasArrow
            bg={useColorModeValue("gray.800", "gray.200")}
            color={useColorModeValue("white", "gray.800")}
            p={3}
            borderRadius="md"
            fontSize="xs"
            maxW="300px"
          >
            <Box
              position="relative"
              w="100%"
              h="100%"
              bg={
                gateStatus === "active"
                  ? activeGateBg
                  : gateStatus === "completed"
                  ? completedGateBg
                  : futureGateBg
              }
              opacity={
                gateStatus === "active"
                  ? 1
                  : gateStatus === "completed"
                  ? 0.8
                  : 0.5
              }
              borderRadius="md"
              borderWidth={gateStatus === "active" ? 2 : 1}
              borderColor={
                gateStatus === "active"
                  ? gateGlowColor
                  : gateStatus === "completed"
                  ? "blue.400"
                  : "gray.400"
              }
              boxShadow={
                gateStatus === "active"
                  ? `0 0 10px ${gateGlowColor}`
                  : gateStatus === "completed"
                  ? "0 2px 4px rgba(0,0,0,0.2)"
                  : "none"
              }
              animation={gateStatus === "active" ? "pulse 2s infinite" : "none"}
              transition="all 0.3s ease"
              cursor="pointer"
              onClick={() => onGateClick(gate.id)}
              _hover={{
                transform: "scale(1.05)",
                boxShadow:
                  gateStatus === "active"
                    ? `0 0 15px ${gateGlowColor}`
                    : "0 4px 8px rgba(0,0,0,0.3)",
                opacity: 1,
              }}
            >
              <CircuitGate
                gate={gate}
                isSelected={gate.id === selectedGateId}
                onClick={() => onGateClick(gate.id)}
                onRemove={() => onGateRemove(gate.id)}
                size={Math.max(parseInt(width, 10) - 8, 20)}
              />

              {/* Gate status indicator */}
              <Box
                position="absolute"
                top="-2px"
                right="-2px"
                w="6px"
                h="6px"
                borderRadius="full"
                bg={
                  gateStatus === "active"
                    ? "green.400"
                    : gateStatus === "completed"
                    ? "blue.400"
                    : "gray.400"
                }
                borderWidth={1}
                borderColor="white"
              />

              {/* Gate effect indicator */}
              {effect && effect.change > 0.1 && (
                <Box
                  position="absolute"
                  bottom="-2px"
                  left="-2px"
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="orange.400"
                  borderWidth={1}
                  borderColor="white"
                />
              )}
            </Box>
          </Tooltip>
        );
      })}

      {/* Show placement indicator */}
      {selectedMobileGate && gatesAtPosition.length === 0 && (
        <Box
          position="absolute"
          top="2px"
          right="2px"
          w="8px"
          h="8px"
          borderRadius="full"
          bg="green.500"
          opacity={0.7}
        />
      )}
    </Box>
  );
};

export default GridCell;
