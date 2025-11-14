import { 
  Box, Text, VStack, HStack, Heading, Divider, 
  useColorModeValue, Slider, SliderTrack, SliderFilledTrack, SliderThumb, 
  Flex, IconButton, Tooltip, useToast 
} from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectQubits, selectGates, selectMaxPosition, 
  addGate, removeGate, importCircuit, Gate, Qubit 
} from '../../store/slices/circuitSlice';
import { 
  selectSelectedGateId, selectZoomLevel, setZoomLevel, selectGate 
} from '../../store/slices/uiSlice';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { CircuitPosition, DroppedGate, Gate as CircuitGate } from '../../types/circuit';
import { gateLibrary } from '../../utils/gateLibrary';
import { renderCircuitSvg } from '../../utils/circuitRenderer';
import GridCell from './GridCell';
import ResizablePanel from '../layout/ResizablePanel';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import ImportCircuitButton from '../ui-helpers/importButton';
import type { AppDispatch } from '../../store';

import type { DecodedCircuit } from '../generator/decoders/decoders';
/**
 * CircuitCanvas component displays the quantum circuit grid and visualization
 */
const CircuitCanvas: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  // Redux state
  const qubits = useSelector(selectQubits);
  const gates = useSelector(selectGates);
  const maxPosition = useSelector(selectMaxPosition);
  const selectedGateId = useSelector(selectSelectedGateId);
  const zoomLevel = useSelector(selectZoomLevel);

  // Local state
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(300);
  const [visualizationHeight, setVisualizationHeight] = useState(300);
  const [cellSize, setCellSize] = useState(60);

  // Theme colors
  const gridBg = useColorModeValue('gray.50', 'gray.700');
  const gridBorderColor = useColorModeValue('gray.200', 'gray.600');
  const qubitLabelBg = useColorModeValue('blue.50', 'blue.900');
  const qubitLabelColor = useColorModeValue('blue.800', 'blue.100');
  const canvasBg = useColorModeValue('white', 'gray.800');
  const canvasBorder = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const controlsBg = useColorModeValue('gray.100', 'gray.700');

  // --- Circuit import handler ---


const handleCircuitImport = useCallback(
  (decoded: DecodedCircuit) => {
    try {
      // Convert qubits string[] -> Qubit[]
      const qubitsConverted: Qubit[] = decoded.qubits.map((name, idx) => ({
        id: idx,
        name: name.toString()
      }));

      // Track the next available position for each qubit
      const nextPosition: Record<number, number> = {};

      // Normalize gates
      const gatesConverted: Gate[] = decoded.gates.map(g => {
        const type = g.type.toLowerCase();
        const gateDef = gateLibrary.find(gl => gl.id === type);

        const params: Record<string, number> = {};
        gateDef?.params?.forEach(p => {
          params[p.name] = Number(g.params?.[p.name] ?? p.default);
        });

        // Determine which qubits this gate acts on
        const allQubits = [Number(g.qubit ?? 0), ...(g.targets ?? []), ...(g.controls ?? [])];

        // Find the next available position across all involved qubits
        const position = Math.max(...allQubits.map(q => nextPosition[q] ?? 0));

        // Update nextPosition for all involved qubits
        allQubits.forEach(q => {
          nextPosition[q] = position + 1;
        });

        return {
          id: g.id ?? crypto.randomUUID(),
          type,
          qubit: Number(g.qubit ?? 0),
          position,
          params,
          targets: (g.targets ?? []).map(t => Number(t)),
          controls: (g.controls ?? []).map(c => Number(c)),
        };
      });

      console.log('Imported qubits:', qubitsConverted);
      console.log('Imported gates:', gatesConverted);

      dispatch(importCircuit({
        qubits: qubitsConverted,
        gates: gatesConverted,
        maxPosition: Math.max(...Object.values(nextPosition), 10),
        name: 'Imported Circuit',
        description: ''
      }));

      toast({
        title: 'Circuit imported',
        description: `Successfully imported ${gatesConverted.length} gates`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      console.error('Failed to import circuit:', err);
      toast({
        title: 'Import Error',
        description: 'Could not import circuit',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  },
  [dispatch, toast]
);



  // Convert SliceGate[] to CircuitGate[]
  const circuitGates = useMemo(() => gates
  .map(gate => {
    const gateDef = gateLibrary.find(gl => gl.id === gate.type);
    if (!gateDef) {
      console.warn(`Gate type "${gate.type}" not found`);
      return null;
    }

    // Copy basic info from library
    const baseGate: CircuitGate = {
      ...gate,
      name: gateDef.name,
      symbol: gateDef.symbol,
      description: gateDef.description || '',
      category: gateDef.category || 'unknown',
      color: gateDef.color || 'gray'
    };

    // Handle parameterized gates (rx, ry, rz, p, etc.)
    if (gateDef.params?.length) {
      baseGate.params = {};
      gateDef.params.forEach(p => {
        if (gate.params && gate.params[p.name] !== undefined) {
          baseGate.params![p.name] = gate.params[p.name];
        } else {
          baseGate.params![p.name] = p.default;
        }
      });
    }

    // Ensure qubits for multi-target/control gates
    baseGate.targets = gate.targets?.length ? gate.targets : [];
    baseGate.controls = gate.controls?.length ? gate.controls : [];

    return baseGate;
  })
  .filter(Boolean) as CircuitGate[],
[gates]);



  // Render SVG with debounce
  useEffect(() => {
    if (!qubits.length) return;
    const timer = setTimeout(() => {
      try {
        const svg = renderCircuitSvg(qubits, circuitGates);
        if (svgContainerRef.current) svgContainerRef.current.innerHTML = svg;
      } catch (err) {
        console.error('SVG render error:', err);
        toast({
          title: 'Visualization Error',
          description: 'Could not render the circuit visualization.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [qubits, circuitGates, toast]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 0.1, 2.0);
    dispatch(setZoomLevel(newZoom));
    setCellSize(60 * newZoom);
  }, [zoomLevel, dispatch]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.5);
    dispatch(setZoomLevel(newZoom));
    setCellSize(60 * newZoom);
  }, [zoomLevel, dispatch]);

  const handleZoomChange = useCallback((value: number) => {
    dispatch(setZoomLevel(value));
    setCellSize(60 * value);
  }, [dispatch]);

  // Gate drop handler
  const handleDrop = useCallback((item: DroppedGate, position: CircuitPosition) => {
    try {
      const gateDef = gateLibrary.find(g => g.id === item.gateType);
      if (!gateDef) return;

      const newGate: Omit<Gate, "id"> = { type: gateDef.id, qubit: position.qubit, position: position.position, params: {} };

      if (gateDef.params?.length) {
        newGate.params = gateDef.params.reduce((acc, param) => ({ ...acc, [param.name]: param.default }), {});
      }

      // Multi-qubit handling
      if ((gateDef.targets ?? 0) > 0) {
        const availableQubits = qubits.filter(q => q.id !== position.qubit).map(q => q.id);
        if (availableQubits.length < gateDef.targets!) {
          toast({ title: "Not enough target qubits", status: 'warning', duration: 3000, isClosable: true });
          return;
        }
        newGate.targets = availableQubits.slice(0, gateDef.targets);
      }

      if ((gateDef.controls ?? 0) > 0) {
        const availableControlQubits = qubits.filter(q => q.id !== position.qubit).map(q => q.id);
        if (availableControlQubits.length < gateDef.controls!) {
          toast({ title: "Not enough control qubits", status: 'warning', duration: 3000, isClosable: true });
          return;
        }
        newGate.controls = availableControlQubits.slice(0, gateDef.controls);
      }

      dispatch(addGate(newGate));
    } catch (err) {
      toast({ title: 'Error Adding Gate', description: err instanceof Error ? err.message : 'Unknown', status: 'error', duration: 3000, isClosable: true });
    }
  }, [dispatch, qubits, toast]);

  // Gate click/remove
  const handleGateClick = useCallback((gateId: string) => dispatch(selectGate(gateId)), [dispatch]);
  const handleGateRemove = useCallback((gateId: string) => dispatch(removeGate(gateId)), [dispatch]);

  // Render grid
  const renderGrid = useMemo(() => {
    if (!qubits.length) return null;
    return qubits.map((qubit, qIdx) => {
      const cells = Array.from({ length: maxPosition }, (_, pos) => (
        <GridCell
          key={`cell-${qIdx}-${pos}`}
          qubit={qIdx}
          position={pos}
          gates={circuitGates}
          selectedGateId={selectedGateId}
          gridBorderColor={gridBorderColor}
          gridBg={gridBg}
          onDrop={handleDrop}
          onGateClick={handleGateClick}
          onGateRemove={handleGateRemove}
          width={`${cellSize}px`}
          height={`${cellSize}px`}
        />
      ));

      return (
        <HStack key={`row-${qIdx}`} spacing={0} align="center">
          <Box
            w={`${cellSize + 20}px`}
            h={`${cellSize}px`}
            bg={qubitLabelBg}
            color={qubitLabelColor}
            borderWidth={1}
            borderColor={gridBorderColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            borderRadius="md 0 0 md"
          >
            {qubit.name}
          </Box>
          {cells}
        </HStack>
      );
    });
  }, [qubits, maxPosition, circuitGates, selectedGateId, gridBorderColor, gridBg, qubitLabelBg, qubitLabelColor, handleDrop, handleGateClick, handleGateRemove, cellSize]);

  if (!qubits.length) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="md" color={headingColor}>No qubits in circuit</Heading>
        <Text mt={2}>Add qubits from the sidebar to start building your circuit</Text>
      </Box>
    );
  }

  return (
    <Box bg={canvasBg} borderRadius="md" boxShadow="sm">
      {/* Zoom Controls */}
      <Flex p={2} bg={controlsBg} borderRadius="md" mb={2} alignItems="center">
        <Text fontSize="sm" mr={2}>Zoom:</Text>
        <Tooltip label="Zoom Out">
          <IconButton aria-label="Zoom out" icon={<MinusIcon />} size="sm" onClick={handleZoomOut} mr={2}/>
        </Tooltip>
        <Slider value={zoomLevel} min={0.5} max={2} step={0.1} onChange={handleZoomChange} w="150px" colorScheme="blue">
          <SliderTrack><SliderFilledTrack /></SliderTrack>
          <SliderThumb />
        </Slider>
        <Tooltip label="Zoom In">
          <IconButton aria-label="Zoom in" icon={<AddIcon />} size="sm" onClick={handleZoomIn} ml={2}/>
        </Tooltip>
        <Text fontSize="sm" ml={2}>{Math.round(zoomLevel * 100)}%</Text>
      </Flex>

      {/* Circuit Grid */}
      <ResizablePanel direction="vertical" defaultSize={gridHeight} minSize={200} maxSize={600} onResize={setGridHeight} mb={4}>
        <Box p={4}>
          <ImportCircuitButton onCircuitDecoded={handleCircuitImport} />
          <Heading size="md" mb={4} color={headingColor}>Quantum Circuit</Heading>
          <Box borderWidth={1} borderColor={canvasBorder} borderRadius="md" overflowX="auto" overflowY="auto" className="circuit-grid-container" h="100%">
            <VStack spacing={0} align="stretch">{renderGrid}</VStack>
          </Box>
        </Box>
      </ResizablePanel>

      <Divider borderColor={canvasBorder} />

      {/* Circuit Visualization */}
      <ResizablePanel direction="vertical" defaultSize={visualizationHeight} minSize={200} maxSize={600} onResize={setVisualizationHeight}>
        <Box p={4}>
          <Heading size="md" mb={4} color={headingColor}>Circuit Visualization</Heading>
          <Box ref={svgContainerRef} borderWidth={1} borderColor={canvasBorder} borderRadius="md" p={4} overflowX="auto" overflowY="auto" className="circuit-svg-container" h="100%"/>
        </Box>
      </ResizablePanel>
    </Box>
  );
};

export default CircuitCanvas;
