import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  useColorModeValue,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Divider,
  Badge,
  Icon,
  Grid,
  GridItem,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Progress,
  Stack,
  Tag,
  useBreakpointValue,
  Checkbox,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectQubits,
  selectGates,
  selectMeasurementSettings,
  selectMeasurementHistory,
  addMeasurementHistoryEntry,
  setMeasurementSettings,
  setCosmicMetrics as setCosmicMetricsAction,
  setHardwareMetrics as setHardwareMetricsAction,
} from '../../store/slices/circuitSlice';
import { Suspense, lazy, useState, useCallback, useEffect, useMemo } from 'react';
// import QuantumStateVisualizer from '../visualization/QuantumStateVisualizer'; // removed
// Local mock measurement removed in favor of backend
import { executeCircuit, checkHealth } from '@/lib/quantumApi';
import { transformStoreGatesToCircuitGates } from '../../utils/circuitUtils';
import { stateVectorToBloch } from '../../utils/blochSphereUtils';
import {
  calculateEntropy,
  calculateMean,
  calculateVariance,
  chiSquaredTest,
  calculateQubitCorrelations,
} from '../../utils/measurementStats';
import { InfoIcon, RepeatIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons';
import FullViewToggle from '../common/FullViewToggle';
import COSMICMetricsPanel from './COSMICMetricsPanel';
import HardwareMetricsPanel from './HardwareMetricsPanel';

const QubitVisualization = lazy(() => import('../visualization/QubitVisualizer'));
const BlochSphereVisualization = lazy(() => import('../visualization/BlochSphereVisualizer'));
const MeasurementVisualizer = lazy(() => import('../visualization/MeasurementVisualizer'));

const SimulationPanel = () => {
  const dispatch = useDispatch();
  const qubits = useSelector(selectQubits);
  const storeGates = useSelector(selectGates);
  const measurementSettings = useSelector(selectMeasurementSettings);
  const measurementHistory = useSelector(selectMeasurementHistory);
  const toast = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [stateVector, setStateVector] = useState<Record<string, [number, number]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<number>(1024);
  const [method, setMethod] = useState<'statevector' | 'noisy'>('statevector');
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [measurementBasis, setMeasurementBasis] = useState<Record<string, string> | null>(null);
  const [perQubitProbabilities, setPerQubitProbabilities] = useState<Record<string, Record<string, number>> | null>(null);
  const [cosmicMetrics, setCosmicMetrics] = useState<any | null>(null);
  const [hardwareMetrics, setHardwareMetrics] = useState<any | null>(null);
  const [confidenceIntervals, setConfidenceIntervals] = useState<Record<string, [number, number]> | null>(null);
  const [includeMetrics, setIncludeMetrics] = useState<boolean>(true);
  const [cosmicApproach, setCosmicApproach] = useState<'occurrences' | 'types' | 'q-cosmic'>('occurrences');
  // Real-time visualization removed: backend-only measurements
  // const [showRealTimeVisualization, setShowRealTimeVisualization] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  // const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  // const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [simulationComplete, setSimulationComplete] = useState<boolean>(false);
  
  // Store visualization instance reference
  // const visualizerRef = useRef<any>(null);
  
  // Transform store gates to circuit gates for visualization
  const gates = transformStoreGatesToCircuitGates(storeGates);
  const numQubits = qubits.length;
  const measurementOverride = measurementSettings.overrideEnabled;
  const measurementOverrideBasis = measurementSettings.basis;
  const measurementResetAfter = measurementSettings.resetAfter;
  const measurementQubits = measurementSettings.qubits;
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const barBg = useColorModeValue('gray.100', 'gray.700');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const accentColor = useColorModeValue('blue.600', 'blue.300');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningColor = useColorModeValue('orange.600', 'orange.300');
  const inputBg = useColorModeValue('white', 'gray.700');
  const optionsBorderColor = useColorModeValue('blue.200', 'blue.700');
  const neutralBg = useColorModeValue('gray.50', 'gray.700');
  const errorBg = useColorModeValue('red.50', 'red.900');
  const errorTextColor = useColorModeValue('red.600', 'red.200');
  const gradientStart = useColorModeValue('#3182CE', '#63B3ED');
  const gradientEnd = useColorModeValue('#805AD5', '#B794F4');
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const tabSize = useBreakpointValue({ base: "sm", md: "md" });

  // Reset simulation results when circuit changes
  useEffect(() => {
    if (results !== null || simulationComplete) {
      setResults(null);
      setCounts(null);
      setStateVector(null);
      setMeasurementBasis(null);
      setPerQubitProbabilities(null);
      setCosmicMetrics(null);
      setHardwareMetrics(null);
      setConfidenceIntervals(null);
      setWarnings(null);
      setSimulationComplete(false);
      setActiveTab(0); // Reset to simulation tab when circuit changes
    }
  }, [qubits, storeGates]);

  // Check server connectivity on mount and periodically
  useEffect(() => {
    let timer: any;
    const ping = async () => {
      const ok = await checkHealth();
      setServerConnected(ok);
    };
    ping();
    timer = setInterval(ping, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const qubitIds = qubits.map((qubit) => qubit.id);
    if (qubitIds.length === 0) {
      return;
    }
    if (measurementSettings.qubits.length === 0) {
      dispatch(setMeasurementSettings({ qubits: qubitIds }));
      return;
    }
    const filtered = measurementSettings.qubits.filter((id) => qubitIds.includes(id));
    if (filtered.length !== measurementSettings.qubits.length) {
      dispatch(setMeasurementSettings({ qubits: filtered }));
    }
  }, [dispatch, measurementSettings.qubits, qubits]);
  
  // Check if circuit has a Hadamard gate (creates superposition)
  const hasHadamard = gates.some(gate => gate.type === 'h');
  const hasEntanglement = gates.some(gate => 
    gate.type === 'cnot' || gate.type === 'cz' || gate.type === 'swap' || gate.type === 'toffoli'
  );
  
  // Get gate counts for analysis
  const getGateStats = useCallback(() => {
    const stats: Record<string, number> = {};
    
    gates.forEach(gate => {
      const type = gate.type;
      stats[type] = (stats[type] || 0) + 1;
    });
    
    return stats;
  }, [gates]);

  const toggleMeasurementQubit = useCallback(
    (qubitId: number) => {
      const current = measurementSettings.qubits;
      const hasQubit = current.includes(qubitId);
      if (hasQubit) {
        if (current.length === 1) return;
        dispatch(setMeasurementSettings({ qubits: current.filter((id) => id !== qubitId) }));
        return;
      }
      dispatch(setMeasurementSettings({ qubits: [...current, qubitId] }));
    },
    [dispatch, measurementSettings.qubits],
  );
  
  // Function to run the simulation
  const runSimulation = async () => {
    // Reset state
    setIsSimulating(true);
    setSimulationComplete(false);
    setResults(null);
    setCounts(null);
    setStateVector(null);
    setError(null);
    setWarnings(null);
    
    try {
      // Validate circuit first
      if (gates.length === 0) {
        throw new Error('Cannot simulate an empty circuit. Add gates to the circuit first.');
      }
      
      // Execute on backend (Qiskit) for measurement probabilities
      try {
        const execMeasurementQubits =
          measurementQubits.length > 0 ? measurementQubits : qubits.map((qubit) => qubit.id);
        const executionGates = storeGates;
        const measurementConfig = measurementOverride
          ? {
              basis: measurementOverrideBasis,
              qubits: execMeasurementQubits,
              classical_bits: execMeasurementQubits,
              reset_after: measurementResetAfter,
              mid_circuit: false,
            }
          : undefined;

        const response = await executeCircuit({
          num_qubits: qubits.length,
          gates: executionGates,
          method,
          shots,
          memory: false,
          include_metrics: includeMetrics,
          cosmic_approach: includeMetrics ? cosmicApproach : undefined,
          measurement_config: measurementConfig,
        });
        setServerConnected(true);
        setResults(response.probabilities);
        setCounts(response.counts ?? null);
        setStateVector(response.statevector ?? null);
        setMeasurementBasis(response.measurement_basis ?? null);
        setPerQubitProbabilities(response.per_qubit_probabilities ?? null);
        setCosmicMetrics(response.cosmic_metrics ?? null);
        setHardwareMetrics(response.hardware_metrics ?? null);
        setConfidenceIntervals(response.confidence_intervals ?? null);
        setWarnings(response.warnings ?? null);
        dispatch(setCosmicMetricsAction(response.cosmic_metrics ?? null));
        dispatch(setHardwareMetricsAction(response.hardware_metrics ?? null));
        dispatch(
          addMeasurementHistoryEntry({
            timestamp: new Date().toISOString(),
            shots: response.shots,
            method: response.method ?? method,
            probabilities: response.probabilities,
            counts: response.counts ?? undefined,
            measurementBasis: response.measurement_basis ?? undefined,
            perQubitProbabilities: response.per_qubit_probabilities ?? undefined,
            confidenceIntervals: response.confidence_intervals ?? undefined,
            cosmicMetrics: response.cosmic_metrics ?? null,
            hardwareMetrics: response.hardware_metrics ?? null,
            measurementOverride: measurementOverride
              ? {
                  overrideEnabled: measurementOverride,
                  basis: measurementOverrideBasis,
                  resetAfter: measurementResetAfter,
                  qubits: selectedMeasurementQubits,
                }
              : null,
          }),
        );
        setSimulationComplete(true);
        setActiveTab(1);
      } catch (err) {
        console.error('Backend execution error:', err);
        const message = err instanceof Error ? err.message : 'Failed to simulate circuit';
        const isBackendError = typeof message === 'string' && message.startsWith('Backend error');

        // Backend errors mean the server is reachable but rejected the circuit.
        setServerConnected(isBackendError ? true : false);
        setError(message);
        setSimulationComplete(false);
        toast({
          title: isBackendError ? 'Simulation error' : 'Server issue',
          description: message,
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      } finally {
        setIsSimulating(false);
      }
      
      // Log simulation details to help with debugging
      console.log('Circuit simulation:', {
        method,
        shots,
        qubits: qubits.length,
        gates: gates.length,
        hasHadamard,
        hasEntanglement,
        gateStats: getGateStats()
      });
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during simulation.');
      setIsSimulating(false); // Make sure we're not stuck in simulating state
    }
  };
  
  // Real-time visualization removed; measurements must come from backend
  
  // Make sure tabs are enabled after simulation completes
  useEffect(() => {
    if (simulationComplete && results) {
      // Make sure the tabs are enabled
      console.log("Simulation is complete, enabling tabs");
    }
  }, [simulationComplete, results]);
  
  const selectedMeasurementQubits =
    measurementQubits.length > 0 ? measurementQubits : qubits.map((qubit) => qubit.id);
  const orderedMeasurementQubits = [...selectedMeasurementQubits].sort((a, b) => b - a);
  const shouldMarginalize =
    measurementOverride && selectedMeasurementQubits.length > 0 && selectedMeasurementQubits.length < numQubits;

  const maxGatePosition = useMemo(() => {
    const base = measurementOverride
      ? storeGates.filter((gate) => gate.type !== 'measure')
      : storeGates;
    return base.reduce((max, gate) => {
      if (typeof gate.position === 'number') {
        return Math.max(max, gate.position);
      }
      return max;
    }, -1);
  }, [measurementOverride, storeGates]);

  const measurementTimeline = useMemo(() => {
    if (measurementOverride) {
      return selectedMeasurementQubits.map((qubitId, index) => ({
        qubit: qubitId,
        position: maxGatePosition + 1 + index,
        basis: measurementOverrideBasis,
      }));
    }
    return storeGates
      .filter((gate) => gate.type === 'measure')
      .map((gate, index) => {
        const params = gate.params || {};
        const target = typeof gate.qubit === 'number' ? gate.qubit : gate.targets?.[0] ?? 0;
        return {
          qubit: target,
          position: typeof gate.position === 'number' ? gate.position : index,
          basis: typeof params.basis === 'string' ? params.basis : 'z',
        };
      })
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [measurementOverride, measurementOverrideBasis, maxGatePosition, selectedMeasurementQubits, storeGates]);

  const cosmicComparison = useMemo(() => {
    const map = new Map<string, any>();
    measurementHistory.forEach((entry) => {
      if (entry.cosmicMetrics) {
        map.set(entry.cosmicMetrics.approach, entry.cosmicMetrics);
      }
    });
    if (cosmicMetrics) {
      map.set(cosmicMetrics.approach, cosmicMetrics);
    }
    return Array.from(map.values());
  }, [measurementHistory, cosmicMetrics]);

  const buildMarginalDistribution = (
    sourceProbs: Record<string, number>,
    sourceCounts?: Record<string, number> | null,
  ) => {
    const probs: Record<string, number> = {};
    const countsMap: Record<string, number> = {};

    Object.entries(sourceProbs).forEach(([state, prob]) => {
      const bits = state.replace(/\s+/g, '').padStart(numQubits, '0');
      const measuredBits = orderedMeasurementQubits.map((q) => bits[bits.length - 1 - q] || '0').join('');
      const key = measuredBits.length > 0 ? measuredBits : '0';
      probs[key] = (probs[key] || 0) + prob;

      if (sourceCounts) {
        const count = sourceCounts[state] ?? Math.round(shots * prob);
        countsMap[key] = (countsMap[key] || 0) + count;
      }
    });

    return { probs, counts: sourceCounts ? countsMap : null };
  };

  const marginal = results && shouldMarginalize ? buildMarginalDistribution(results, counts) : null;
  const displayResults = marginal ? marginal.probs : results;
  const displayCounts = marginal ? marginal.counts : counts;

  const filteredMeasurementBasis =
    measurementOverride && measurementBasis
      ? Object.fromEntries(
          Object.entries(measurementBasis).filter(([qubit]) => selectedMeasurementQubits.includes(Number(qubit))),
        )
      : measurementBasis;
  const filteredPerQubitProbabilities =
    measurementOverride && perQubitProbabilities
      ? Object.fromEntries(
          Object.entries(perQubitProbabilities).filter(([qubit]) => selectedMeasurementQubits.includes(Number(qubit))),
        )
      : perQubitProbabilities;

  const sortedResults = displayResults
    ? Object.entries(displayResults)
        .filter(([_, prob]) => prob > 0.001)
        .sort((a, b) => b[1] - a[1])
    : [];
  const allResults = displayResults ? Object.entries(displayResults).sort((a, b) => b[1] - a[1]) : [];
  const totalShots = displayCounts ? Object.values(displayCounts).reduce((sum, value) => sum + value, 0) : shots;
  const distributionEntropy = displayResults ? calculateEntropy(displayResults) : null;
  const distributionMean = displayResults ? calculateMean(displayResults) : null;
  const distributionVariance = displayResults ? calculateVariance(displayResults) : null;
  const topResult = sortedResults.length > 0 ? sortedResults[0] : null;
  const topState = topResult ? topResult[0] : null;
  const topProbability = topResult ? topResult[1] : null;
  const chiSquare = displayCounts && displayResults ? chiSquaredTest(displayCounts, displayResults) : null;
  const correlationsRaw = displayResults
    ? calculateQubitCorrelations(
        displayResults,
        shouldMarginalize ? selectedMeasurementQubits.length : numQubits,
      )
    : { correlations: [], numQubits: 0 };
  const correlationPairs = correlationsRaw.correlations.map(({ i, j, value }) => {
    if (!shouldMarginalize) {
      return { pair: `q${i}-q${j}`, value };
    }
    const mapIndex = (idx: number) =>
      orderedMeasurementQubits[orderedMeasurementQubits.length - 1 - idx] ?? idx;
    return { pair: `q${mapIndex(i)}-q${mapIndex(j)}`, value };
  });

  const exportResults = useCallback(
    (format: 'csv' | 'json') => {
      if (!displayResults) {
        toast({
          title: 'No results to export',
          description: 'Run a simulation first to generate results.',
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let content = '';
      let mime = '';
      let filename = `measurement-results-${timestamp}.${format}`;

      if (format === 'json') {
        content = JSON.stringify(
          {
            shots,
            method,
            probabilities: displayResults,
            counts: displayCounts ?? undefined,
            measurement_basis: filteredMeasurementBasis ?? undefined,
            per_qubit_probabilities: filteredPerQubitProbabilities ?? undefined,
            confidence_intervals: confidenceIntervals ?? undefined,
            measurement_override: measurementOverride
              ? {
                  basis: measurementOverrideBasis,
                  reset_after: measurementResetAfter,
                  qubits: selectedMeasurementQubits,
                  marginalize: shouldMarginalize,
                }
              : undefined,
            cosmic_metrics: cosmicMetrics ?? undefined,
            hardware_metrics: hardwareMetrics ?? undefined,
          },
          null,
          2,
        );
        mime = 'application/json';
      } else {
        const header = ['state', 'probability', 'count', 'ci_lower', 'ci_upper'];
        const rows = (allResults.length > 0 ? allResults : Object.entries(displayResults)).map(
          ([state, prob]) => {
            const count = displayCounts?.[state] ?? Math.round(shots * prob);
            const interval = confidenceIntervals?.[state];
            const lower = interval ? interval[0] : '';
            const upper = interval ? interval[1] : '';
            return [state, prob.toFixed(6), count, lower, upper].join(',');
          },
        );
        content = [header.join(','), ...rows].join('\n');
        mime = 'text/csv';
      }

      const blob = new Blob([content], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    [
      shots,
      method,
      displayResults,
      displayCounts,
      filteredMeasurementBasis,
      filteredPerQubitProbabilities,
      confidenceIntervals,
      cosmicMetrics,
      hardwareMetrics,
      allResults,
      measurementOverride,
      measurementOverrideBasis,
      measurementResetAfter,
      selectedMeasurementQubits,
      shouldMarginalize,
      toast,
    ],
  );

  // Render the results as a bar chart
  const renderResultsChart = () => {
    if (!displayResults) return null;
    
    // Sort results by count (descending)
    if (sortedResults.length === 0) return <Text>No significant measurement results.</Text>;
    
    const maxValue = Math.max(...sortedResults.map(([_, count]) => count));
    const maxResults = isMobile ? 6 : 10; // Show fewer results on mobile
    const displayRows = sortedResults.slice(0, maxResults);
    const hiddenResults = sortedResults.length - displayRows.length;
    
    return (
      <VStack spacing={3} align="stretch" mt={4}>
        {displayRows.map(([state, prob]) => {
          const percentage = prob * 100;
          const count = displayCounts?.[state] ?? Math.round(shots * prob);
          const interval = shouldMarginalize ? null : confidenceIntervals?.[state];
          const lower = interval ? interval[0] : null;
          const upper = interval ? interval[1] : null;
          
          return (
            <Box key={state} mb={2}>
              <Flex justify="space-between" align="center" mb={1}>
                <HStack>
                  <Text 
                    fontSize="md" 
                    fontWeight="medium" 
                    fontFamily="monospace"
                    bg={barBg} 
                    px={2} 
                    py={1} 
                    borderRadius="md"
                  >
                    |{state}{'>'}
                  </Text>
                  {prob > 0.2 && <StarIcon color="yellow.400" />}
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {count} shots ({percentage.toFixed(1)}%)
                </Text>
              </Flex>
              <Box
                h="24px" 
                bg={barBg}
                borderRadius="full"
                overflow="hidden"
                position="relative"
              >
                <Box
                  h="100%" 
                  bg={`linear-gradient(90deg, ${gradientStart} 0%, ${gradientEnd} 100%)`}
                  w={`${(prob / maxValue) * 100}%`}
                  transition="width 0.3s ease-in-out"
                  borderRadius="full"
                />
                {lower !== null && upper !== null && maxValue > 0 && (
                  <Box
                    position="absolute"
                    top="50%"
                    left={`${(lower / maxValue) * 100}%`}
                    transform="translateY(-50%)"
                    height="4px"
                    width={`${((upper - lower) / maxValue) * 100}%`}
                    bg="orange.400"
                    borderRadius="full"
                  />
                )}
              </Box>
            </Box>
          );
        })}
        
        {hiddenResults > 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            {hiddenResults} more results not shown
          </Text>
        )}
      </VStack>
    );
  };
  
  // Visualization ref removed
  
  // Manual switch to results tab
  const goToResults = () => {
    setActiveTab(1);
  };
  
  // Manual switch to analysis tab
  const goToAnalysis = () => {
    setActiveTab(2);
  };
  
  // Calculate circuit depth - safely handle undefined positions
  const calculateCircuitDepth = () => {
    if (gates.length === 0) return 0;
    // Filter out undefined positions and ensure we have valid numbers
    const validPositions = gates
      .map(g => g.position)
      .filter(p => p !== undefined && p !== null && !isNaN(p)) as number[];
    
    if (validPositions.length === 0) return 1; // If no valid positions, depth is 1
    return Math.max(...validPositions) + 1;
  };
  
  return (
    <Box>
      <Card mb={4} borderRadius="lg" boxShadow="sm" bg={cardBg}>
      <CardHeader pb={0}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <HStack>
            <Heading size="md">Quantum Simulation</Heading>
            {simulationComplete && (
              <Badge colorScheme="green" variant="solid" borderRadius="full" px={2}>
                Complete
              </Badge>
            )}
            <Tag colorScheme={serverConnected === null ? 'gray' : (serverConnected ? 'green' : 'red')} variant="subtle" borderRadius="full" px={2}>
              Server: {serverConnected === null ? 'Checking…' : (serverConnected ? 'Connected' : 'Not Connected')}
            </Tag>
          </HStack>
            
            <HStack>
              <FullViewToggle />
              <Button 
                colorScheme="blue" 
                onClick={runSimulation} 
                isLoading={isSimulating}
                loadingText="Simulating"
                isDisabled={gates.length === 0}
              rightIcon={<ChevronRightIcon />}
              boxShadow="sm"
            >
              Run Simulation
            </Button>
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          {/* Simulation options */}
          <Box 
            mb={4} 
            p={4} 
            borderRadius="lg" 
            bg={accentBg}
            border="1px solid"
            borderColor={optionsBorderColor}
          >
            <Grid 
              templateColumns={isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))"}
              gap={4}
            >
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Simulation Method</FormLabel>
                  <Select 
                    size="sm" 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value as 'statevector' | 'noisy')}
                    isDisabled={isSimulating}
                    borderRadius="md"
                    bg={inputBg}
                    boxShadow="sm"
                  >
                    <option value="statevector">State Vector</option>
                    <option value="noisy">Noisy Simulator</option>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Number of Shots</FormLabel>
                  <Select 
                    size="sm" 
                    value={shots.toString()} 
                    onChange={(e) => setShots(parseInt(e.target.value))}
                    isDisabled={isSimulating}
                    borderRadius="md"
                    bg={inputBg}
                    boxShadow="sm"
                  >
                    <option value="100">100</option>
                    <option value="1024">1024</option>
                    <option value="5000">5000</option>
                    <option value="10000">10000</option>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Metrics</FormLabel>
                  <VStack align="start" spacing={2}>
                    <Checkbox
                      isChecked={includeMetrics}
                      onChange={(e) => setIncludeMetrics(e.target.checked)}
                      isDisabled={isSimulating}
                      size="sm"
                    >
                      Include metrics
                    </Checkbox>
                    <Select
                      size="sm"
                      value={cosmicApproach}
                      onChange={(e) => setCosmicApproach(e.target.value as 'occurrences' | 'types' | 'q-cosmic')}
                      isDisabled={!includeMetrics || isSimulating}
                      borderRadius="md"
                      bg={inputBg}
                      boxShadow="sm"
                    >
                      <option value="occurrences">COSMIC: Occurrences</option>
                      <option value="types">COSMIC: Types</option>
                      <option value="q-cosmic">COSMIC: Q-COSMIC</option>
                    </Select>
                  </VStack>
                </FormControl>
              </GridItem>

              <GridItem colSpan={isMobile ? 1 : 2}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Measurement Override</FormLabel>
                  <VStack align="start" spacing={2}>
                    <Checkbox
                      isChecked={measurementOverride}
                      onChange={(e) => dispatch(setMeasurementSettings({ overrideEnabled: e.target.checked }))}
                      isDisabled={isSimulating}
                      size="sm"
                    >
                      Override circuit measurements
                    </Checkbox>
                    <HStack spacing={3} align="center" w="100%" flexWrap="wrap">
                      <Select
                        size="sm"
                        value={measurementOverrideBasis}
                        onChange={(e) => dispatch(setMeasurementSettings({ basis: e.target.value as 'z' | 'x' | 'y' }))}
                        isDisabled={!measurementOverride || isSimulating}
                        borderRadius="md"
                        bg={inputBg}
                        boxShadow="sm"
                        maxW="180px"
                      >
                        <option value="z">Basis: Z</option>
                        <option value="x">Basis: X</option>
                        <option value="y">Basis: Y</option>
                      </Select>
                      <Checkbox
                        isChecked={measurementResetAfter}
                        onChange={(e) => dispatch(setMeasurementSettings({ resetAfter: e.target.checked }))}
                        isDisabled={!measurementOverride || isSimulating}
                        size="sm"
                      >
                        Reset after measurement
                      </Checkbox>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      Select which qubits to measure (partial measurement). Overrides any measurement gates in the circuit.
                    </Text>
                    <Wrap spacing={2}>
                      {qubits.map((qubit) => (
                        <WrapItem key={qubit.id}>
                          <Checkbox
                            isChecked={selectedMeasurementQubits.includes(qubit.id)}
                            onChange={() => toggleMeasurementQubit(qubit.id)}
                            isDisabled={!measurementOverride || isSimulating}
                            size="sm"
                          >
                            {qubit.name}
                          </Checkbox>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </VStack>
                </FormControl>
              </GridItem>
              
              {/* Real-time Visualization controls removed: backend-only measurements */}
            </Grid>
            
            {gates.length === 0 && (
              <Box mt={4} p={3} borderRadius="md" bg={warningBg}>
                <Flex align="center">
                  <Icon as={InfoIcon} color={warningColor} mr={2} />
                  <Text color={warningColor} fontSize="sm">
                    Your circuit is empty. Add gates from the sidebar to enable simulation.
                  </Text>
                </Flex>
              </Box>
            )}
          </Box>
          
          {/* Tabbed interface for visualization and results */}
          <Tabs 
            variant="soft-rounded" 
            colorScheme="blue" 
            index={activeTab} 
            onChange={(index) => setActiveTab(index)}
            isLazy
            size={tabSize}
          >
            <TabList overflowX="auto" overflowY="hidden" py={2}>
              <Tab 
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Simulation
              </Tab>
              <Tab 
                isDisabled={!simulationComplete || !results}
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Results
              </Tab>
              <Tab 
                isDisabled={!simulationComplete || !results}
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Analysis
              </Tab>
              <Tab 
                isDisabled={!simulationComplete || !results}
                _selected={{ 
                  color: "white", 
                  bg: "blue.500",
                  boxShadow: "md" 
                }}
                fontWeight="medium"
              >
                Bloch Sphere
              </Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  {isSimulating ? (
                    <CardBody>
                      <VStack spacing={4} justify="center" h="300px">
                        <Spinner size="xl" thickness="4px" color="blue.500" />
                        <Text fontWeight="medium">Running quantum simulation...</Text>
                        <HStack>
                          <Progress 
                            size="sm" 
                            isIndeterminate 
                            width="200px" 
                            colorScheme="blue" 
                            borderRadius="full" 
                          />
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          Simulating circuit with {gates.length} gates on {qubits.length} qubits
                        </Text>
                      </VStack>
                    </CardBody>
                  ) : error ? (
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Flex 
                          p={4} 
                          bg={errorBg} 
                          color={errorTextColor}
                          borderRadius="md"
                          align="center"
                        >
                          <Icon as={InfoIcon} mr={2} />
                          <Text fontWeight="medium">Error:</Text>
                        </Flex>
                        <Text color={errorTextColor}>{error}</Text>
                        <Box mt={2} p={3} bg={neutralBg} borderRadius="md">
                          <Text fontSize="sm">Try simplifying your circuit or checking for invalid gate configurations.</Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  ) : simulationComplete && results ? (
                    <CardBody>
                      <VStack spacing={4}>
                        <HStack mt={4} spacing={4}>
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            onClick={goToResults}
                            leftIcon={<ChevronRightIcon />}
                            boxShadow="sm"
                          >
                            View Results
                          </Button>
                          <Button 
                            size="sm" 
                            colorScheme="purple" 
                            onClick={goToAnalysis}
                            leftIcon={<ChevronRightIcon />}
                            boxShadow="sm"
                          >
                            View Analysis
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  ) : (
                    <CardBody>
                      <VStack spacing={4} align="stretch" justify="center" h="300px">
                        <Icon as={InfoIcon} fontSize="5xl" color="blue.400" alignSelf="center" />
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Click "Run Simulation" to execute measurements on the backend and view accurate results.
                        </Text>
                        {gates.length === 0 ? (
                          <Box p={3} borderRadius="md" bg={warningBg}>
                            <Text fontSize="sm" color={warningColor} textAlign="center" fontWeight="medium">
                              Add gates to your circuit first
                            </Text>
                          </Box>
                        ) : (
                          <Box p={3} borderRadius="md" bg={accentBg}>
                            <Text fontSize="sm" color={accentColor} textAlign="center">
                              Your circuit has {gates.length} gates on {qubits.length} qubits
                            </Text>
                          </Box>
                        )}
                        <Button 
                          alignSelf="center" 
                          mt={2} 
                          colorScheme="blue" 
                          onClick={runSimulation}
                          isDisabled={gates.length === 0}
                          leftIcon={<RepeatIcon />}
                          size="md"
                          boxShadow="md"
                        >
                          Run Simulation
                        </Button>
                      </VStack>
                    </CardBody>
                  )}
                </Card>
              </TabPanel>
              
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <CardBody>
                    {!simulationComplete || !results ? (
                      <VStack spacing={4} justify="center" h="300px">
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Run the simulation to see measurement results.
                        </Text>
                      </VStack>
                    ) : (
                      <Box>
                        <Flex 
                          justify="space-between" 
                          mb={4} 
                          align="center" 
                          pb={3} 
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Heading size="md">Measurement Results</Heading>
                          <HStack spacing={3} align="center">
                            <HStack spacing={2}>
                              <Button size="xs" variant="outline" onClick={() => exportResults('csv')}>
                                Export CSV
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => exportResults('json')}>
                                Export JSON
                              </Button>
                            </HStack>
                            <Badge 
                              colorScheme="blue" 
                              variant="solid" 
                              borderRadius="full" 
                              px={3} 
                              py={1}
                              boxShadow="sm"
                            >
                              {shots} shots
                            </Badge>
                            <Text fontSize="sm" color="gray.500">
                              {method === 'statevector' ? 'State Vector' : 'Noisy Simulator'}
                            </Text>
                          </HStack>
                        </Flex>

                        {measurementOverride && (
                          <Box mb={4} p={3} borderRadius="md" bg={neutralBg} borderWidth="1px" borderColor={borderColor}>
                            <Text fontSize="sm" fontWeight="medium" mb={1}>
                              Measurement override enabled
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              Basis: {measurementOverrideBasis.toUpperCase()} · Reset after: {measurementResetAfter ? 'On' : 'Off'} · Qubits:{' '}
                              {selectedMeasurementQubits.map((id) => `q${id}`).join(', ')}
                            </Text>
                            {shouldMarginalize && (
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Showing marginal distribution over measured qubits only.
                              </Text>
                            )}
                          </Box>
                        )}
                        
                        {renderResultsChart()}

                        {distributionEntropy !== null && (
                          <Grid
                            templateColumns={isMobile ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))'}
                            gap={3}
                            mt={6}
                          >
                            <Box p={3} borderRadius="md" bg={accentBg} borderWidth="1px" borderColor={borderColor}>
                              <Text fontSize="xs" color={accentColor} fontWeight="bold">
                                ENTROPY
                              </Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {distributionEntropy.toFixed(4)}
                              </Text>
                            </Box>
                            <Box p={3} borderRadius="md" bg={accentBg} borderWidth="1px" borderColor={borderColor}>
                              <Text fontSize="xs" color={accentColor} fontWeight="bold">
                                MEAN VALUE
                              </Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {distributionMean !== null ? distributionMean.toFixed(4) : '--'}
                              </Text>
                            </Box>
                            <Box p={3} borderRadius="md" bg={accentBg} borderWidth="1px" borderColor={borderColor}>
                              <Text fontSize="xs" color={accentColor} fontWeight="bold">
                                VARIANCE
                              </Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {distributionVariance !== null ? distributionVariance.toFixed(4) : '--'}
                              </Text>
                            </Box>
                            <Box p={3} borderRadius="md" bg={accentBg} borderWidth="1px" borderColor={borderColor}>
                              <Text fontSize="xs" color={accentColor} fontWeight="bold">
                                MOST LIKELY
                              </Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {topState ? `|${topState}>` : '--'}
                              </Text>
                              {topProbability !== null && (
                                <Text fontSize="xs" color="gray.500">
                                  {(topProbability * 100).toFixed(1)}%
                                </Text>
                              )}
                            </Box>
                            <Box p={3} borderRadius="md" bg={accentBg} borderWidth="1px" borderColor={borderColor}>
                              <Text fontSize="xs" color={accentColor} fontWeight="bold">
                                TOTAL SHOTS
                              </Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {totalShots}
                              </Text>
                            </Box>
                            <Box p={3} borderRadius="md" bg={accentBg} borderWidth="1px" borderColor={borderColor}>
                              <Text fontSize="xs" color={accentColor} fontWeight="bold">
                                CHI-SQUARE
                              </Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {chiSquare ? chiSquare.statistic.toFixed(3) : '--'}
                              </Text>
                              {chiSquare && (
                                <Text fontSize="xs" color="gray.500">
                                  dof {chiSquare.dof}
                                </Text>
                              )}
                            </Box>
                            <Box p={3} borderRadius="md" bg={accentBg} borderWidth="1px" borderColor={borderColor}>
                              <Text fontSize="xs" color={accentColor} fontWeight="bold">
                                P-VALUE
                              </Text>
                              <Text fontSize="lg" fontWeight="bold">
                                {chiSquare && chiSquare.pValue !== null ? chiSquare.pValue.toFixed(4) : '--'}
                              </Text>
                            </Box>
                          </Grid>
                        )}

                        <Box mt={6}>
                          <Heading size="sm" mb={2}>
                            Result Details
                          </Heading>
                          {sortedResults.length === 0 ? (
                            <Text fontSize="sm" color="gray.500">
                              No detailed results to display.
                            </Text>
                          ) : (
                            <Box overflowX="auto">
                              <Table size="sm" variant="simple">
                                <Thead>
                                  <Tr>
                                    <Th>State</Th>
                                    <Th isNumeric>Probability</Th>
                                    <Th isNumeric>Count</Th>
                                    <Th isNumeric>CI Low</Th>
                                    <Th isNumeric>CI High</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {sortedResults.slice(0, isMobile ? 8 : 12).map(([state, prob]) => {
                                    const count = displayCounts?.[state] ?? Math.round(shots * prob);
                                    const interval = shouldMarginalize ? null : confidenceIntervals?.[state];
                                    const lower = interval ? interval[0] : null;
                                    const upper = interval ? interval[1] : null;

                                    return (
                                      <Tr key={state}>
                                        <Td fontFamily="monospace">|{state}{'>'}</Td>
                                        <Td isNumeric>{prob.toFixed(4)}</Td>
                                        <Td isNumeric>{count}</Td>
                                        <Td isNumeric>{lower !== null ? lower.toFixed(4) : '--'}</Td>
                                        <Td isNumeric>{upper !== null ? upper.toFixed(4) : '--'}</Td>
                                      </Tr>
                                    );
                                  })}
                                </Tbody>
                              </Table>
                            </Box>
                          )}
                        </Box>

                        <Box mt={6}>
                          <Suspense
                            fallback={
                              <Flex align="center" justify="center" h="120px">
                                <Spinner size="sm" />
                              </Flex>
                            }
                          >
                            <MeasurementVisualizer
                              perQubitProbabilities={filteredPerQubitProbabilities}
                              measurementBasis={filteredMeasurementBasis}
                              confidenceIntervals={shouldMarginalize ? null : confidenceIntervals}
                              stateProbabilities={displayResults ?? undefined}
                              measurementTimeline={measurementTimeline}
                            />
                          </Suspense>
                        </Box>

                        <Box mt={6}>
                          <Heading size="sm" mb={2}>
                            Qubit Correlations
                          </Heading>
                          {correlationPairs.length === 0 ? (
                            <Text fontSize="sm" color="gray.500">
                              Correlations are unavailable for a single-qubit distribution.
                            </Text>
                          ) : (
                            <Wrap spacing={2}>
                              {correlationPairs.map((item) => (
                                <WrapItem key={item.pair}>
                                  <Tag size="sm" colorScheme={item.value >= 0 ? 'green' : 'red'}>
                                    {item.pair}: {item.value.toFixed(3)}
                                  </Tag>
                                </WrapItem>
                              ))}
                            </Wrap>
                          )}
                        </Box>

                        {warnings && warnings.length > 0 && (
                          <Box mt={6} p={3} borderRadius="md" bg={warningBg}>
                            <Flex align="center" mb={1}>
                              <Icon as={InfoIcon} color={warningColor} mr={2} />
                              <Text fontSize="sm" color={warningColor} fontWeight="medium">
                                Backend Notice
                              </Text>
                            </Flex>
                            <VStack align="start" spacing={1} mt={1}>
                              {warnings.map((warning, idx) => (
                                <Text key={`${warning}-${idx}`} fontSize="sm" color={warningColor}>
                                  {warning}
                                </Text>
                              ))}
                            </VStack>
                          </Box>
                        )}
                        
                        <Box mt={6} p={3} borderRadius="md" bg={accentBg}>
                          <Flex align="center">
                            <Icon as={InfoIcon} color={accentColor} mr={2} />
                            <Text fontSize="sm" color={accentColor}>
                              These results show the probability distribution of measuring each possible state.
                              In a real quantum computer, each shot produces a single measurement result according to these probabilities.
                            </Text>
                          </Flex>
                        </Box>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
              
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <CardBody>
                    {!simulationComplete || !results ? (
                      <VStack spacing={4} align="stretch" justify="center" h="300px">
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Run the simulation to see circuit analysis.
                        </Text>
                      </VStack>
                    ) : (
                      <Box mt={2}>
                        <Heading size="md" mb={4}>Circuit Analysis</Heading>
                        <Grid 
                          templateColumns={isMobile ? "1fr" : "repeat(3, 1fr)"}
                          gap={4}
                          mb={6}
                        >
                          <Card borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="xs" color={accentColor} textTransform="uppercase" fontWeight="bold">
                                Circuit Type
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              <Text fontSize="xl" fontWeight="bold">
                                {hasEntanglement 
                                  ? 'Entangled'
                                  : hasHadamard
                                    ? 'Superposition'
                                    : 'Classical'
                                }
                              </Text>
                              <Tag 
                                size="sm" 
                                colorScheme={hasEntanglement ? "purple" : hasHadamard ? "blue" : "gray"}
                                mt={1}
                                borderRadius="full"
                              >
                                {hasEntanglement ? "Quantum Correlation" : hasHadamard ? "Quantum" : "Deterministic"}
                              </Tag>
                            </CardBody>
                          </Card>
                          
                          <Card borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="xs" color={accentColor} textTransform="uppercase" fontWeight="bold">
                                Circuit Size
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                                <Box>
                                  <Text fontSize="xs" color="gray.500">QUBITS</Text>
                                  <Text fontSize="xl" fontWeight="bold">{qubits.length}</Text>
                                </Box>
                                <Box>
                                  <Text fontSize="xs" color="gray.500">GATES</Text>
                                  <Text fontSize="xl" fontWeight="bold">{gates.length}</Text>
                                </Box>
                              </Stack>
                            </CardBody>
                          </Card>
                          
                          <Card borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="xs" color={accentColor} textTransform="uppercase" fontWeight="bold">
                                Circuit Depth
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              <Text fontSize="xl" fontWeight="bold">
                                {calculateCircuitDepth()}
                              </Text>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Maximum number of time steps
                              </Text>
                            </CardBody>
                          </Card>
                        </Grid>
                        
                        <Card mt={4} borderRadius="md" overflow="hidden" variant="outline">
                          <CardHeader bg={accentBg} py={2} px={4}>
                            <Text fontSize="sm" color={accentColor} fontWeight="bold">
                              Quantum Properties
                            </Text>
                          </CardHeader>
                          <CardBody py={3} px={4}>
                            <VStack align="start" spacing={3} mt={1}>
                              <Flex align="center">
                                <Badge 
                                  colorScheme={hasHadamard ? "blue" : "gray"}
                                  mr={2}
                                  variant="subtle"
                                  borderRadius="full"
                                >
                                  {hasHadamard ? "Present" : "Absent"}
                                </Badge>
                                <Text fontSize="sm">
                                  <strong>Superposition:</strong> 
                                  {hasHadamard && ' Hadamard gates create quantum superposition'}
                                </Text>
                                <Tooltip 
                                  label="Superposition allows a qubit to exist in multiple states simultaneously" 
                                  placement="right"
                                >
                                  <InfoIcon ml={1} boxSize={3} color="gray.500" />
                                </Tooltip>
                              </Flex>
                              
                              <Flex align="center">
                                <Badge 
                                  colorScheme={hasEntanglement ? "purple" : "gray"}
                                  mr={2}
                                  variant="subtle"
                                  borderRadius="full"
                                >
                                  {hasEntanglement ? "Present" : "Absent"}
                                </Badge>
                                <Text fontSize="sm">
                                  <strong>Entanglement:</strong>
                                  {hasEntanglement && ' Multi-qubit gates create quantum entanglement'}
                                </Text>
                                <Tooltip 
                                  label="Entanglement creates correlations between qubits that cannot be described classically" 
                                  placement="right"
                                >
                                  <InfoIcon ml={1} boxSize={3} color="gray.500" />
                                </Tooltip>
                              </Flex>
                              
                              {/* Gate distribution */}
                              <Box mt={2} w="100%">
                                <Text fontSize="sm" fontWeight="medium" mb={2}>Gate Distribution:</Text>
                                <Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))" gap={2}>
                                  {Object.entries(getGateStats()).map(([gateType, count]) => (
                                    <Box 
                                      key={gateType} 
                                      p={2} 
                                      borderRadius="md" 
                                      bg={neutralBg}
                                      textAlign="center"
                                    >
                                      <Text fontSize="xs" fontWeight="bold" mb={1}>
                                        {gateType.toUpperCase()}
                                      </Text>
                                      <Text fontSize="lg" fontWeight="medium">
                                        {count}
                                      </Text>
                                    </Box>
                                  ))}
                                </Grid>
                              </Box>
                            </VStack>
                          </CardBody>
                        </Card>
                        
                        {/* Bloch coordinates for a single qubit case */}
                        {qubits.length === 1 && results && (
                          <Card mt={4} borderRadius="md" overflow="hidden" variant="outline">
                            <CardHeader bg={accentBg} py={2} px={4}>
                              <Text fontSize="sm" color={accentColor} fontWeight="bold">
                                Bloch Sphere Coordinates
                              </Text>
                            </CardHeader>
                            <CardBody py={3} px={4}>
                              {(() => {
                                const bloch = stateVector ? stateVectorToBloch(stateVector, 0) : null;
                                if (!bloch) {
                                  return (
                                    <Text fontSize="sm" color="gray.500">
                                      Bloch coordinates require statevector data. Switch "Simulation Method" to "State Vector".
                                    </Text>
                                  );
                                }

                                return (
                                  <Grid 
                                    templateColumns={isMobile ? "1fr" : "repeat(3, 1fr)"} 
                                    gap={4}
                                    textAlign="center"
                                  >
                                    <Box>
                                      <Text fontSize="sm" color="gray.500">X COORDINATE</Text>
                                      <Text 
                                        fontSize="lg" 
                                        fontWeight="bold" 
                                        fontFamily="monospace"
                                        color="red.500"
                                      >
                                        {bloch.x.toFixed(4)}
                                      </Text>
                                    </Box>
                                    <Box>
                                      <Text fontSize="sm" color="gray.500">Y COORDINATE</Text>
                                      <Text 
                                        fontSize="lg" 
                                        fontWeight="bold" 
                                        fontFamily="monospace"
                                        color="green.500"
                                      >
                                        {bloch.y.toFixed(4)}
                                      </Text>
                                    </Box>
                                    <Box>
                                      <Text fontSize="sm" color="gray.500">Z COORDINATE</Text>
                                      <Text 
                                        fontSize="lg" 
                                        fontWeight="bold" 
                                        fontFamily="monospace"
                                        color="blue.500"
                                      >
                                        {bloch.z.toFixed(4)}
                                      </Text>
                                    </Box>
                                  </Grid>
                                );
                              })()}
                              <Divider my={3} />
                              <Text fontSize="sm" color="gray.500" mt={1}>
                                These coordinates represent the position of your qubit state on the Bloch sphere.
                                X, Y, and Z values correspond to the expectation values of the Pauli operators.
                              </Text>
                            </CardBody>
                          </Card>
                        )}

                        <Box mt={6}>
                          <Heading size="md" mb={4}>
                            Backend Metrics
                          </Heading>
                          {!includeMetrics ? (
                            <Text fontSize="sm" color="gray.500">
                              Enable "Include metrics" to view COSMIC and hardware metrics.
                            </Text>
                          ) : (
                            <Grid
                              templateColumns={isMobile ? '1fr' : 'repeat(2, minmax(280px, 1fr))'}
                              gap={4}
                            >
                              <COSMICMetricsPanel metrics={cosmicMetrics} comparison={cosmicComparison} />
                              <HardwareMetricsPanel metrics={hardwareMetrics} />
                            </Grid>
                          )}
                        </Box>
                        
                        <Box 
                          mt={4} 
                          p={4} 
                          borderRadius="md" 
                          bg={neutralBg}
                          borderWidth="1px"
                          borderColor={borderColor}
                        >
                          <Flex align="center" mb={2}>
                            <Icon as={InfoIcon} mr={2} color="blue.500" />
                            <Text fontSize="sm" fontWeight="medium">Simulation Details</Text>
                          </Flex>
                          <Text fontSize="sm" fontStyle="italic" color="gray.500">
                            This is a simplified simulation. A real quantum computer would be affected by
                            noise, decoherence, and gate errors. For noisy simulations, try the "Noisy Simulator" method.
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
              
              {/* New Bloch Sphere Tab */}
              <TabPanel p={0} pt={3}>
                <Card 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg={cardBg}
                  minH="350px"
                  maxH="800px"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="auto"
                  resize="vertical"
                  sx={{
                    resize: 'vertical',
                    '&::-webkit-resizer': {
                      background: borderColor,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <CardBody>
                    {!simulationComplete || !results ? (
                      <VStack spacing={4} align="stretch" justify="center" h="300px">
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          Run the simulation to see Bloch sphere visualization.
                        </Text>
                      </VStack>
                    ) : !stateVector ? (
                      <VStack spacing={4} align="stretch" justify="center" h="300px">
                        <Text color="gray.500" textAlign="center" fontWeight="medium">
                          {warnings && warnings.length > 0
                            ? warnings.join(' ')
                            : 'Statevector visualization is unavailable for this run. Select "State Vector" as the simulation method.'}
                        </Text>
                      </VStack>
                    ) : (
                      <Box>
                        <Heading size="md" mb={4}>Qubit Visualization</Heading>
                        
                        <Suspense
                          fallback={
                            <Flex align="center" justify="center" h="400px">
                              <Spinner size="lg" />
                            </Flex>
                          }
                        >
                          {qubits.length === 1 ? (
                            <Flex direction={isMobile ? "column" : "row"} align="center" justify="center">
                              {/* Single qubit case - Show just the Bloch sphere */}
                              <Box flex="1">
                                <BlochSphereVisualization
                                  stateVector={stateVector}
                                  width={isMobile ? 300 : 400}
                                  height={isMobile ? 300 : 400}
                                  title="Single Qubit Bloch Sphere"
                                />
                              </Box>
                              
                              <Box 
                                flex="1" 
                                mt={isMobile ? 6 : 0} 
                                ml={isMobile ? 0 : 6}
                                p={4}
                                borderRadius="md"
                                bg={accentBg}
                              >
                                <Heading size="sm" mb={3}>Bloch Sphere Explained</Heading>
                                <Text fontSize="sm" mb={3}>
                                  The Bloch sphere is a geometrical representation of a single-qubit quantum state.
                                  Any pure state of a qubit can be represented as a point on the surface of the sphere.
                                </Text>
                                
                                <VStack align="start" spacing={2} fontSize="sm">
                                  <HStack>
                                    <Box 
                                      w="12px" 
                                      h="12px" 
                                      borderRadius="full" 
                                      bg="red.400" 
                                    />
                                    <Text>X-axis: Corresponds to the Pauli-X operator</Text>
                                  </HStack>
                                  <HStack>
                                    <Box 
                                      w="12px" 
                                      h="12px" 
                                      borderRadius="full" 
                                      bg="green.400" 
                                    />
                                    <Text>Y-axis: Corresponds to the Pauli-Y operator</Text>
                                  </HStack>
                                  <HStack>
                                    <Box 
                                      w="12px" 
                                      h="12px" 
                                      borderRadius="full" 
                                      bg="blue.400" 
                                    />
                                    <Text>Z-axis: Corresponds to the Pauli-Z operator</Text>
                                  </HStack>
                                </VStack>
                                
                                <Text fontSize="sm" mt={3}>
                                  <strong>North pole (|0⟩):</strong> The standard computational basis state |0⟩
                                </Text>
                                <Text fontSize="sm">
                                  <strong>South pole (|1⟩):</strong> The standard computational basis state |1⟩
                                </Text>
                                <Text fontSize="sm">
                                  <strong>Equator:</strong> Equal superpositions of |0⟩ and |1⟩, differing by phase
                                </Text>
                              </Box>
                            </Flex>
                          ) : (
                            // Multi-qubit case - Show the full QubitVisualization component
                            <QubitVisualization
                              stateVector={stateVector}
                              numQubits={qubits.length}
                              title="Qubit State Visualization"
                            />
                          )}
                        </Suspense>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Box>
  );
};

export default SimulationPanel;
