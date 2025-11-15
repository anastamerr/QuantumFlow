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
  HStack,
  IconButton,
  Select,
} from "@chakra-ui/react";
import {
  AddIcon,
  DeleteIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";
import {
  CustomGateDefinition,
  updateCustomGate,
} from "../../utils/customGateManager";
import { gateLibrary } from "../../utils/gateLibrary";
import { Gate } from "../../types/circuit";

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
  const [composedGates, setComposedGates] = useState<Gate[]>([]);

  // Get only single-qubit gates from library
  const singleQubitGates = gateLibrary.filter((g) => !g.targets && !g.controls);

  // Reset form when gate changes
  useEffect(() => {
    if (gate) {
      setGateName(gate.name);
      setGateSymbol(gate.symbol);
      setGateDescription(gate.description);
      setComposedGates([...gate.composedGates]);
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

    if (composedGates.length === 0) {
      toast({
        title: "No gates",
        description: "Custom gate must contain at least one gate",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const result = updateCustomGate(gate.id, {
      name: gateName,
      symbol: gateSymbol || gateName.substring(0, 3).toUpperCase(),
      description: gateDescription,
      composedGates: composedGates,
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
      setComposedGates([...gate.composedGates]);
    }
    setIsEditing(false);
  };

  const handleAddGate = () => {
    const firstGate = singleQubitGates[0];
    if (!firstGate) return;

    const newGate: Gate = {
      id: `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: firstGate.id,
      qubit: 0,
      position: composedGates.length,
      params: {},
    };

    setComposedGates([...composedGates, newGate]);
  };

  const handleRemoveGate = (index: number) => {
    const updated = composedGates.filter((_, i) => i !== index);
    setComposedGates(updated);
  };

  const handleMoveGateUp = (index: number) => {
    if (index === 0) return;
    const updated = [...composedGates];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setComposedGates(updated);
  };

  const handleMoveGateDown = (index: number) => {
    if (index === composedGates.length - 1) return;
    const updated = [...composedGates];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setComposedGates(updated);
  };

  const handleChangeGateType = (index: number, newType: string) => {
    const updated = [...composedGates];
    const gateDefinition = singleQubitGates.find((g) => g.id === newType);

    if (gateDefinition) {
      updated[index] = {
        ...updated[index],
        type: newType,
        params: gateDefinition.params
          ? gateDefinition.params.reduce(
              (acc, param) => ({ ...acc, [param.name]: param.default }),
              {}
            )
          : {},
      };
      setComposedGates(updated);
    }
  };

  const handleChangeGateParam = (
    index: number,
    paramName: string,
    value: number | string
  ) => {
    const gateDefinition = singleQubitGates.find(
      (g) => g.id === composedGates[index].type
    );
    const paramDef = gateDefinition?.params?.find((p) => p.name === paramName);

    // Validate the value
    let validatedValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(validatedValue)) {
      validatedValue = (paramDef?.default as number) || 0;
    }

    // Apply min/max constraints
    if (paramDef) {
      if (paramDef.min !== undefined && validatedValue < paramDef.min) {
        validatedValue = paramDef.min;
        toast({
          title: "Value too low",
          description: `Minimum value for ${paramName} is ${paramDef.min}`,
          status: "warning",
          duration: 2000,
        });
      }
      if (paramDef.max !== undefined && validatedValue > paramDef.max) {
        validatedValue = paramDef.max;
        toast({
          title: "Value too high",
          description: `Maximum value for ${paramName} is ${paramDef.max}`,
          status: "warning",
          duration: 2000,
        });
      }
    }

    const updated = [...composedGates];
    updated[index] = {
      ...updated[index],
      params: {
        ...updated[index].params,
        [paramName]: validatedValue,
      },
    };
    setComposedGates(updated);
  };

  if (!gate) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="600px" maxH="90vh">
        <ModalHeader fontSize="2xl" fontWeight="bold" pb={2}>
          {isEditing ? "Edit" : "View"} Custom Gate Details
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto" maxH="calc(90vh - 140px)">
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="md" fontWeight="semibold" mb={2}>
                Gate Name
              </FormLabel>
              {isEditing ? (
                <Input
                  value={gateName}
                  onChange={(e) => setGateName(e.target.value)}
                  placeholder="e.g., My Custom Gate"
                  fontSize="sm"
                />
              ) : (
                <Text fontSize="md" fontWeight="medium">
                  {gate.name}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel fontSize="md" fontWeight="semibold" mb={2}>
                Symbol
              </FormLabel>
              {isEditing ? (
                <>
                  <Input
                    value={gateSymbol}
                    onChange={(e) =>
                      setGateSymbol(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., MCG"
                    maxLength={4}
                    fontSize="sm"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Short symbol to display on the circuit (max 4 characters)
                  </Text>
                </>
              ) : (
                <Text fontSize="md">{gate.symbol}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel fontSize="md" fontWeight="semibold" mb={2}>
                Description
              </FormLabel>
              {isEditing ? (
                <Textarea
                  value={gateDescription}
                  onChange={(e) => setGateDescription(e.target.value)}
                  placeholder="Describe what this gate does..."
                  rows={3}
                  fontSize="sm"
                />
              ) : (
                <Text fontSize="sm" color="gray.700">
                  {gate.description || "No description provided"}
                </Text>
              )}
            </FormControl>

            <Divider />

            <Box>
              <HStack justify="space-between" mb={3}>
                <Text fontSize="lg" fontWeight="bold">
                  Composed Gates
                </Text>
                {isEditing && (
                  <Button
                    size="xs"
                    leftIcon={<AddIcon />}
                    colorScheme="green"
                    onClick={handleAddGate}
                  >
                    Add Gate
                  </Button>
                )}
              </HStack>

              {composedGates.length === 0 ? (
                <Box p={3} bg="gray.50" borderRadius="md" textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    No gates in this custom gate
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {composedGates.map((g, index) => {
                    const gateDefinition = singleQubitGates.find(
                      (def) => def.id === g.type
                    );

                    return (
                      <Box
                        key={`${g.id}-${index}`}
                        p={4}
                        bg="gray.50"
                        borderRadius="lg"
                        borderWidth={1}
                        borderColor="gray.300"
                        _hover={{ borderColor: "gray.400", shadow: "sm" }}
                        transition="all 0.2s"
                      >
                        <HStack spacing={3} align="flex-start">
                          <Text
                            fontSize="md"
                            fontWeight="bold"
                            minW="24px"
                            color="purple.600"
                          >
                            {index + 1}.
                          </Text>

                          <VStack flex="1" align="stretch" spacing={2}>
                            {isEditing ? (
                              <>
                                <Select
                                  size="sm"
                                  value={g.type}
                                  onChange={(e) =>
                                    handleChangeGateType(index, e.target.value)
                                  }
                                >
                                  {singleQubitGates.map((gateDef) => (
                                    <option key={gateDef.id} value={gateDef.id}>
                                      {gateDef.name} ({gateDef.symbol})
                                    </option>
                                  ))}
                                </Select>

                                {gateDefinition?.params &&
                                  gateDefinition.params.map((param) => (
                                    <HStack key={param.name} spacing={2}>
                                      <Text
                                        fontSize="sm"
                                        minW="60px"
                                        fontWeight="medium"
                                      >
                                        {param.name}:
                                      </Text>
                                      <Input
                                        size="sm"
                                        type="number"
                                        value={
                                          g.params?.[param.name] ||
                                          param.default
                                        }
                                        onChange={(e) =>
                                          handleChangeGateParam(
                                            index,
                                            param.name,
                                            e.target.value
                                          )
                                        }
                                        min={param.min}
                                        max={param.max}
                                        step={param.step}
                                        fontSize="sm"
                                      />
                                      {param.max && (
                                        <Text
                                          fontSize="xs"
                                          color="gray.500"
                                          minW="60px"
                                        >
                                          (0-{param.max})
                                        </Text>
                                      )}
                                    </HStack>
                                  ))}
                              </>
                            ) : (
                              <>
                                <HStack>
                                  <Badge
                                    colorScheme="blue"
                                    fontSize="sm"
                                    px={2}
                                    py={1}
                                  >
                                    {g.type.toUpperCase()}
                                  </Badge>
                                  {gateDefinition && (
                                    <Text
                                      fontSize="sm"
                                      color="gray.600"
                                      fontWeight="medium"
                                    >
                                      {gateDefinition.name}
                                    </Text>
                                  )}
                                </HStack>
                                {g.params &&
                                  Object.keys(g.params).length > 0 && (
                                    <Text fontSize="sm" color="gray.600">
                                      {Object.entries(g.params)
                                        .map(([k, v]) => `${k}=${v}`)
                                        .join(", ")}
                                    </Text>
                                  )}
                              </>
                            )}
                          </VStack>

                          {isEditing && (
                            <VStack spacing={1}>
                              <IconButton
                                aria-label="Move up"
                                icon={<ChevronUpIcon />}
                                size="xs"
                                isDisabled={index === 0}
                                onClick={() => handleMoveGateUp(index)}
                              />
                              <IconButton
                                aria-label="Move down"
                                icon={<ChevronDownIcon />}
                                size="xs"
                                isDisabled={index === composedGates.length - 1}
                                onClick={() => handleMoveGateDown(index)}
                              />
                              <IconButton
                                aria-label="Remove gate"
                                icon={<DeleteIcon />}
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleRemoveGate(index)}
                              />
                            </VStack>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
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
