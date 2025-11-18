import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Flex,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  SimpleGrid,
} from "@chakra-ui/react";
import { QuantumState } from "../../utils/stateEvolution";
import {
  stateVectorToBloch,
  BlochCoordinates,
} from "../../utils/blochSphereUtils";
import BlochSphereVisualization from "./BlochSphereVisualizer";
import { Gate, Qubit } from "../../types/circuit";

/**
 * Component for displaying multiple Bloch spheres, one for each qubit
 * Perfect for Time Machine visualization
 */
interface MultiQubitBlochSpheresProps {
  qubits: Qubit[];
  quantumState: QuantumState;
  currentStep: number;
  gate: Gate | null;
  height?: number;
  showControls?: boolean;
}

const MultiQubitBlochSpheres: React.FC<MultiQubitBlochSpheresProps> = ({
  qubits,
  quantumState,
  currentStep,
  gate,
  height = 300,
  showControls = true,
}) => {
  const [blochCoordinates, setBlochCoordinates] = useState<BlochCoordinates[]>(
    []
  );

  // Calculate Bloch coordinates for each qubit
  useEffect(() => {
    const coords: BlochCoordinates[] = [];

    for (let i = 0; i < qubits.length; i++) {
      const blochCoords = stateVectorToBloch(quantumState, i);
      coords.push(blochCoords || { x: 0, y: 0, z: 1 }); // Default to |0⟩ state
    }

    setBlochCoordinates(coords);
  }, [quantumState, qubits.length]);

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headingColor = useColorModeValue("gray.700", "gray.200");

  if (qubits.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="md" color={headingColor}>
          No Qubits Available
        </Heading>
        <Text mt={2}>Add qubits to see Bloch sphere visualizations</Text>
      </Box>
    );
  }

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="sm"
    >
      <CardBody p={4}>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="sm" color={headingColor}>
              Quantum State Visualization
            </Heading>
            <HStack spacing={2}>
              <Badge colorScheme="purple" variant="subtle">
                {qubits.length} Qubit{qubits.length !== 1 ? "s" : ""}
              </Badge>
              {gate && (
                <Badge colorScheme="blue" variant="subtle">
                  {gate.type.toUpperCase()}
                </Badge>
              )}
              <Badge colorScheme="green" variant="subtle">
                Step {currentStep + 1}
              </Badge>
            </HStack>
          </Flex>

          {/* Current gate info */}
          {gate && (
            <Box
              p={3}
              bg={useColorModeValue("blue.50", "blue.900")}
              borderRadius="md"
              borderLeftWidth={4}
              borderLeftColor="blue.400"
            >
              <Text fontWeight="medium" fontSize="sm">
                {gate.type.toUpperCase()} Gate Applied
              </Text>
              <Text fontSize="xs" color="gray.600">
                {gate.targets && gate.targets.length > 0
                  ? `Targets: ${gate.targets.join(", ")}`
                  : `Qubit: ${gate.qubit}`}
                {gate.controls && gate.controls.length > 0
                  ? `, Controls: ${gate.controls.join(", ")}`
                  : ""}
              </Text>
            </Box>
          )}

          {/* Bloch Spheres Grid */}
          <SimpleGrid
            columns={Math.min(qubits.length, 3)}
            spacing={4}
            justifyItems="center"
          >
            {qubits.map((qubit, index) => (
              <Box key={qubit.id} textAlign="center">
                <BlochSphereVisualization
                  stateVector={quantumState}
                  qubitIndex={index}
                  width={Math.min(250, Math.floor(height * 0.8))}
                  height={Math.min(250, Math.floor(height * 0.8))}
                  title={`${qubit.name}`}
                />

                {/* Qubit state info */}
                <Box mt={2}>
                  <Text fontSize="xs" fontWeight="medium" color={headingColor}>
                    Qubit {qubit.name}
                  </Text>
                  {blochCoordinates[index] && (
                    <Text fontSize="xs" color="gray.500">
                      ({blochCoordinates[index].x.toFixed(2)},{" "}
                      {blochCoordinates[index].y.toFixed(2)},{" "}
                      {blochCoordinates[index].z.toFixed(2)})
                    </Text>
                  )}
                </Box>
              </Box>
            ))}
          </SimpleGrid>

          {/* State interpretation */}
          <Box
            p={3}
            bg={useColorModeValue("gray.50", "gray.700")}
            borderRadius="md"
          >
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Current State Analysis
            </Text>
            <VStack spacing={1} align="stretch">
              {qubits.map((qubit, index) => {
                const coords = blochCoordinates[index];
                if (!coords) return null;

                // Simple state interpretation
                let state = "|0⟩";
                if (coords.z < -0.8) state = "|1⟩";
                else if (coords.z > 0.8) state = "|0⟩";
                else if (Math.abs(coords.x) > 0.7) state = "|+⟩";
                else if (Math.abs(coords.y) > 0.7)
                  state = state.includes("i") ? "|i⟩" : "|-i⟩";
                else state = "Superposition";

                return (
                  <Text key={qubit.id} fontSize="xs">
                    {qubit.name}: {state} (Polar:{" "}
                    {(Math.acos(coords.z) * 180) / Math.PI < 90
                      ? "North"
                      : "South"}{" "}
                    Hemisphere)
                  </Text>
                );
              })}
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default MultiQubitBlochSpheres;
