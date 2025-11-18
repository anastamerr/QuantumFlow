import React, { useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  useColorModeValue,
  Button,
  Card,
  CardHeader,
  CardBody,
  Image,
  useToast,
  Flex,
  Switch,
  FormControl,
  FormLabel,
  Code,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { selectQubits, selectGates } from '../../store/slices/circuitSlice';
import { RepeatIcon } from '@chakra-ui/icons';
import { transformStoreGatesToCircuitGates } from '../../utils/circuitUtils';

type VisualizationMode = 'fast' | 'high-quality';

const MplCircuitPanel: React.FC = () => {
  const qubits = useSelector(selectQubits);
  const storeGates = useSelector(selectGates);
  const toast = useToast();
  const [imageData, setImageData] = useState<string | null>(null);
  const [textData, setTextData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<VisualizationMode>('fast');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const accentColor = useColorModeValue('blue.600', 'blue.300');
  const errorBg = useColorModeValue('red.50', 'red.900');
  const errorColor = useColorModeValue('red.600', 'red.300');

  // Transform store gates to circuit gates
  const gates = transformStoreGatesToCircuitGates(storeGates);

  const buildPayload = useCallback(() => {
    return {
      num_qubits: qubits.length,
      gates: storeGates.map(({ id, ...gate }) => ({
        type: gate.type,
        qubit: gate.qubit,
        position: gate.position,
        params: gate.params,
        targets: gate.targets,
        controls: gate.controls,
      })),
      shots: 1024,
      memory: false,
    };
  }, [qubits, storeGates]);

  const fetchTextCircuit = useCallback(async () => {
    if (qubits.length === 0 || gates.length === 0) {
      setTextData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setImageData(null);

    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      if (!base) {
        throw new Error('API base URL is not configured');
      }

      const payload = buildPayload();
      const response = await fetch(`${base}/api/text-circuit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Backend error ${response.status}: ${text}`);
      }

      const textOutput = await response.text();
      setTextData(textOutput);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching text circuit:', err);
      setError(err instanceof Error ? err.message : 'Failed to load circuit visualization');
      setIsLoading(false);
      setTextData(null);
    }
  }, [qubits, gates, buildPayload]);

  const fetchMplImage = useCallback(async () => {
    if (qubits.length === 0 || gates.length === 0) {
      setImageData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTextData(null);

    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      if (!base) {
        throw new Error('API base URL is not configured');
      }

      const payload = buildPayload();
      const response = await fetch(`${base}/api/mpl-circuit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Backend error ${response.status}: ${text}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setImageData(base64data);
        setIsLoading(false);
      };
      reader.onerror = () => {
        throw new Error('Failed to read image data');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error fetching MPL circuit image:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load circuit visualization';
      setError(errorMsg);
      setIsLoading(false);
      setImageData(null);
      
      // Show friendly error message
      if (errorMsg.includes('Failed to generate circuit image') || 
          errorMsg.includes('4') || 
          errorMsg.includes('5')) {
        toast({
          title: 'Visualization unavailable',
          description: 'Try switching to Fast Mode for instant rendering.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }, [qubits, gates, buildPayload, toast]);

  const handleRefresh = useCallback(() => {
    if (mode === 'fast') {
      fetchTextCircuit();
    } else {
      fetchMplImage();
    }
  }, [mode, fetchTextCircuit, fetchMplImage]);

  const handleModeChange = useCallback((newMode: VisualizationMode) => {
    setMode(newMode);
    setError(null);
    // Don't auto-fetch on mode change, wait for explicit refresh
  }, []);

  return (
    <Box h="100%" overflowY="auto" overflowX="hidden" pr={{ base: 0, md: 1 }}>
      <Card mb={4} borderRadius="lg" boxShadow="sm" bg={cardBg}>
        <CardHeader pb={0}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            <HStack>
              <Heading size="md">Circuit Visualization</Heading>
            </HStack>
            <HStack spacing={4}>
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel htmlFor="viz-mode" mb={0} fontSize="sm" mr={2}>
                  Fast Mode
                </FormLabel>
                <Switch
                  id="viz-mode"
                  isChecked={mode === 'high-quality'}
                  onChange={(e) => handleModeChange(e.target.checked ? 'high-quality' : 'fast')}
                  colorScheme="blue"
                />
                <FormLabel htmlFor="viz-mode" mb={0} fontSize="sm" ml={2}>
                  High Quality
                </FormLabel>
              </FormControl>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleRefresh}
                isLoading={isLoading}
                loadingText="Loading"
                leftIcon={<RepeatIcon />}
                isDisabled={qubits.length === 0 || gates.length === 0}
              >
                Refresh Visualization
              </Button>
            </HStack>
          </Flex>
        </CardHeader>

        <CardBody>
          {qubits.length === 0 || gates.length === 0 ? (
            <VStack spacing={4} justify="center" h="300px">
              <Text color="gray.500" textAlign="center" fontWeight="medium">
                No circuit to display
              </Text>
              <Text fontSize="sm" color="gray.400" textAlign="center">
                Add gates to your circuit to see the visualization.
              </Text>
            </VStack>
          ) : isLoading ? (
            <VStack spacing={4} justify="center" h="300px">
              <Spinner size="xl" thickness="4px" color="blue.500" />
              <Text fontWeight="medium">
                {mode === 'fast' ? 'Generating text visualization...' : 'Generating high-quality visualization...'}
              </Text>
            </VStack>
          ) : error ? (
            <VStack spacing={4} justify="center" h="300px">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Visualization unavailable</Text>
                  <Text fontSize="sm">Try switching to Fast Mode for instant rendering.</Text>
                </Box>
              </Alert>
              <Button colorScheme="blue" onClick={handleRefresh} leftIcon={<RepeatIcon />}>
                Retry
              </Button>
            </VStack>
          ) : mode === 'fast' && textData ? (
            <Box
              overflow="auto"
              maxH="calc(100vh - 300px)"
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              p={4}
              bg={useColorModeValue('white', 'gray.900')}
            >
              <Code
                display="block"
                whiteSpace="pre"
                fontFamily="monospace"
                fontSize="sm"
                p={2}
                bg={useColorModeValue('gray.50', 'gray.800')}
                borderRadius="md"
              >
                {textData}
              </Code>
            </Box>
          ) : mode === 'high-quality' && imageData ? (
            <Box
              overflow="auto"
              maxH="calc(100vh - 300px)"
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              p={4}
              bg={useColorModeValue('white', 'gray.900')}
            >
              <Image
                src={imageData}
                alt="Quantum Circuit Visualization"
                maxW="100%"
                h="auto"
                objectFit="contain"
              />
            </Box>
          ) : (
            <VStack spacing={4} justify="center" h="300px">
              <Text color="gray.500" textAlign="center" fontWeight="medium">
                Click "Refresh Visualization" to generate circuit view
              </Text>
              <Text fontSize="sm" color="gray.400" textAlign="center">
                Visualization is only generated on demand to improve performance.
              </Text>
            </VStack>
          )}

          {(textData || imageData) && (
            <Box mt={4} p={3} borderRadius="md" bg={accentBg}>
              <Text fontSize="sm" color={accentColor}>
                {mode === 'fast'
                  ? 'Fast Mode: Instant ASCII text visualization. Switch to High Quality for detailed matplotlib rendering.'
                  : 'High Quality Mode: Optimized matplotlib visualization with caching for fast rendering.'}
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default MplCircuitPanel;
