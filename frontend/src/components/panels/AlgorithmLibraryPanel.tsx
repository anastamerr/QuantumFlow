import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Divider,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Tooltip,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Input,
  Flex
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { InfoIcon, AddIcon, ExternalLinkIcon, CheckIcon } from '@chakra-ui/icons';
import quantumAlgorithmLibrary from '../../utils/algorithmLibrary';
import { QuantumAlgorithm, AlgorithmParameter, AlgorithmResult } from '../../types/algorithm';
import { addGates } from '../../store/slices/circuitSlice';
import FullViewToggle from '../common/FullViewToggle';

const AlgorithmLibraryPanel = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<QuantumAlgorithm | null>(null);
  const [algorithmParams, setAlgorithmParams] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Debug algorithm library loading
  console.log('Algorithm library loaded:', quantumAlgorithmLibrary);
  console.log('Number of algorithms:', quantumAlgorithmLibrary.algorithms.length);
  console.log('Modal state - isOpen:', isOpen, 'selectedAlgorithm:', selectedAlgorithm?.name);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const categoryBg = useColorModeValue('blue.50', 'blue.900');
  const complexityBg = useColorModeValue('green.50', 'green.900');

  // Filter algorithms based on category and search
  const filteredAlgorithms = useMemo(() => {
    try {
      if (!quantumAlgorithmLibrary || !quantumAlgorithmLibrary.algorithms) {
        console.error('Algorithm library not loaded properly');
        return [];
      }
      
      let algorithms = quantumAlgorithmLibrary.algorithms;
      
      if (selectedCategory !== 'all') {
        algorithms = algorithms.filter(alg => alg.category === selectedCategory);
      }
      
      if (searchTerm) {
        algorithms = algorithms.filter(alg => 
          alg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alg.education.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alg.education.applications.some(app => 
            app.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
      
      console.log('Filtered algorithms:', algorithms.length);
      return algorithms;
    } catch (error) {
      console.error('Error filtering algorithms:', error);
      return [];
    }
  }, [selectedCategory, searchTerm]);

  // Initialize parameters for selected algorithm
  const initializeParameters = (algorithm: QuantumAlgorithm) => {
    console.log('Initializing algorithm:', algorithm.name);
    
    const params: Record<string, any> = {};
    algorithm.parameters.forEach(param => {
      params[param.name] = param.defaultValue;
    });
    
    console.log('Algorithm parameters:', params);
    setAlgorithmParams(params);
    setSelectedAlgorithm(algorithm);
    onOpen();
  };

  // Handle parameter changes
  const handleParameterChange = (paramName: string, value: any) => {
    setAlgorithmParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // Render parameter input based on type
  const renderParameterInput = (param: AlgorithmParameter) => {
    const value = algorithmParams[param.name] ?? param.defaultValue;

    switch (param.type) {
      case 'number':
        return (
          <NumberInput
            value={value}
            onChange={(_, num) => handleParameterChange(param.name, isNaN(num) ? param.defaultValue : num)}
            min={param.min}
            max={param.max}
            step={param.step}
            size="sm"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        );
      
      case 'boolean':
        return (
          <Switch
            isChecked={value}
            onChange={(e) => handleParameterChange(param.name, e.target.checked)}
            colorScheme="blue"
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            size="sm"
          >
            {param.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );
      
      case 'angle':
        return (
          <NumberInput
            value={value}
            onChange={(_, num) => handleParameterChange(param.name, isNaN(num) ? param.defaultValue : num)}
            min={param.min ?? 0}
            max={param.max ?? 2 * Math.PI}
            step={param.step ?? 0.1}
            size="sm"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        );
      
      default:
        return <Text fontSize="sm">Unsupported parameter type</Text>;
    }
  };

  // Apply algorithm to circuit
  const applyAlgorithm = () => {
    if (!selectedAlgorithm) return;

    try {
      const result = selectedAlgorithm.implementation(algorithmParams);
      
      if (result && result.gates && result.gates.length > 0) {
        // Transform algorithm gates to ensure they have valid positions
        const processedGates = result.gates.map((gate, index) => ({
          ...gate,
          position: typeof gate.position === 'number' ? gate.position : index,
          id: `${gate.type}-${gate.qubit}-${Date.now()}-${index}`
        }));
        
        // Add algorithm gates to circuit
        dispatch(addGates(processedGates));
        
        toast({
          title: 'Algorithm Applied Successfully',
          description: `${selectedAlgorithm.name} added with ${result.gates.length} gates on ${result.requiredQubits} qubits.`,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        
        onClose();
      } else {
        toast({
          title: 'Algorithm Error',
          description: 'Algorithm implementation returned no gates',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Algorithm implementation error:', error);
      toast({
        title: 'Implementation Error',
        description: 'Failed to generate algorithm circuit. Please check console for details.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  // Early return if library not loaded
  if (!quantumAlgorithmLibrary || !quantumAlgorithmLibrary.algorithms) {
    return (
      <Box h="100%" display="flex" flexDirection="column" justify="center" align="center">
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Algorithm Library Error</AlertTitle>
          <AlertDescription>
            Failed to load quantum algorithm library. Please refresh the page.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <HStack justify="space-between" mb={3}>
        <Heading size="md">Quantum Algorithm Library</Heading>
        <FullViewToggle />
      </HStack>

      {/* Search and Filter Controls */}
      <VStack spacing={3} align="stretch" mb={4}>
        <Grid templateColumns="2fr 1fr" gap={3}>
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>Search Algorithms</FormLabel>
            <Input
              placeholder="Search algorithms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              fontSize="sm"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>Category</FormLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              size="sm"
              fontSize="sm"
            >
              <option value="all">All Categories</option>
              {quantumAlgorithmLibrary && quantumAlgorithmLibrary.categories && 
                Object.entries(quantumAlgorithmLibrary.categories).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.name}
                  </option>
                ))}
            </Select>
          </FormControl>
        </Grid>

        <HStack spacing={2}>
          <Switch
            isChecked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
            size="sm"
          />
          <Text fontSize="xs">Show advanced details</Text>
        </HStack>
      </VStack>

      {/* Algorithm Grid */}
      <Box flex={1} overflowY="auto">
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
          {filteredAlgorithms.map((algorithm) => (
          <Card key={algorithm.id} bg={cardBg} borderColor={borderColor} borderWidth={1} shadow="sm">
            <CardHeader pb={1}>
              <Flex justify="space-between" align="flex-start" gap={2}>
                <VStack align="start" spacing={1} flex={1} minW={0}>
                  <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                    {algorithm.name}
                  </Text>
                  <Wrap spacing={1}>
                    <WrapItem>
                      <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                        {quantumAlgorithmLibrary.categories[algorithm.category].icon}
                      </Badge>
                    </WrapItem>
                    <WrapItem>
                      <Badge 
                        colorScheme={algorithm.education.difficulty === 'beginner' ? 'green' : 
                                    algorithm.education.difficulty === 'intermediate' ? 'yellow' :
                                    algorithm.education.difficulty === 'advanced' ? 'orange' : 'red'}
                        variant="subtle"
                        fontSize="2xs"
                      >
                        {algorithm.education.difficulty}
                      </Badge>
                    </WrapItem>
                    {algorithm.validated && (
                      <WrapItem>
                        <Tooltip label="Scientifically validated implementation">
                          <Badge colorScheme="green" variant="solid" fontSize="2xs">
                            <CheckIcon boxSize={2} mr={1} />
                            ✓
                          </Badge>
                        </Tooltip>
                      </WrapItem>
                    )}
                  </Wrap>
                </VStack>
                
                <IconButton
                  icon={<AddIcon />}
                  size="xs"
                  colorScheme="blue"
                  variant="solid"
                  onClick={() => {
                    try {
                      console.log('Button clicked for algorithm:', algorithm.name);
                      initializeParameters(algorithm);
                    } catch (error) {
                      console.error('Error initializing algorithm:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to open algorithm configuration',
                        status: 'error',
                        duration: 3000,
                        isClosable: true
                      });
                    }
                  }}
                  aria-label={`Add ${algorithm.name} to circuit`}
                  flexShrink={0}
                />
              </Flex>
            </CardHeader>

            <CardBody pt={2} pb={3}>
              <VStack align="start" spacing={2}>
                <Text fontSize="xs" color="gray.600" noOfLines={2} lineHeight="1.3">
                  {algorithm.education.description}
                </Text>

                {/* Complexity Metrics */}
                <Box bg={complexityBg} p={2} borderRadius="md" w="100%">
                  <Text fontSize="2xs" fontWeight="bold" mb={1}>Complexity</Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={1} fontSize="2xs">
                    <Box>
                      <Text color="gray.500">Gates</Text>
                      <Text fontWeight="bold">{algorithm.complexity.gateCount}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Qubits</Text>
                      <Text fontWeight="bold">{algorithm.complexity.requiredQubits}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Depth</Text>
                      <Text fontWeight="bold">{algorithm.complexity.depth}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.500">Time</Text>
                      <Text fontWeight="bold" fontSize="2xs">{algorithm.complexity.timeComplexity}</Text>
                    </Box>
                  </Grid>
                </Box>

                {/* Applications */}
                <Box>
                  <Text fontSize="2xs" fontWeight="bold" mb={1}>Applications</Text>
                  <Wrap spacing={1}>
                    {algorithm.education.applications.slice(0, 2).map((app, index) => (
                      <WrapItem key={index}>
                        <Tag size="sm" variant="subtle" colorScheme="purple">
                          <TagLabel fontSize="2xs">{app}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                    {algorithm.education.applications.length > 2 && (
                      <WrapItem>
                        <Tag size="sm" variant="outline">
                          <TagLabel fontSize="2xs">+{algorithm.education.applications.length - 2}</TagLabel>
                        </Tag>
                      </WrapItem>
                    )}
                  </Wrap>
                </Box>

                {showAdvanced && (
                  <Box>
                    <Text fontSize="2xs" fontWeight="bold" mb={1}>Prerequisites</Text>
                    <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                      {algorithm.education.prerequisites.join(', ')}
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
          ))}
        </Grid>

        {filteredAlgorithms.length === 0 && (
          <Alert status="info" mt={4}>
            <AlertIcon />
            <AlertTitle>No algorithms found!</AlertTitle>
            <AlertDescription>
              Try adjusting your search terms or category filter.
            </AlertDescription>
          </Alert>
        )}
      </Box>

      {/* Algorithm Configuration Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader fontSize="lg" pb={2}>
            Configure {selectedAlgorithm?.name || 'Algorithm'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={4}>
            {selectedAlgorithm ? (
              <VStack spacing={4} align="stretch">
                {/* Algorithm Description */}
                <Box>
                  <Text fontSize="sm" mb={2} lineHeight="1.4">
                    {selectedAlgorithm.education?.description || 'No description available'}
                  </Text>
                  
                  {selectedAlgorithm.education?.mathematicalBackground && (
                    <Box bg={categoryBg} p={3} borderRadius="md">
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Mathematical Background</Text>
                      <Text fontSize="xs" lineHeight="1.3">
                        {selectedAlgorithm.education.mathematicalBackground}
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Parameters */}
                {selectedAlgorithm.parameters.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Heading size="sm" mb={3}>Parameters</Heading>
                      <VStack spacing={3} align="stretch">
                        {selectedAlgorithm.parameters.map((param) => (
                          <FormControl key={param.name}>
                            <Flex justify="space-between" align="center" mb={1}>
                              <FormLabel fontSize="sm" mb={0} fontWeight="medium">
                                {param.name}
                              </FormLabel>
                              {param.unit && (
                                <Text fontSize="xs" color="gray.500">
                                  ({param.unit})
                                </Text>
                              )}
                            </Flex>
                            <Text fontSize="xs" color="gray.600" mb={2}>
                              {param.description}
                            </Text>
                            {renderParameterInput(param)}
                          </FormControl>
                        ))}
                      </VStack>
                    </Box>
                  </>
                )}

                <Divider />

                {/* Estimated Complexity */}
                <Box>
                  <Heading size="sm" mb={2}>Circuit Overview</Heading>
                  <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                    <Box p={2} bg={complexityBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">Required Qubits</Text>
                      <Text fontSize="lg" fontWeight="bold">{selectedAlgorithm.complexity.requiredQubits}</Text>
                    </Box>
                    <Box p={2} bg={complexityBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">Estimated Gates</Text>
                      <Text fontSize="lg" fontWeight="bold">~{selectedAlgorithm.complexity.gateCount}</Text>
                    </Box>
                    <Box p={2} bg={complexityBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">Circuit Depth</Text>
                      <Text fontSize="lg" fontWeight="bold">~{selectedAlgorithm.complexity.depth}</Text>
                    </Box>
                    <Box p={2} bg={complexityBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">Time Complexity</Text>
                      <Text fontSize="sm" fontWeight="bold">{selectedAlgorithm.complexity.timeComplexity}</Text>
                    </Box>
                  </Grid>
                </Box>

                {/* References - Collapsed by default */}
                <Accordion allowToggle>
                  <AccordionItem border="none">
                    <AccordionButton px={0} _hover={{ bg: 'transparent' }}>
                      <Box flex="1" textAlign="left">
                        <Text fontSize="sm" fontWeight="bold">References ({selectedAlgorithm.education.references.length})</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel px={0} pb={2}>
                      <VStack spacing={2} align="stretch">
                        {selectedAlgorithm.education.references.map((ref, index) => (
                          <Box key={index} p={2} bg={cardBg} borderRadius="md" borderWidth={1}>
                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{ref.title}</Text>
                            {ref.authors && (
                              <Text fontSize="xs" color="gray.600">
                                {ref.authors.join(', ')} {ref.year && `(${ref.year})`}
                              </Text>
                            )}
                            {ref.doi && (
                              <Link 
                                href={`https://doi.org/${ref.doi}`}
                                isExternal
                                fontSize="xs"
                                color="blue.500"
                              >
                                DOI: {ref.doi} <ExternalLinkIcon mx="2px" />
                              </Link>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text>No algorithm selected</Text>
              </Box>
            )}
          </ModalBody>

          <ModalFooter pt={4} pb={4}>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose} size="md">
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={applyAlgorithm}
                size="md"
                leftIcon={<AddIcon />}
              >
                Add to Circuit
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AlgorithmLibraryPanel;
