import {
  Box,
  Text,
  Tooltip,
  useColorModeValue,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useDrag } from "react-dnd";
import { useDispatch } from "react-redux";
import { addGate } from "../../store/slices/circuitSlice";
import {
  selectSelectedMobileGate,
  setSelectedMobileGate,
} from "../../store/slices/uiSlice";
import { Gate } from "../../types/circuit";
import { useSelector } from "react-redux";
import { selectQubits } from "../../store/slices/circuitSlice";

interface GateItemProps {
  gate: {
    id: string;
    name: string;
    symbol: string;
    description: string;
    category: string;
    color: string;
    params?: {
      name: string;
      type: "number" | "angle" | "select";
      default: number | string;
      options?: string[];
      min?: number;
      max?: number;
      step?: number;
    }[];
    targets?: number;
    controls?: number;
  };
}

const GateItem = ({ gate }: GateItemProps) => {
  const dispatch = useDispatch();
  const qubits = useSelector(selectQubits);
  const selectedMobileGate = useSelector(selectSelectedMobileGate);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue(`${gate.color}.50`, `${gate.color}.900`);
  const isSelected = selectedMobileGate === gate.id;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "gate",
    item: { gateType: gate.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleGateSelect = () => {
    if (isMobile) {
      if (selectedMobileGate === gate.id) {
        // Deselect if already selected
        dispatch(setSelectedMobileGate(null));
      } else {
        // Select this gate
        dispatch(setSelectedMobileGate(gate.id));
      }
    }
  };

  // Unified drag and drop component with mobile tap-to-select support
  return (
    <Tooltip
      label={
        isMobile
          ? isSelected
            ? "Tap again to deselect"
            : `Tap to select ${gate.name}`
          : gate.description
      }
      placement="right"
    >
      <Box
        ref={drag}
        p={2}
        borderWidth={isSelected ? 2 : 1}
        borderRadius="md"
        borderColor={isSelected ? `${gate.color}.500` : borderColor}
        bg={isSelected ? `${gate.color}.100` : bg}
        opacity={isDragging ? 0.5 : 1}
        cursor={isMobile ? "pointer" : "grab"}
        _hover={{ bg: isSelected ? `${gate.color}.200` : hoverBg }}
        className="gate"
        display="flex"
        alignItems="center"
        justifyContent="flex-start"
        w="100%"
        userSelect="none"
        minH={isMobile ? "40px" : "auto"}
        onClick={handleGateSelect}
      >
        <Box
          w={isMobile ? "20px" : "30px"}
          h={isMobile ? "20px" : "30px"}
          borderRadius="md"
          bg={`${gate.color}.500`}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="bold"
          fontSize={isMobile ? "xs" : "sm"}
          mr={2}
          flexShrink={0}
        >
          {gate.symbol}
        </Box>
        <Text fontSize={isMobile ? "xs" : "sm"}>{gate.name}</Text>
        {isMobile && isSelected && (
          <Box ml="auto" color={`${gate.color}.600`}>
            <Text fontSize="xs" fontWeight="bold">
              Selected
            </Text>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default GateItem;
