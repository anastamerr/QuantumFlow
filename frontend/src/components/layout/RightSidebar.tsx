import { 
  Box, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, HStack, 
  useColorModeValue, Button, Text, Slider, SliderTrack, 
  SliderFilledTrack, SliderThumb, IconButton, Divider, Badge,
  Table, Thead, Tbody, Tr, Th, Td, Code, Accordion,
  AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react'
import { TimeIcon, ArrowRightIcon, ArrowLeftIcon, RepeatIcon, ViewIcon } from '@chakra-ui/icons'
import ErrorPanel from '../panels/ErrorPanel'
// Import the Matrix Heatmap Component
import MatrixPanel from '../panels/MatrixPanel'

import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo } from 'react'

// Import Actions & Selectors
import { 
  runPredictiveSimulation, 
  setPlaying, 
  stepForward, 
  stepBackward, 
  setCurrentStep,
  setSimulationData,
  selectCurrentStep, 
  selectTotalSteps, 
  selectIsPlaying, 
  selectSimulationHistory
} from '../../store/slices/simulationSlice'

import { selectQubits, selectGates } from '../../store/slices/circuitSlice'

// --- HELPER: Complex Number Logic ---
type Complex = { r: number, i: number }

const multiplyComplex = (a: Complex, b: Complex): Complex => ({
  r: a.r * b.r - a.i * b.i,
  i: a.r * b.i + a.i * b.r
})

const formatAmplitude = (c: Complex) => {
  const r = c.r.toFixed(2);
  const i = Math.abs(c.i).toFixed(2);
  const sign = c.i >= 0 ? '+' : '-';
  
  // Simplify display if purely real or imaginary
  if (Math.abs(c.i) < 0.01) return r;
  if (Math.abs(c.r) < 0.01) return `${c.i >= 0 ? '' : '-'}${i}i`;
  return `${r}${sign}${i}i`;
}

export default function RightSidebar() {
  // Theme Colors
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const codeBg = useColorModeValue('gray.100', 'gray.700')
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700')
  const tableBg = useColorModeValue('white', 'gray.900')
  
  const dispatch = useDispatch()
  
  // Redux State
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const currentStep = useSelector(selectCurrentStep)
  const totalSteps = useSelector(selectTotalSteps)
  const isPlaying = useSelector(selectIsPlaying)
  const history = useSelector(selectSimulationHistory)
  
  const isVcrActive = history.length > 0
  const currentStepData = history[currentStep]

  // --- SYSTEM STATE CALCULATOR (3Blue1Brown Style) ---
  // Combines individual qubit states into the full 2^N state vector
  const systemState = useMemo(() => {
    if (!currentStepData || qubits.length > 5) return []; // Cap at 5 qubits for UI performance

    // 1. Generate Basis States (00, 01, 10, 11...)
    const numStates = Math.pow(2, qubits.length);
    const rows = [];

    for (let i = 0; i < numStates; i++) {
      // Binary representation (e.g., "101")
      const binary = i.toString(2).padStart(qubits.length, '0');
      
      // Calculate Amplitude for this state (product of individual qubit amplitudes)
      // We assume separable states for this frontend visualizer
      let totalAmp: Complex = { r: 1, i: 0 };

      for (let q = 0; q < qubits.length; q++) {
        const qState = currentStepData.qubitStates[q];
        // If user removed a qubit mid-simulation, safely skip
        if (!qState) continue; 
        
        const isOne = binary[q] === '1';
        
        let qAmp: Complex;
        if (!isOne) {
          // Coefficient for |0> is real: cos(theta/2)
          qAmp = { r: Math.cos(qState.theta / 2), i: 0 };
        } else {
          // Coefficient for |1> is complex: e^i*phi * sin(theta/2)
          const mag = Math.sin(qState.theta / 2);
          qAmp = { 
            r: mag * Math.cos(qState.phi), 
            i: mag * Math.sin(qState.phi) 
          };
        }
        totalAmp = multiplyComplex(totalAmp, qAmp);
      }

      // Calculate Probability (|Amplitude|^2)
      const prob = totalAmp.r * totalAmp.r + totalAmp.i * totalAmp.i;

      rows.push({
        binary,
        amplitude: totalAmp,
        probability: prob
      });
    }
    return rows;
  }, [currentStepData, qubits.length]);


  // --- AUTO-PLAY ENGINE ---
  useEffect(() => {
    let interval: any;
    if (isPlaying && isVcrActive) {
      interval = setInterval(() => { dispatch(stepForward()); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isVcrActive, dispatch]);

  const handlePredict = () => {
    dispatch(runPredictiveSimulation({ qubits, gates })) 
    dispatch(setPlaying(true))
  }

  const handleExit = () => {
    dispatch(setPlaying(false))
    dispatch(setSimulationData([])) 
  }

  return (
    <Box h="100%" w="100%" bg={bg} borderLeft="1px" borderColor={borderColor} display="flex" flexDirection="column">
      <Tabs variant="enclosed" size="sm" colorScheme="blue" display="flex" flexDirection="column" h="100%">
        <TabList px={2} pt={2} bg={useColorModeValue('gray.50', 'gray.900')}>
          <Tab>Pre-Sim</Tab>
          <Tab>Simulation</Tab>
        </TabList>

        <TabPanels flex="1" overflowY="auto">
          
          {/* --- TAB 1: Pre-Simulation --- */}
          <TabPanel px={4} py={4} h="100%">
            <VStack spacing={4} align="stretch" h="100%">
              {/* 1. Error Finder */}
              <Box flexShrink={0}>
                 <ErrorPanel />
              </Box>
              
              <Divider />
              
              {/* 2. Matrix Heatmap (Replaces Transpiler) */}
              <Box flex="1" overflow="hidden">
                <MatrixPanel />
              </Box>
            </VStack>
          </TabPanel>

          {/* --- TAB 2: Simulation --- */}
          <TabPanel px={4} py={4}>
            <VStack spacing={4} align="stretch">
              
              {/* VCR CONTROLS */}
              <Box 
                p={4} 
                borderRadius="md" 
                bg={isVcrActive ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
                border="1px solid"
                borderColor={isVcrActive ? 'blue.200' : 'transparent'}
              >
                {!isVcrActive ? (
                  <Button w="100%" colorScheme="teal" leftIcon={<TimeIcon />} onClick={handlePredict} size="sm">
                    Predict Simulation (VCR)
                  </Button>
                ) : (
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs" fontWeight="bold" color="blue.500">TIMELINE</Text>
                      <Badge colorScheme="blue" variant="solid" fontSize="xs">Step {currentStep}/{Math.max(0, totalSteps - 1)}</Badge>
                    </HStack>

                    <Slider 
                      defaultValue={0} min={0} max={Math.max(0, totalSteps - 1)} 
                      value={currentStep} onChange={(val) => dispatch(setCurrentStep(val))} 
                      focusThumbOnChange={false}
                    >
                      <SliderTrack bg="blue.200"><SliderFilledTrack bg="blue.500" /></SliderTrack>
                      <SliderThumb boxSize={4} boxShadow="sm" />
                    </Slider>

                    <HStack justify="center" spacing={2}>
                      <IconButton aria-label="Previous" icon={<ArrowLeftIcon />} size="sm" onClick={() => dispatch(stepBackward())} isDisabled={currentStep === 0} />
                      <Button size="sm" w="80px" colorScheme={isPlaying ? "orange" : "green"} onClick={() => dispatch(setPlaying(!isPlaying))}>
                        {isPlaying ? "Pause" : "Play"}
                      </Button>
                      <IconButton aria-label="Next" icon={<ArrowRightIcon />} size="sm" onClick={() => dispatch(stepForward())} isDisabled={currentStep === totalSteps - 1} />
                    </HStack>

                    <Divider borderColor="blue.200" />
                    <Button size="xs" variant="ghost" colorScheme="red" onClick={handleExit} leftIcon={<RepeatIcon />}>Exit Simulation</Button>
                  </VStack>
                )}
              </Box>

              {/* DATA DISPLAYS */}
              {isVcrActive && currentStepData && (
                <Accordion allowToggle defaultIndex={[1]}>
                  
                  {/* 1. Individual Qubits (Bloch) */}
                  <AccordionItem border="none" mb={2}>
                    <h2>
                      <AccordionButton bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md" _expanded={{ bg: 'blue.500', color: 'white' }}>
                        <Box flex="1" textAlign="left" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                          Single Qubit States
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4} px={0}>
                      <Box 
                        border="1px solid" borderColor={borderColor} borderRadius="md" 
                        overflowX="auto" bg={tableBg}
                      >
                        <Table size="sm" variant="simple">
                          <Thead bg={tableHeaderBg}>
                            <Tr>
                              <Th>Q</Th>
                              <Th>State</Th>
                              <Th>Coords (x,y,z)</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {currentStepData.qubitStates.map((qState) => (
                              <Tr key={qState.qubitId}>
                                <Td fontWeight="bold">q{qState.qubitId}</Td>
                                <Td><Code fontSize="xs" bg={codeBg} colorScheme="blue">{qState.vectorText}</Code></Td>
                                <Td fontFamily="monospace" fontSize="xs" whiteSpace="nowrap">
                                  ({qState.bloch.x.toFixed(1)}, {qState.bloch.y.toFixed(1)}, {qState.bloch.z.toFixed(1)})
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>

                  {/* 2. SYSTEM PROBABILITIES (Compact Version) */}
                  <AccordionItem border="none">
                    <h2>
                      <AccordionButton bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md" _expanded={{ bg: 'purple.500', color: 'white' }} py={2}>
                        <Box flex="1" textAlign="left" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                          System Probabilities
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4} px={0}>
                      {/* Accuracy Warning */}
                      <Box 
                        mb={2} 
                        p={1.5} 
                        bg="orange.900" 
                        borderLeft="3px solid" 
                        borderColor="orange.400" 
                        borderRadius="sm"
                      >
                        <Text fontSize="2xs" color="orange.200" lineHeight="short">
                          <Text as="span" fontWeight="bold">Note:</Text> Predictive view assumes separable states. 
                          Use <b>Simulation Tab</b> for entangled accuracy.
                        </Text>
                      </Box>

                      {/* Visualizer Box */}
                      <Box 
                         bg="black" 
                         color="white"
                         borderRadius="md"
                         p={2}
                         maxH="250px"
                         overflowY="auto"
                         border="1px solid"
                         borderColor="gray.700"
                         css={{
                           '&::-webkit-scrollbar': { width: '4px' },
                           '&::-webkit-scrollbar-track': { background: 'transparent' },
                           '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '24px' },
                         }}
                      >
                        {/* Header */}
                        <HStack mb={2} color="gray.500" fontSize="2xs" spacing={3} px={1} fontWeight="bold">
                          <Text w="30px">STATE</Text>
                          <Text w="50px">AMP</Text>
                          <Text flex="1">PROBABILITY</Text>
                        </HStack>
                        
                        {/* Rows */}
                        {systemState.map((row) => (
                          <HStack key={row.binary} spacing={3} mb={1} align="center" _hover={{ bg: 'whiteAlpha.100' }} px={1} py={0.5} borderRadius="sm">
                            {/* Basis State */}
                            <Text fontFamily="monospace" fontSize="xs" w="30px" color="cyan.300">|{row.binary}⟩</Text>
                            
                            {/* Amplitude */}
                            <Text fontFamily="monospace" w="50px" fontSize="2xs" color="gray.400" isTruncated>
                              {formatAmplitude(row.amplitude)}
                            </Text>
                            
                            {/* Probability Bar */}
                            <Box flex="1">
                              <HStack spacing={2}>
                                <Box flex="1" h="4px" bg="gray.800" borderRadius="full">
                                  <Box 
                                    h="100%" 
                                    w={`${row.probability * 100}%`} 
                                    bg="cyan.500" 
                                    borderRadius="full"
                                    transition="width 0.2s"
                                    boxShadow={`0 0 4px ${row.probability > 0.1 ? 'cyan' : 'transparent'}`}
                                  />
                                </Box>
                                <Text fontSize="2xs" w="25px" textAlign="right" color="gray.400" fontWeight="bold">
                                  {(row.probability * 100).toFixed(0)}%
                                </Text>
                              </HStack>
                            </Box>
                          </HStack>
                        ))}
                        
                        {systemState.length === 0 && (
                          <Text color="gray.500" fontStyle="italic" fontSize="xs" textAlign="center" py={2}>
                            System too large to visualize.
                          </Text>
                        )}
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>

                </Accordion>
              )}

              <Divider />
              
              {/* Visualizer Placeholder */}
              <Box>
                 <Text fontSize="sm" fontWeight="bold" mb={2}>Live Visualizer</Text>
                 {isVcrActive ? (
                   <Box h="150px" bg="gray.900" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                     <Text color="white" fontSize="xs">Bloch Sphere Render (Coming Soon)</Text>
                   </Box>
                 ) : (
                   <Text fontSize="xs" color="gray.500" fontStyle="italic">Waiting for simulation...</Text>
                 )}
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}