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
  useBreakpointValue,
  IconButton,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  addQubit,
  removeQubit,
  selectQubits,
} from "../../store/slices/circuitSlice";
import { selectShowSidebar, toggleSidebar } from "../../store/slices/uiSlice";
import GateItem from "../gates/GateItem";
import { gateLibrary } from "../../utils/gateLibrary";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import { useState, useEffect, useMemo } from "react";

const Sidebar = () => {
  const dispatch = useDispatch();
  const qubits = useSelector(selectQubits);
  const showSidebar = useSelector(selectShowSidebar);
  const bg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(gateLibrary);

  const handleAddQubit = () => {
    dispatch(addQubit());
  };

  const handleRemoveQubit = () => {
    if (qubits.length > 0) {
      const lastQubitId = Math.max(...qubits.map((q) => q.id));
      dispatch(removeQubit(lastQubitId));
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(gateLibrary);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = gateLibrary.filter(
        (gate) =>
          gate.name.toLowerCase().includes(query) ||
          gate.description.toLowerCase().includes(query) ||
          gate.category.toLowerCase().includes(query) ||
          gate.symbol.toLowerCase().includes(query)
      );
      setSearchResults(filtered);
    }
  }, [searchQuery]);

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

  if (isDesktop) {
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
        <SidebarContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          gatesByCategory={gatesByCategory}
          onAddQubit={handleAddQubit}
          onRemoveQubit={handleRemoveQubit}
        />
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bg}
      borderTopWidth={1}
      borderColor={borderColor}
      boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
      zIndex={1000}
      maxH="60vh"
      overflowY="auto"
      transform={`translateY(${showSidebar ? "0%" : "100%"})`}
      transition="transform 0.3s ease-in-out"
    >
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={2}
        cursor="pointer"
        onClick={() => dispatch(toggleSidebar())}
        _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
      >
        <Box
          w="40px"
          h="4px"
          bg={useColorModeValue("gray.400", "gray.500")}
          borderRadius="full"
        />
      </Box>

      <Box position="absolute" top={2} right={2}>
        <IconButton
          aria-label="Close drawer"
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          onClick={() => dispatch(toggleSidebar())}
        />
      </Box>

      <Box p={4} pt={2}>
        <SidebarContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          gatesByCategory={gatesByCategory}
          onAddQubit={handleAddQubit}
          onRemoveQubit={handleRemoveQubit}
        />
      </Box>
    </Box>
  );
};

interface SidebarContentProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: typeof gateLibrary;
  gatesByCategory: Record<string, typeof gateLibrary>;
  onAddQubit: () => void;
  onRemoveQubit: () => void;
}

const SidebarContent = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  gatesByCategory,
  onAddQubit,
  onRemoveQubit,
}: SidebarContentProps) => {
  const searchBg = useColorModeValue("white", "gray.800");
  const searchBorder = useColorModeValue("gray.300", "gray.600");

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Gate Palette</Heading>

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
        {searchQuery && (
          <IconButton
            aria-label="Clear search"
            icon={<CloseIcon />}
            size="xs"
            variant="ghost"
            position="absolute"
            right={1}
            top={1}
            zIndex={2}
            onClick={() => setSearchQuery("")}
          />
        )}
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
            onClick={onAddQubit}
          >
            Add Qubit
          </Box>
          <Box
            p={2}
            borderWidth={1}
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: "red.50" }}
            onClick={onRemoveQubit}
          >
            Remove Last Qubit
          </Box>
        </VStack>
      </Box>

      <Divider />

      {Object.entries(gatesByCategory).map(([category, gates]) => (
        <Box key={category}>
          <Heading size="sm" mb={2}>
            {category}
          </Heading>
          <VStack spacing={2} align="stretch">
            {gates.map((gate) => (
              <GateItem key={gate.id} gate={gate} />
            ))}
          </VStack>
        </Box>
      ))}

      {searchQuery.trim() !== "" && (
        <Box
          mt={2}
          p={3}
          bg={useColorModeValue("blue.50", "blue.900")}
          borderRadius="md"
        >
          <Text fontSize="xs" color={useColorModeValue("blue.700", "blue.300")}>
            Search by name, symbol, or description. Clear the search to see all
            gates.
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default Sidebar;
