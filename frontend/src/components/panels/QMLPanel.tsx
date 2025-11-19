import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Progress,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tooltip,
  Icon,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
} from '@chakra-ui/react';
import {
  InfoIcon,
  DownloadIcon,
  RepeatIcon,
  CheckCircleIcon,
  WarningIcon,
  StarIcon,
} from '@chakra-ui/icons';
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectQubits } from '../../store/slices/circuitSlice';
import { trainQNN, evaluateQNN, getQMLTemplates, encodeData } from '../../lib/quantumApi';
import { addGates } from '../../store/slices/circuitSlice';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import FullViewToggle from '../common/FullViewToggle';

interface QMLTemplate {
  id: string;
  name: string;
  description: string;
  num_qubits: number;
  num_layers: number;
  encoding: string;
  num_parameters: number;
}

interface TrainingHistory {
  loss: number[];
  epoch: number[];
}

interface EvaluationResults {
  accuracy: number;
  mse: number;
  predictions: number[];
  confusion_matrix: { tp: number; tn: number; fp: number; fn: number };
}

const QMLPanel = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const qubits = useSelector(selectQubits);
  
  // State
  const [templates, setTemplates] = useState<QMLTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QMLTemplate | null>(null);
  const [trainData, setTrainData] = useState<number[][]>([]);
  const [trainLabels, setTrainLabels] = useState<number[]>([]);
  const [testData, setTestData] = useState<number[][]>([]);
  const [testLabels, setTestLabels] = useState<number[]>([]);
  const [numQubits, setNumQubits] = useState(2);
  const [numLayers, setNumLayers] = useState(2);
  const [encoding, setEncoding] = useState('angle');
  const [learningRate, setLearningRate] = useState(0.01);
  const [epochs, setEpochs] = useState(10);
  const [shots, setShots] = useState(1024);
  const [costFunction, setCostFunction] = useState('mse');
  const [isTraining, setIsTraining] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [trainedParameters, setTrainedParameters] = useState<number[] | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResults | null>(null);
  const [datasetName, setDatasetName] = useState('');
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    try {
      const response = await getQMLTemplates();
      setTemplates(response.templates);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
    }
  };
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, isTest: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setDatasetName(file.name);
    
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length < 2) {
          toast({
            title: 'Invalid file',
            description: 'CSV must have at least 2 rows',
            status: 'error',
            duration: 3000,
          });
          return;
        }
        
        // Assume last column is label, rest are features
        const parsedData: number[][] = [];
        const parsedLabels: number[] = [];
        
        data.slice(1).forEach((row) => {
          if (row.length > 1) {
            const features = row.slice(0, -1).map(Number).filter(n => !isNaN(n));
            const label = Number(row[row.length - 1]);
            
            if (features.length > 0 && !isNaN(label)) {
              parsedData.push(features);
              parsedLabels.push(label);
            }
          }
        });
        
        if (isTest) {
          setTestData(parsedData);
          setTestLabels(parsedLabels);
        } else {
          setTrainData(parsedData);
          setTrainLabels(parsedLabels);
        }
        
        toast({
          title: isTest ? 'Test data loaded' : 'Training data loaded',
          description: `Loaded ${parsedData.length} samples with ${parsedData[0]?.length || 0} features`,
          status: 'success',
          duration: 3000,
        });
      },
      header: false,
      skipEmptyLines: true,
    });
  }, [toast]);
  
  const generateSampleData = () => {
    // Generate simple XOR-like dataset
    const samples = 100;
    const data: number[][] = [];
    const labels: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      // Normalize to [0, 1] range for better quantum encoding
      const x1 = Math.random();
      const x2 = Math.random();
      data.push([x1, x2]);
      
      // XOR pattern: threshold at 0.5
      const label = (x1 > 0.5) !== (x2 > 0.5) ? 1 : 0;
      labels.push(label);
    }
    
    setTrainData(data.slice(0, 80));
    setTrainLabels(labels.slice(0, 80));
    setTestData(data.slice(80));
    setTestLabels(labels.slice(80));
    setDatasetName('Sample XOR Dataset');
    
    toast({
      title: 'Sample data generated',
      description: '80 training samples, 20 test samples',
      status: 'success',
      duration: 3000,
    });
  };
  
  const handleTrain = async () => {
    if (trainData.length === 0 || trainLabels.length === 0) {
      toast({
        title: 'No training data',
        description: 'Please upload or generate training data first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setIsTraining(true);
    setTrainingHistory(null);
    setEvaluationResults(null);
    
    try {
      const response = await trainQNN({
        train_data: trainData,
        train_labels: trainLabels,
        num_qubits: numQubits,
        num_layers: numLayers,
        encoding: encoding,
        learning_rate: learningRate,
        epochs: epochs,
        shots: shots,
        cost_function: costFunction,
      });
      
      setTrainedParameters(response.parameters);
      setTrainingHistory(response.history);
      
      toast({
        title: 'Training complete!',
        description: `Final loss: ${response.final_loss.toFixed(4)} after ${response.epochs_completed} epochs`,
        status: 'success',
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: 'Training failed',
        description: error.message || 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsTraining(false);
    }
  };
  
  const handleEvaluate = async () => {
    if (!trainedParameters) {
      toast({
        title: 'No trained model',
        description: 'Please train a model first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    if (testData.length === 0 || testLabels.length === 0) {
      toast({
        title: 'No test data',
        description: 'Please upload test data first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setIsEvaluating(true);
    
    try {
      const response = await evaluateQNN({
        test_data: testData,
        test_labels: testLabels,
        parameters: trainedParameters,
        num_qubits: numQubits,
        num_layers: numLayers,
        encoding: encoding,
        shots: shots,
      });
      
      setEvaluationResults(response);
      
      toast({
        title: 'Evaluation complete!',
        description: `Accuracy: ${(response.accuracy * 100).toFixed(1)}%`,
        status: 'success',
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: 'Evaluation failed',
        description: error.message || 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsEvaluating(false);
    }
  };
  
  const handleLoadTemplate = (template: QMLTemplate) => {
    setSelectedTemplate(template);
    setNumQubits(template.num_qubits);
    setNumLayers(template.num_layers);
    setEncoding(template.encoding);
    
    // Generate and visualize the circuit locally
    try {
      const gates: any[] = [];
      let position = 0;
      
      // Generate encoding layer (simplified visualization with sample data)
      if (template.encoding === 'angle') {
        for (let i = 0; i < template.num_qubits; i++) {
          gates.push({
            id: `template-ry-${i}-${position}`,
            type: 'ry',
            qubit: i,
            position: position,
            params: { theta: 45 }, // Sample angle in degrees
          });
        }
        position++;
      } else if (template.encoding === 'amplitude') {
        // Amplitude encoding uses Hadamard + controlled rotations
        for (let i = 0; i < template.num_qubits; i++) {
          gates.push({
            id: `template-h-${i}-${position}`,
            type: 'h',
            qubit: i,
            position: position,
            params: {},
          });
        }
        position++;
      }
      
      // Generate variational layers
      for (let layer = 0; layer < template.num_layers; layer++) {
        // Local rotations on each qubit
        for (let q = 0; q < template.num_qubits; q++) {
          ['ry', 'rz', 'ry'].forEach((gateType, idx) => {
            gates.push({
              id: `template-${gateType}-L${layer}-q${q}-${position}`,
              type: gateType,
              qubit: q,
              position: position,
              params: { theta: Math.random() * 90 }, // Random sample angles
            });
            position++;
          });
        }
        
        // Entangling CNOTs in a chain pattern
        for (let q = 0; q < template.num_qubits - 1; q++) {
          gates.push({
            id: `template-cnot-L${layer}-${q}-${position}`,
            type: 'cnot',
            qubit: q + 1,
            position: position,
            targets: [q + 1],
            controls: [q],
            params: {},
          });
        }
        position++;
      }
      
      // Dispatch template gates to circuit canvas
      dispatch(addGates(gates));
      
      toast({
        title: 'Template loaded',
        description: `${template.name} - ${gates.length} gates visualized on canvas`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to visualize circuit:', error);
      toast({
        title: 'Visualization failed',
        description: 'Could not generate template circuit',
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  const chartData = trainingHistory
    ? trainingHistory.epoch.map((epoch, idx) => ({
        epoch,
        loss: trainingHistory.loss[idx],
      }))
    : [];
  
  return (
    <Box>
      <HStack justifyContent="space-between" mb={4}>
        <HStack>
          <StarIcon color={accentColor} />
          <Heading size="md">Quantum Machine Learning Toolkit</Heading>
          <Badge colorScheme="purple">Beta</Badge>
        </HStack>
        <FullViewToggle />
      </HStack>
      
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>📊 Dataset</Tab>
          <Tab>🏗️ Model Builder</Tab>
          <Tab>🎯 Training</Tab>
          <Tab>📈 Results</Tab>
          <Tab>📚 Templates</Tab>
        </TabList>
        
        <TabPanels>
          {/* Dataset Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Dataset Management</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle fontSize="sm">CSV Format</AlertTitle>
                        <AlertDescription fontSize="xs">
                          Upload CSV with features in columns, last column as label (0 or 1)
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <FormControl>
                          <FormLabel fontSize="sm">Training Data</FormLabel>
                          <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => handleFileUpload(e, false)}
                            size="sm"
                          />
                          {trainData.length > 0 && (
                            <Badge colorScheme="green" mt={2}>
                              {trainData.length} samples loaded
                            </Badge>
                          )}
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel fontSize="sm">Test Data</FormLabel>
                          <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => handleFileUpload(e, true)}
                            size="sm"
                          />
                          {testData.length > 0 && (
                            <Badge colorScheme="green" mt={2}>
                              {testData.length} samples loaded
                            </Badge>
                          )}
                        </FormControl>
                      </GridItem>
                    </Grid>
                    
                    <Divider />
                    
                    <Button
                      leftIcon={<RepeatIcon />}
                      onClick={generateSampleData}
                      colorScheme="purple"
                      variant="outline"
                      size="sm"
                    >
                      Generate Sample Data (XOR Pattern)
                    </Button>
                    
                    {datasetName && (
                      <Alert status="success" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="sm">Dataset: {datasetName}</Text>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
          
          {/* Model Builder Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">QNN Architecture</Heading>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Number of Qubits</FormLabel>
                        <NumberInput
                          value={numQubits}
                          onChange={(_, val) => setNumQubits(val)}
                          min={2}
                          max={10}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Number of Layers</FormLabel>
                        <NumberInput
                          value={numLayers}
                          onChange={(_, val) => setNumLayers(val)}
                          min={1}
                          max={5}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Data Encoding</FormLabel>
                        <Select
                          value={encoding}
                          onChange={(e) => setEncoding(e.target.value)}
                          size="sm"
                        >
                          <option value="angle">Angle Encoding</option>
                          <option value="amplitude">Amplitude Encoding</option>
                        </Select>
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Measurement Shots</FormLabel>
                        <NumberInput
                          value={shots}
                          onChange={(_, val) => setShots(val)}
                          min={100}
                          max={10000}
                          step={100}
                          size="sm"
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                  </Grid>
                  
                  <Divider my={4} />
                  
                  <Alert status="info" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Parameters: {numQubits * 3 * numLayers}</Text>
                      <Text fontSize="xs">(3 rotation angles per qubit per layer)</Text>
                    </Box>
                  </Alert>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
          
          {/* Training Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Training Configuration</Heading>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Learning Rate</FormLabel>
                        <NumberInput
                          value={learningRate}
                          onChange={(_, val) => setLearningRate(val)}
                          min={0.001}
                          max={0.1}
                          step={0.001}
                          size="sm"
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm">Epochs</FormLabel>
                        <NumberInput
                          value={epochs}
                          onChange={(_, val) => setEpochs(val)}
                          min={1}
                          max={100}
                          size="sm"
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                    
                    <GridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm">Cost Function</FormLabel>
                        <Select
                          value={costFunction}
                          onChange={(e) => setCostFunction(e.target.value)}
                          size="sm"
                        >
                          <option value="mse">Mean Squared Error</option>
                          <option value="cross_entropy">Cross Entropy</option>
                        </Select>
                      </FormControl>
                    </GridItem>
                  </Grid>
                  
                  <Divider my={4} />
                  
                  <Button
                    leftIcon={isTraining ? <Spinner size="sm" /> : <CheckCircleIcon />}
                    colorScheme="blue"
                    onClick={handleTrain}
                    isLoading={isTraining}
                    loadingText="Training..."
                    width="100%"
                    size="lg"
                    isDisabled={trainData.length === 0}
                  >
                    {trainedParameters ? 'Retrain Model' : 'Start Training'}
                  </Button>
                  
                  {isTraining && (
                    <Progress size="xs" isIndeterminate colorScheme="blue" mt={2} />
                  )}
                </CardBody>
              </Card>
              
              {trainingHistory && (
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="sm">Training Progress</Heading>
                      <Badge colorScheme="blue">
                        {trainingHistory.loss.length} epochs completed
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="epoch" 
                          label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                          formatter={(value: number) => [`${value.toFixed(4)}`, 'Loss']}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="loss"
                          stroke={accentColor}
                          strokeWidth={3}
                          dot={{ r: 5, fill: accentColor }}
                          activeDot={{ r: 7 }}
                          animationDuration={500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    <HStack justify="space-between" mt={4} fontSize="sm">
                      <Stat size="sm">
                        <StatLabel>Initial Loss</StatLabel>
                        <StatNumber fontSize="md">
                          {trainingHistory.loss[0]?.toFixed(4) || 'N/A'}
                        </StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Final Loss</StatLabel>
                        <StatNumber fontSize="md" color={successColor}>
                          {trainingHistory.loss[trainingHistory.loss.length - 1]?.toFixed(4) || 'N/A'}
                        </StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Improvement</StatLabel>
                        <StatNumber fontSize="md">
                          {trainingHistory.loss.length > 1
                            ? `${(((trainingHistory.loss[0] - trainingHistory.loss[trainingHistory.loss.length - 1]) / trainingHistory.loss[0]) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </StatNumber>
                      </Stat>
                    </HStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>
          
          {/* Results Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Model Evaluation</Heading>
                </CardHeader>
                <CardBody>
                  <Button
                    leftIcon={isEvaluating ? <Spinner size="sm" /> : <CheckCircleIcon />}
                    colorScheme="green"
                    onClick={handleEvaluate}
                    isLoading={isEvaluating}
                    loadingText="Evaluating..."
                    width="100%"
                    isDisabled={!trainedParameters || testData.length === 0}
                  >
                    Evaluate on Test Set
                  </Button>
                </CardBody>
              </Card>
              
              {evaluationResults && (
                <>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem>
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>Accuracy</StatLabel>
                            <StatNumber color={successColor}>
                              {(evaluationResults.accuracy * 100).toFixed(1)}%
                            </StatNumber>
                            <StatHelpText>Test set performance</StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    <GridItem>
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>Mean Squared Error</StatLabel>
                            <StatNumber>{evaluationResults.mse.toFixed(4)}</StatNumber>
                            <StatHelpText>Lower is better</StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                    </GridItem>
                  </Grid>
                  
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Confusion Matrix</Heading>
                    </CardHeader>
                    <CardBody>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th></Th>
                            <Th>Predicted 0</Th>
                            <Th>Predicted 1</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Th>Actual 0</Th>
                            <Td bg="green.100" fontWeight="bold">
                              {evaluationResults.confusion_matrix.tn}
                            </Td>
                            <Td bg="red.100">{evaluationResults.confusion_matrix.fp}</Td>
                          </Tr>
                          <Tr>
                            <Th>Actual 1</Th>
                            <Td bg="red.100">{evaluationResults.confusion_matrix.fn}</Td>
                            <Td bg="green.100" fontWeight="bold">
                              {evaluationResults.confusion_matrix.tp}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </>
              )}
            </VStack>
          </TabPanel>
          
          {/* Templates Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm" fontWeight="bold">
                    Pre-configured QML architectures for common tasks
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Click a template to load its configuration and visualize the circuit
                  </Text>
                </Box>
              </Alert>
              
              {selectedTemplate && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm" fontWeight="bold">
                      Active Template: {selectedTemplate.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Circuit visualized on canvas with {selectedTemplate.num_qubits} qubits and {selectedTemplate.num_layers} layers
                    </Text>
                  </Box>
                </Alert>
              )}
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {templates.map((template) => (
                  <GridItem key={template.id}>
                    <Card
                      cursor="pointer"
                      onClick={() => handleLoadTemplate(template)}
                      _hover={{ borderColor: accentColor, transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      borderWidth={selectedTemplate?.id === template.id ? 2 : 1}
                      borderColor={selectedTemplate?.id === template.id ? accentColor : borderColor}
                    >
                      <CardHeader pb={2}>
                        <Heading size="sm">{template.name}</Heading>
                      </CardHeader>
                      <CardBody pt={2}>
                        <VStack align="stretch" spacing={2}>
                          <Text fontSize="xs" color="gray.500">
                            {template.description}
                          </Text>
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme="blue" fontSize="xs">
                              {template.num_qubits} qubits
                            </Badge>
                            <Badge colorScheme="purple" fontSize="xs">
                              {template.num_layers} layers
                            </Badge>
                            <Badge colorScheme="green" fontSize="xs">
                              {template.encoding}
                            </Badge>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default QMLPanel;
