import React, { useState, useMemo } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import { selectQubits } from "../../store/slices/circuitSlice";
import {
  selectSelectedMobileGate,
  setSelectedMobileGate,
} from "../../store/slices/uiSlice";
import { gateLibrary } from "../../utils/gateLibrary";

interface GatePickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const GatePickerDrawer: React.FC<GatePickerDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const selectedMobileGate = useSelector(selectSelectedMobileGate);
  const [searchQuery, setSearchQuery] = useState("");

  const gatesByCategory = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? gateLibrary.filter(
          (gate) =>
            gate.name.toLowerCase().includes(query) ||
            gate.description.toLowerCase().includes(query) ||
            gate.category.toLowerCase().includes(query) ||
            gate.symbol.toLowerCase().includes(query)
        )
      : gateLibrary;

    const grouped: Record<string, typeof gateLibrary> = {};
    filtered.forEach((gate) => {
      if (!grouped[gate.category]) {
        grouped[gate.category] = [];
      }
      grouped[gate.category].push(gate);
    });
    return grouped;
  }, [searchQuery]);

  const handleGateClick = (gateId: string) => {
    if (selectedMobileGate === gateId) {
      dispatch(setSelectedMobileGate(null));
    } else {
      dispatch(setSelectedMobileGate(gateId));
      setSearchQuery("");
      onClose();
    }
  };

  const handleClose = () => {
    dispatch(setSelectedMobileGate(null));
    setSearchQuery("");
    onClose();
  };

  const selectedGate = gateLibrary.find((g) => g.id === selectedMobileGate);
  const totalGates = Object.values(gatesByCategory).flat().length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="full"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        maxH="80vh"
        borderTopRadius="24px"
        bg="white"
        _dark={{ bg: "gray.800" }}
        m={0}
      >
        <IconButton
          aria-label="Close drawer"
          icon={<CloseIcon />}
          onClick={handleClose}
          position="absolute"
          top="20px"
          right="20px"
          size="lg"
          variant="ghost"
          colorScheme="gray"
          borderRadius="full"
          zIndex="20"
          _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
        />

        <Box
          position="sticky"
          top="0"
          zIndex="10"
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderTopRadius="24px"
          borderBottom="1px solid"
          borderColor="gray.200"
          pt="24px"
          pb="16px"
          px="24px"
        >
          <VStack spacing="16px" align="stretch">
            <HStack justify="space-between">
              <Box>
                <Heading size="lg" mb="4px">
                  Quantum Gates
                </Heading>
                <HStack spacing="8px">
                  <Badge colorScheme="green">{totalGates} Available</Badge>
                  {selectedGate && (
                    <Badge colorScheme="blue">{selectedGate.name}</Badge>
                  )}
                </HStack>
              </Box>
              {selectedMobileGate && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => dispatch(setSelectedMobileGate(null))}
                >
                  Clear
                </Button>
              )}
            </HStack>

            <InputGroup>
              <InputLeftElement>
                <Icon as={SearchIcon} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search gates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="12px"
              />
            </InputGroup>
          </VStack>
        </Box>

        {/* Scrollable Content */}
        <Box
          role="region"
          aria-label="Gates list"
          tabIndex={0}
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          style={{
            height: "calc(80vh - 140px)",
            overflowY: "auto",
            touchAction: "pan-y",
          }}
          px="24px"
          py="16px"
          css={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {totalGates === 0 ? (
            <Box textAlign="center" py="60px">
              <Text color="gray.500" fontSize="lg" mb="8px">
                No gates found
              </Text>
              <Text color="gray.400" fontSize="sm">
                Try a different search term
              </Text>
            </Box>
          ) : (
            <VStack spacing="32px" align="stretch" pb="24px">
              {Object.entries(gatesByCategory).map(([category, gates]) => (
                <Box key={category}>
                  <HStack mb="12px">
                    <Heading
                      size="md"
                      color="gray.700"
                      _dark={{ color: "gray.200" }}
                    >
                      {category}
                    </Heading>
                    <Badge colorScheme="purple">{gates.length}</Badge>
                  </HStack>

                  <VStack spacing="12px" align="stretch">
                    {gates.map((gate) => {
                      const isSelected = selectedMobileGate === gate.id;
                      return (
                        <Box
                          key={gate.id}
                          p="16px"
                          borderWidth="2px"
                          borderColor={isSelected ? "blue.500" : "gray.200"}
                          _dark={{
                            borderColor: isSelected ? "blue.400" : "gray.600",
                          }}
                          borderRadius="12px"
                          bg={isSelected ? "blue.50" : "transparent"}
                          cursor="pointer"
                          onClick={() => handleGateClick(gate.id)}
                        >
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing="4px" flex="1">
                              <HStack>
                                <Text fontWeight="bold">{gate.name}</Text>
                                <Badge colorScheme="purple" fontSize="xs">
                                  {gate.symbol}
                                </Badge>
                              </HStack>
                              <Text
                                fontSize="sm"
                                color="gray.600"
                                _dark={{ color: "gray.400" }}
                              >
                                {gate.description}
                              </Text>
                            </VStack>

                            <Button
                              size="sm"
                              colorScheme={isSelected ? "blue" : "gray"}
                              variant={isSelected ? "solid" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGateClick(gate.id);
                              }}
                              minW="80px"
                            >
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              ))}

              {selectedMobileGate ? (
                <Box
                  p="16px"
                  bg="blue.50"
                  _dark={{ bg: "blue.900" }}
                  borderRadius="12px"
                  textAlign="center"
                >
                  <Text fontWeight="semibold" color="blue.600" mb="4px">
                    ✓ {selectedGate?.name} Selected
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb="12px">
                    Tap an empty circuit cell to place the gate
                  </Text>
                  <Button size="sm" colorScheme="blue" onClick={handleClose}>
                    Done
                  </Button>
                </Box>
              ) : (
                <Box
                  p="16px"
                  bg="gray.50"
                  _dark={{ bg: "gray.700" }}
                  borderRadius="12px"
                  textAlign="center"
                >
                  <Text fontSize="sm" color="gray.600">
                    Select a gate to place it on your circuit
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default GatePickerDrawer;
