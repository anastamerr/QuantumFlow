import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Text,
  Box,
  Badge,
  useToast,
  Divider,
} from "@chakra-ui/react";
import {
  CustomGateDefinition,
  updateCustomGate,
} from "../../utils/customGateManager";

interface CustomGateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gate: CustomGateDefinition | null;
  onUpdate: () => void;
}

export default function CustomGateDetailsModal({
  isOpen,
  onClose,
  gate,
  onUpdate,
}: CustomGateDetailsModalProps) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [gateName, setGateName] = useState("");
  const [gateSymbol, setGateSymbol] = useState("");
  const [gateDescription, setGateDescription] = useState("");

  // Reset form when gate changes
  useEffect(() => {
    if (gate) {
      setGateName(gate.name);
      setGateSymbol(gate.symbol);
      setGateDescription(gate.description);
      setIsEditing(false);
    }
  }, [gate]);

  const handleSave = () => {
    if (!gate) return;

    if (!gateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your custom gate",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const result = updateCustomGate(gate.id, {
      name: gateName,
      symbol: gateSymbol || gateName.substring(0, 3).toUpperCase(),
      description: gateDescription,
    });

    if (result.success) {
      toast({
        title: "Custom gate updated",
        description: `"${gateName}" has been updated successfully.`,
        status: "success",
        duration: 3000,
      });
      setIsEditing(false);
      onUpdate();
    } else {
      toast({
        title: "Update failed",
        description: result.error,
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleCancel = () => {
    if (gate) {
      setGateName(gate.name);
      setGateSymbol(gate.symbol);
      setGateDescription(gate.description);
    }
    setIsEditing(false);
  };

  if (!gate) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEditing ? "Edit" : "View"} Custom Gate Details
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Gate Name</FormLabel>
              {isEditing ? (
                <Input
                  value={gateName}
                  onChange={(e) => setGateName(e.target.value)}
                  placeholder="e.g., My Custom Gate"
                />
              ) : (
                <Text fontWeight="medium">{gate.name}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Symbol</FormLabel>
              {isEditing ? (
                <>
                  <Input
                    value={gateSymbol}
                    onChange={(e) =>
                      setGateSymbol(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., MCG"
                    maxLength={4}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Short symbol to display on the circuit (max 4 characters)
                  </Text>
                </>
              ) : (
                <Text fontWeight="medium">{gate.symbol}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              {isEditing ? (
                <Textarea
                  value={gateDescription}
                  onChange={(e) => setGateDescription(e.target.value)}
                  placeholder="Describe what this gate does..."
                  rows={3}
                />
              ) : (
                <Text>{gate.description || "No description provided"}</Text>
              )}
            </FormControl>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Composed Gates:
              </Text>
              <Box p={3} bg="gray.50" borderRadius="md">
                <VStack align="stretch" spacing={1}>
                  {gate.composedGates.map((g, index) => (
                    <Text key={g.id} fontSize="sm">
                      {index + 1}.{" "}
                      <Badge colorScheme="blue" mr={2}>
                        {g.type.toUpperCase()}
                      </Badge>
                      {g.params &&
                        Object.entries(g.params).map(([k, v]) => (
                          <Text
                            as="span"
                            key={k}
                            fontSize="xs"
                            color="gray.600"
                          >
                            {k}={v}{" "}
                          </Text>
                        ))}
                    </Text>
                  ))}
                </VStack>
              </Box>
            </Box>

            <Box fontSize="xs" color="gray.500">
              <Text>
                <strong>Created:</strong>{" "}
                {new Date(gate.createdAt).toLocaleString()}
              </Text>
              <Text>
                <strong>ID:</strong> {gate.id}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          {isEditing ? (
            <>
              <Button variant="ghost" mr={3} onClick={handleCancel}>
                Cancel
              </Button>
              <Button colorScheme="purple" onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button colorScheme="purple" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
