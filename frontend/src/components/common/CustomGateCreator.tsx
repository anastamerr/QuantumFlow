import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Text,
  Badge,
} from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import { selectGates } from "../../store/slices/circuitSlice";
import {
  createCustomGate,
  saveCustomGate,
  validateSingleQubitCircuit,
} from "../../utils/customGateManager";

export default function CustomGateCreator() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const gates = useSelector(selectGates);
  const toast = useToast();

  const [gateName, setGateName] = useState("");
  const [gateSymbol, setGateSymbol] = useState("");
  const [gateDescription, setGateDescription] = useState("");

  const validation = validateSingleQubitCircuit(gates);

  const handleCreate = () => {
    if (!gateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your custom gate",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const result = createCustomGate(
      gateName,
      gateSymbol,
      gateDescription,
      gates
    );

    if (result.success && result.gate) {
      saveCustomGate(result.gate);
      toast({
        title: "Custom gate created!",
        description: `"${gateName}" has been saved and is now available in the gate palette.`,
        status: "success",
        duration: 5000,
      });

      // Reset form
      setGateName("");
      setGateSymbol("");
      setGateDescription("");
      onClose();

      // Trigger page reload to update gate library
      window.location.reload();
    } else {
      toast({
        title: "Failed to create custom gate",
        description: result.error,
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Box>
      <Button
        colorScheme="purple"
        size="sm"
        width="100%"
        onClick={onOpen}
        isDisabled={!validation.valid}
      >
        Create Custom Gate
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="560px" maxH="90vh">
          <ModalHeader>Create Custom Gate</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" maxH="calc(90vh - 140px)">
            <VStack spacing={4} align="stretch">
              {validation.valid ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertDescription>
                      Your circuit contains{" "}
                      <Badge colorScheme="green">{gates.length}</Badge>{" "}
                      single-qubit gate(s). This can be saved as a custom gate!
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertDescription>{validation.error}</AlertDescription>
                  </Box>
                </Alert>
              )}

              <FormControl isRequired>
                <FormLabel>Gate Name</FormLabel>
                <Input
                  placeholder="e.g., My Custom Gate"
                  value={gateName}
                  onChange={(e) => setGateName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Symbol (optional)</FormLabel>
                <Input
                  placeholder="e.g., MCG"
                  maxLength={4}
                  value={gateSymbol}
                  onChange={(e) => setGateSymbol(e.target.value.toUpperCase())}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Short symbol to display on the circuit (max 4 characters)
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Description (optional)</FormLabel>
                <Textarea
                  placeholder="Describe what this gate does..."
                  value={gateDescription}
                  onChange={(e) => setGateDescription(e.target.value)}
                  rows={3}
                />
              </FormControl>

              <Box
                p={3}
                bg="gray.50"
                borderRadius="md"
                maxH="220px"
                overflowY="auto"
              >
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Current Circuit Gates:
                </Text>
                {gates.length === 0 ? (
                  <Text fontSize="sm" color="gray.500">
                    No gates in circuit
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={1}>
                    {gates.map((gate, index) => (
                      <Text key={gate.id} fontSize="xs">
                        {index + 1}.{" "}
                        {(gate as any).name || gate.type.toUpperCase()}
                        {gate.params &&
                          ` (${Object.entries(gate.params)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")})`}
                      </Text>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreate}
              isDisabled={!validation.valid || !gateName.trim()}
            >
              Create Gate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
