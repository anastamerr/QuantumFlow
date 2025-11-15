import {
  Box,
  VStack,
  Heading,
  Divider,
  Text,
  useColorModeValue,
  InputGroup,
  Input,
  InputLeftElement,
  Icon,
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  addQubit,
  removeQubit,
  selectQubits,
} from "../../store/slices/circuitSlice";
import GateItem from "../gates/GateItem";
import { gateLibrary } from "../../utils/gateLibrary";
import {
  loadCustomGates,
  CustomGateDefinition,
  isCustomGate,
} from "../../utils/customGateManager";
import CustomGateCreator from "../common/CustomGateCreator";
import CustomGateMenu from "../common/CustomGateMenu";
import CustomGateDetailsModal from "../common/CustomGateDetailsModal";
import { SearchIcon } from "@chakra-ui/icons";
import { useState, useEffect, useMemo } from "react";

const Sidebar = () => {
  const dispatch = useDispatch();
  const qubits = useSelector(selectQubits);
  const bg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const searchBg = useColorModeValue("white", "gray.800");
  const searchBorder = useColorModeValue("gray.300", "gray.600");

  // State for search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [allGates, setAllGates] = useState(() => [
    ...gateLibrary,
    ...loadCustomGates(),
  ]);
  const [searchResults, setSearchResults] = useState(allGates);
  const [selectedGate, setSelectedGate] = useState<CustomGateDefinition | null>(
    null
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Reload custom gates function
  const reloadCustomGates = () => {
    const customGates = loadCustomGates();
    const combined = [...gateLibrary, ...customGates];
    setAllGates(combined);
    setSearchResults(combined);
  };

  // Load custom gates on mount
  useEffect(() => {
    reloadCustomGates();
  }, []);

  const handleAddQubit = () => {
    dispatch(addQubit());
  };

  const handleRemoveQubit = () => {
    if (qubits.length > 0) {
      // Remove the last qubit (highest ID)
      const lastQubitId = Math.max(...qubits.map((q) => q.id));
      dispatch(removeQubit(lastQubitId));
    }
  };

  // Filter gates based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If search is empty, show all gates
      setSearchResults(allGates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allGates.filter(
        (gate) =>
          gate.name.toLowerCase().includes(query) ||
          gate.description.toLowerCase().includes(query) ||
          gate.category.toLowerCase().includes(query) ||
          gate.symbol.toLowerCase().includes(query)
      );
      setSearchResults(filtered);
    }
  }, [searchQuery, allGates]);

  // Group gates by category
  const gatesByCategory = useMemo(() => {
    const grouped: Record<string, typeof gateLibrary> = {};
    searchResults.forEach((gate) => {
      if (!grouped[gate.category]) {
        grouped[gate.category] = [];
      }
      grouped[gate.category].push(gate);
    });
    return grouped;
  }, [searchResults]);

  const handleEditGate = (gate: CustomGateDefinition) => {
    setSelectedGate(gate);
    onOpen();
  };

  const handleDeleteGate = () => {
    reloadCustomGates();
  };

  const handleUpdateGate = () => {
    reloadCustomGates();
  };

  return (
    <Box
      w="250px"
      h="100%"
      bg={bg}
      p={4}
      borderRightWidth={1}
      borderColor={borderColor}
      overflowY="auto"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="md">Gate Palette</Heading>

        {/* Search Bar */}
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <Icon as={SearchIcon} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search gates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            borderRadius="md"
            bg={searchBg}
            borderColor={searchBorder}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
            }}
          />
        </InputGroup>

        {searchResults.length === 0 && searchQuery !== "" && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
            No gates found matching "{searchQuery}"
          </Text>
        )}

        <Box>
          <Heading size="sm" mb={2}>
            Circuit Controls
          </Heading>
          <VStack spacing={2} align="stretch">
            <Box
              p={2}
              borderWidth={1}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: "blue.50" }}
              onClick={handleAddQubit}
            >
              Add Qubit
            </Box>
            <Box
              p={2}
              borderWidth={1}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: "red.50" }}
              onClick={handleRemoveQubit}
            >
              Remove Last Qubit
            </Box>
            <CustomGateCreator />
          </VStack>
        </Box>

        <Divider />

        {/* Gate Categories with Filter Applied */}
        {Object.entries(gatesByCategory).map(([category, gates]) => (
          <Box key={category}>
            <Heading size="sm" mb={2}>
              {category}
            </Heading>
            <VStack spacing={2} align="stretch">
              {gates.map((gate) => (
                <HStack key={gate.id} spacing={0} position="relative">
                  <Box flex="1">
                    <GateItem gate={gate} />
                  </Box>
                  {isCustomGate(gate) && (
                    <Box
                      position="absolute"
                      right={1}
                      top="50%"
                      transform="translateY(-50%)"
                      zIndex={10}
                    >
                      <CustomGateMenu
                        gate={gate}
                        onEdit={handleEditGate}
                        onDelete={handleDeleteGate}
                      />
                    </Box>
                  )}
                </HStack>
              ))}
            </VStack>
          </Box>
        ))}

        {/* Show search tips if actively searching */}
        {searchQuery.trim() !== "" && (
          <Box
            mt={2}
            p={3}
            bg={useColorModeValue("blue.50", "blue.900")}
            borderRadius="md"
          >
            <Text
              fontSize="xs"
              color={useColorModeValue("blue.700", "blue.300")}
            >
              Search by name, symbol, or description. Clear the search to see
              all gates.
            </Text>
          </Box>
        )}
      </VStack>

      <CustomGateDetailsModal
        isOpen={isOpen}
        onClose={onClose}
        gate={selectedGate}
        onUpdate={handleUpdateGate}
      />
    </Box>
  );
};

export default Sidebar;
