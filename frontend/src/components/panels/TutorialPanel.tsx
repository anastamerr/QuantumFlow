import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Button,
  Badge,
  Icon,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Code,
  List,
  ListItem,
  ListIcon,
  Divider,
  Progress,
  Flex,
  useBreakpointValue
} from '@chakra-ui/react'
import { 
  InfoIcon, 
  SettingsIcon, 
  ViewIcon, 
  DownloadIcon,
  ArrowForwardIcon,
  CheckCircleIcon,
  StarIcon,
  RepeatIcon
} from '@chakra-ui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTutorial, selectShowTutorial } from '../../store/slices/uiSlice'
import { useState } from 'react'

const TutorialPanel = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector(selectShowTutorial)
  const [currentStep, setCurrentStep] = useState(0)
  
  // Theme colors
  const bg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('blue.50', 'blue.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const accentColor = useColorModeValue('blue.600', 'blue.300')
  const codeColor = useColorModeValue('gray.600', 'gray.300')
  
  // Responsive values
  const modalSize = useBreakpointValue({ base: 'full', md: '6xl' })
  const isMobile = useBreakpointValue({ base: true, md: false })

  const onClose = () => {
    dispatch(toggleTutorial())
    setCurrentStep(0) // Reset to first step when closing
  }

  // Define tutorial steps as a function to avoid issues with forward references
  const getTutorialSteps = () => [
    {
      title: "Welcome to QuantumFlow",
      content: (
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={accentColor} mb={4}>
              🚀 Welcome to QuantumFlow
            </Heading>
            <Text fontSize="lg" mb={4}>
              A modern, interactive quantum circuit design and simulation platform
            </Text>
            <Progress value={((currentStep + 1) / 6) * 100} colorScheme="blue" />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Step {currentStep + 1} of 6
            </Text>
          </Box>
          
          <HStack spacing={8} justify="center" wrap="wrap">
            <VStack>
              <Icon as={SettingsIcon} boxSize={8} color="purple.500" />
              <Text fontWeight="bold">Drag & Drop Design</Text>
              <Text fontSize="sm" textAlign="center">Visual circuit building</Text>
            </VStack>
            <VStack>
              <Icon as={RepeatIcon} boxSize={8} color="orange.500" />
              <Text fontWeight="bold">Real-time Simulation</Text>
              <Text fontSize="sm" textAlign="center">Instant quantum state evolution</Text>
            </VStack>
            <VStack>
              <Icon as={ViewIcon} boxSize={8} color="green.500" />
              <Text fontWeight="bold">3D Visualization</Text>
              <Text fontSize="sm" textAlign="center">State vectors & visualization</Text>
            </VStack>
            <VStack>
              <Icon as={DownloadIcon} boxSize={8} color="blue.500" />
              <Text fontWeight="bold">Code Generation</Text>
              <Text fontSize="sm" textAlign="center">Qiskit, Cirq, and JSON export</Text>
            </VStack>
          </HStack>
          
          <Card borderRadius="lg" bg={headerBg}>
            <CardBody>
              <Text fontWeight="medium" mb={2}>✨ What you'll learn:</Text>
              <List spacing={2}>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  How to build quantum circuits using drag-and-drop
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Running quantum simulations and analyzing results
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Understanding quantum gates and their properties
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  Exporting circuits to popular quantum frameworks
                </ListItem>
              </List>
            </CardBody>
          </Card>
        </VStack>
      )
    },
    {
      title: "Building Your First Circuit",
      content: (
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={accentColor} mb={4}>
              🔧 Building Your First Circuit
            </Heading>
            <Progress value={((currentStep + 1) / 6) * 100} colorScheme="blue" />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Step {currentStep + 1} of 6
            </Text>
          </Box>
          
          <Card>
            <CardHeader bg={headerBg}>
              <Heading size="md">Step-by-step Guide</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Badge colorScheme="blue" variant="solid" borderRadius="full">1</Badge>
                  <Text fontWeight="medium">Add Qubits</Text>
                </HStack>
                <Text ml={8} color={codeColor}>
                  Click "Add Qubit" in the sidebar to create quantum bits for your circuit. Start with 2 qubits for most experiments.
                </Text>
                
                <HStack>
                  <Badge colorScheme="blue" variant="solid" borderRadius="full">2</Badge>
                  <Text fontWeight="medium">Drag Gates</Text>
                </HStack>
                <Text ml={8} color={codeColor}>
                  Drag quantum gates from the sidebar onto your circuit grid. Gates are applied left-to-right in time sequence.
                </Text>
                
                <HStack>
                  <Badge colorScheme="blue" variant="solid" borderRadius="full">3</Badge>
                  <Text fontWeight="medium">Configure Parameters</Text>
                </HStack>
                <Text ml={8} color={codeColor}>
                  Click on parameterized gates (like rotation gates) to adjust their angles and properties.
                </Text>
                
                <HStack>
                  <Badge colorScheme="blue" variant="solid" borderRadius="full">4</Badge>
                  <Text fontWeight="medium">Run Simulation</Text>
                </HStack>
                <Text ml={8} color={codeColor}>
                  Switch to the Simulation panel and click "Run Simulation" to see your quantum circuit in action!
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Box p={4} bg={useColorModeValue('yellow.50', 'yellow.900')} borderRadius="md" borderLeft="4px" borderColor="yellow.400">
            <HStack>
              <Icon as={InfoIcon} color="yellow.500" />
              <Text fontWeight="medium">Pro Tip:</Text>
            </HStack>
            <Text mt={2}>
              Try building a Bell State circuit: Start with 2 qubits, add a Hadamard (H) gate to qubit 0, 
              then add a CNOT gate with qubit 0 as control and qubit 1 as target.
            </Text>
          </Box>
        </VStack>
      )
    },
    {
      title: "Understanding Quantum Gates",
      content: (
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={accentColor} mb={4}>
              ⚛️ Understanding Quantum Gates
            </Heading>
            <Progress value={((currentStep + 1) / 6) * 100} colorScheme="blue" />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Step {currentStep + 1} of 6
            </Text>
          </Box>
          
          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList>
              <Tab>Single-Qubit</Tab>
              <Tab>Multi-Qubit</Tab>
              <Tab>Parameterized</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="bold" mb={2}>Common Single-Qubit Gates:</Text>
                  
                  <HStack spacing={4} wrap="wrap">
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="blue">H</Badge>
                          <Text fontWeight="bold">Hadamard</Text>
                        </HStack>
                        <Text fontSize="sm">Creates superposition - puts qubit in equal combination of |0⟩ and |1⟩</Text>
                      </CardBody>
                    </Card>
                    
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="red">X</Badge>
                          <Text fontWeight="bold">Pauli-X</Text>
                        </HStack>
                        <Text fontSize="sm">Bit flip - transforms |0⟩ ↔ |1⟩ (quantum NOT gate)</Text>
                      </CardBody>
                    </Card>
                    
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="green">Z</Badge>
                          <Text fontWeight="bold">Pauli-Z</Text>
                        </HStack>
                        <Text fontSize="sm">Phase flip - adds -1 phase to |1⟩ state</Text>
                      </CardBody>
                    </Card>
                  </HStack>
                </VStack>
              </TabPanel>
              
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="bold" mb={2}>Multi-Qubit Gates:</Text>
                  
                  <HStack spacing={4} wrap="wrap">
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="purple">CNOT</Badge>
                          <Text fontWeight="bold">Controlled-X</Text>
                        </HStack>
                        <Text fontSize="sm">Flips target qubit only when control qubit is |1⟩. Creates entanglement.</Text>
                      </CardBody>
                    </Card>
                    
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="teal">SWAP</Badge>
                          <Text fontWeight="bold">Swap Gate</Text>
                        </HStack>
                        <Text fontSize="sm">Exchanges the states of two qubits</Text>
                      </CardBody>
                    </Card>
                    
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="orange">CCX</Badge>
                          <Text fontWeight="bold">Toffoli</Text>
                        </HStack>
                        <Text fontSize="sm">Controlled-controlled-X gate. Flips target when both controls are |1⟩</Text>
                      </CardBody>
                    </Card>
                  </HStack>
                </VStack>
              </TabPanel>
              
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="bold" mb={2}>Rotation Gates (Parameterized):</Text>
                  
                  <HStack spacing={4} wrap="wrap">
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="pink">RX</Badge>
                          <Text fontWeight="bold">X-Rotation</Text>
                        </HStack>
                        <Text fontSize="sm">Rotates qubit around X-axis by angle θ</Text>
                        <Code fontSize="xs" mt={1}>RX(θ) |0⟩ → cos(θ/2)|0⟩ + i·sin(θ/2)|1⟩</Code>
                      </CardBody>
                    </Card>
                    
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="cyan">RY</Badge>
                          <Text fontWeight="bold">Y-Rotation</Text>
                        </HStack>
                        <Text fontSize="sm">Rotates qubit around Y-axis by angle θ</Text>
                        <Code fontSize="xs" mt={1}>RY(θ) |0⟩ → cos(θ/2)|0⟩ + sin(θ/2)|1⟩</Code>
                      </CardBody>
                    </Card>
                    
                    <Card minW="200px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="yellow">RZ</Badge>
                          <Text fontWeight="bold">Z-Rotation</Text>
                        </HStack>
                        <Text fontSize="sm">Rotates qubit around Z-axis by angle φ</Text>
                        <Code fontSize="xs" mt={1}>RZ(φ) |0⟩ → |0⟩, RZ(φ) |1⟩ → e^(iφ)|1⟩</Code>
                      </CardBody>
                    </Card>
                  </HStack>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      )
    },
    {
      title: "Running Simulations",
      content: (
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={accentColor} mb={4}>
              🔬 Running Quantum Simulations
            </Heading>
            <Progress value={((currentStep + 1) / 6) * 100} colorScheme="blue" />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Step {currentStep + 1} of 6
            </Text>
          </Box>
          
          <Card>
            <CardHeader bg={headerBg}>
              <Heading size="md">Simulation Features</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Icon as={RepeatIcon} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">State Vector Evolution</Text>
                    <Text fontSize="sm" color={codeColor}>
                      Watch your quantum states evolve step-by-step as gates are applied
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack>
                  <Icon as={StarIcon} color="yellow.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Measurement Results</Text>
                    <Text fontSize="sm" color={codeColor}>
                      See probability distributions and measurement outcomes
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack>
                  <Icon as={ViewIcon} color="green.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Quantum State Visualization</Text>
                    <Text fontSize="sm" color={codeColor}>
                      Interactive 3D visualization of single-qubit states
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack>
                  <Icon as={InfoIcon} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Circuit Analysis</Text>
                    <Text fontSize="sm" color={codeColor}>
                      Automatic detection of quantum properties like entanglement
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={useColorModeValue('green.50', 'green.900')}>
            <CardBody>
              <Text fontWeight="bold" mb={2} color="green.600">📈 Simulation Options:</Text>
              <List spacing={1}>
                <ListItem>
                  <Text fontSize="sm"><Code>State Vector</Code> - Exact quantum simulation (default)</Text>
                </ListItem>
                <ListItem>
                  <Text fontSize="sm"><Code>Noisy Simulator</Code> - Includes realistic quantum noise</Text>
                </ListItem>
                <ListItem>
                  <Text fontSize="sm"><Code>Shots</Code> - Number of measurement repetitions (100-10,000)</Text>
                </ListItem>
                <ListItem>
                  <Text fontSize="sm"><Code>Real-time Viz</Code> - Live animation during simulation</Text>
                </ListItem>
              </List>
            </CardBody>
          </Card>
        </VStack>
      )
    },
    {
      title: "Code Generation & Export",
      content: (
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={accentColor} mb={4}>
              💻 Code Generation & Export
            </Heading>
            <Progress value={((currentStep + 1) / 6) * 100} colorScheme="blue" />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Step {currentStep + 1} of 6
            </Text>
          </Box>
          
          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList>
              <Tab>Qiskit</Tab>
              <Tab>Cirq</Tab>
              <Tab>Export</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <Text fontWeight="bold">IBM Qiskit Code Generation</Text>
                  <Box bg={useColorModeValue('gray.50', 'gray.900')} p={4} borderRadius="md">
                    <Code fontSize="sm" whiteSpace="pre-wrap">{`from qiskit import QuantumCircuit, Aer, execute

# Create a quantum circuit with 2 qubits
qc = QuantumCircuit(2, 2)

# Add gates to the circuit
qc.h(0)  # Hadamard gate on qubit 0
qc.cx(0, 1)  # CNOT gate

# Measure all qubits
qc.measure_all()

# Run the simulation
simulator = Aer.get_backend('qasm_simulator')
job = execute(qc, simulator, shots=1024)
result = job.result()
counts = result.get_counts(qc)
print("Results:", counts)`}</Code>
                  </Box>
                  <Text fontSize="sm" color={codeColor}>
                    Perfect for IBM Quantum devices and QASM simulators
                  </Text>
                </VStack>
              </TabPanel>
              
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <Text fontWeight="bold">Google Cirq Code Generation</Text>
                  <Box bg={useColorModeValue('gray.50', 'gray.900')} p={4} borderRadius="md">
                    <Code fontSize="sm" whiteSpace="pre-wrap">{`import cirq
import numpy as np

# Create qubits
q0, q1 = cirq.LineQubit.range(2)

# Create a circuit
circuit = cirq.Circuit()

# Add gates
circuit.append(cirq.H(q0))  # Hadamard
circuit.append(cirq.CNOT(q0, q1))  # CNOT

# Add measurements
circuit.append(cirq.measure(*[q0, q1], key='result'))

# Run simulation
simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=1024)
print("Results:", result.histogram(key='result'))`}</Code>
                  </Box>
                  <Text fontSize="sm" color={codeColor}>
                    Optimized for Google quantum processors and research
                  </Text>
                </VStack>
              </TabPanel>
              
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <Text fontWeight="bold">Export Options</Text>
                  
                  <HStack spacing={4} wrap="wrap">
                    <Card minW="180px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="blue">JSON</Badge>
                          <Text fontWeight="bold">Circuit Data</Text>
                        </HStack>
                        <Text fontSize="sm">Complete circuit structure with all gate parameters and metadata</Text>
                      </CardBody>
                    </Card>
                    
                    <Card minW="180px">
                      <CardBody>
                        <HStack mb={2}>
                          <Badge colorScheme="green">SVG</Badge>
                          <Text fontWeight="bold">Circuit Diagram</Text>
                        </HStack>
                        <Text fontSize="sm">High-quality vector graphics for papers and presentations</Text>
                      </CardBody>
                    </Card>
                  </HStack>
                  
                  <Text fontWeight="bold" mt={4}>🚀 Optimization Features:</Text>
                  <List spacing={1}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      <Text fontSize="sm">Gate consolidation and cancellation</Text>
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      <Text fontSize="sm">Circuit depth reduction</Text>
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      <Text fontSize="sm">Hardware-specific transpilation</Text>
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      <Text fontSize="sm">Noise-aware optimization</Text>
                    </ListItem>
                  </List>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      )
    },
    {
      title: "Tips & Best Practices",
      content: (
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={accentColor} mb={4}>
              💡 Tips & Best Practices
            </Heading>
            <Progress value={100} colorScheme="green" />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Final Step - You're Ready to Go!
            </Text>
          </Box>
          
          <HStack spacing={6} wrap="wrap" justify="center">
            <Card maxW="300px">
              <CardHeader bg="blue.50">
                <Text fontWeight="bold" color="blue.600">🎯 Circuit Design Tips</Text>
              </CardHeader>
              <CardBody>
                <List spacing={2}>
                  <ListItem fontSize="sm">Start with small circuits (2-4 qubits)</ListItem>
                  <ListItem fontSize="sm">Use Hadamard gates to create superposition</ListItem>
                  <ListItem fontSize="sm">CNOT gates create entanglement</ListItem>
                  <ListItem fontSize="sm">Measure at the end of your circuit</ListItem>
                </List>
              </CardBody>
            </Card>
            
            <Card maxW="300px">
              <CardHeader bg="green.50">
                <Text fontWeight="bold" color="green.600">⚡ Performance Tips</Text>
              </CardHeader>
              <CardBody>
                <List spacing={2}>
                  <ListItem fontSize="sm">Limit circuits to ~8 qubits for smooth performance</ListItem>
                  <ListItem fontSize="sm">Disable real-time visualization for large circuits</ListItem>
                  <ListItem fontSize="sm">Use "Jump to End" for faster simulation results</ListItem>
                  <ListItem fontSize="sm">Clear circuit before building new designs</ListItem>
                </List>
              </CardBody>
            </Card>
            
            <Card maxW="300px">
              <CardHeader bg="purple.50">
                <Text fontWeight="bold" color="purple.600">🔍 Learning Resources</Text>
              </CardHeader>
              <CardBody>
                <List spacing={2}>
                  <ListItem fontSize="sm">Try the Bell State example circuit</ListItem>
                  <ListItem fontSize="sm">Experiment with rotation gate angles</ListItem>
                  <ListItem fontSize="sm">Compare different simulation methods</ListItem>
                  <ListItem fontSize="sm">Export code to run on real quantum hardware</ListItem>
                </List>
              </CardBody>
            </Card>
          </HStack>
          
          <Card bg={useColorModeValue('yellow.50', 'yellow.900')} borderLeft="4px" borderColor="yellow.400">
            <CardBody>
              <HStack mb={2}>
                <Icon as={InfoIcon} color="yellow.500" />
                <Text fontWeight="bold">Keyboard Shortcuts</Text>
              </HStack>
              <HStack spacing={8} wrap="wrap">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm"><Code>Delete</Code> - Remove selected gate</Text>
                  <Text fontSize="sm"><Code>Esc</Code> - Close parameter panel</Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm"><Code>Ctrl+Z</Code> - Undo (coming soon)</Text>
                  <Text fontSize="sm"><Code>Ctrl+C</Code> - Copy code to clipboard</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          
          <Box textAlign="center" mt={6}>
            <Text fontSize="lg" fontWeight="bold" color={accentColor} mb={2}>
              🎉 Congratulations!
            </Text>
            <Text>
              You're now ready to build amazing quantum circuits with QuantumFlow. 
              Start experimenting and discover the fascinating world of quantum computing!
            </Text>
          </Box>
        </VStack>
      )
    }
  ]

  const tutorialSteps = getTutorialSteps()

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={modalSize}
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(3px)" />
      <ModalContent 
        bg={bg} 
        maxH="90vh"
        mx={isMobile ? 2 : 4}
      >
        <ModalHeader 
          bg={headerBg} 
          borderTopRadius="md" 
          borderBottom="1px" 
          borderColor={borderColor}
        >
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold">
                QuantumFlow Tutorial
              </Text>
              <Text fontSize="sm" color={codeColor}>
                {tutorialSteps[currentStep].title}
              </Text>
            </VStack>
            <HStack>
              {/* Step indicators */}
              {tutorialSteps.map((_, index) => (
                <Box
                  key={index}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={index === currentStep ? accentColor : 'gray.300'}
                  cursor="pointer"
                  onClick={() => goToStep(index)}
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.2)' }}
                />
              ))}
            </HStack>
          </HStack>
        </ModalHeader>
        
        <ModalCloseButton top="4" right="4" />
        
        <ModalBody p={6}>
          <Box minH="400px">
            {tutorialSteps[currentStep].content}
          </Box>
          
          <Divider my={6} />
          
          <Flex justify="space-between" align="center">
            <Button
              variant="ghost"
              onClick={prevStep}
              isDisabled={currentStep === 0}
              leftIcon={<ArrowForwardIcon transform="rotate(180deg)" />}
            >
              Previous
            </Button>
            
            <HStack spacing={2}>
              <Text fontSize="sm" color={codeColor}>
                {currentStep + 1} of {tutorialSteps.length}
              </Text>
            </HStack>
            
            {currentStep === tutorialSteps.length - 1 ? (
              <Button
                colorScheme="green"
                onClick={onClose}
                rightIcon={<CheckCircleIcon />}
              >
                Get Started!
              </Button>
            ) : (
              <Button
                colorScheme="blue"
                onClick={nextStep}
                rightIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default TutorialPanel