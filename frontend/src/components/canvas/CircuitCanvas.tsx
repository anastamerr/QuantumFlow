import {
  Box, Text, VStack, HStack, Heading, Divider,
  useColorModeValue, Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, Flex, IconButton, Tooltip, useToast
} from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectQubits, selectGates, selectMaxPosition, addGate, removeGate, Gate,
  addGates, importCircuit
} from '../../store/slices/circuitSlice'
import {
  selectSelectedGateId, selectGate, selectZoomLevel, setZoomLevel
} from '../../store/slices/uiSlice'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { CircuitPosition, DroppedGate, Gate as CircuitGate } from '../../types/circuit'
import { gateLibrary } from '../../utils/gateLibrary'
import { renderCircuitSvg } from '../../utils/circuitRenderer'
import GridCell from './GridCell'
import ResizablePanel from '../layout/ResizablePanel'
import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import ImportCircuitButton from '../ui-helpers/importButton'
import { DecodedCircuit } from '../generator/decoders/decoders'

const CircuitCanvas: React.FC = () => {
  const dispatch = useDispatch()
  const toast = useToast()

  // Redux state
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const maxPosition = useSelector(selectMaxPosition)
  const selectedGateId = useSelector(selectSelectedGateId)
  const zoomLevel = useSelector(selectZoomLevel)

  // Local state
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [gridHeight, setGridHeight] = useState(300)
  const [visualizationHeight, setVisualizationHeight] = useState(300)
  const [cellSize, setCellSize] = useState(60)

  // Theme
  const gridBg = useColorModeValue('gray.50', 'gray.700')
  const gridBorderColor = useColorModeValue('gray.200', 'gray.600')
  const qubitLabelBg = useColorModeValue('blue.50', 'blue.900')
  const qubitLabelColor = useColorModeValue('blue.800', 'blue.100')
  const canvasBg = useColorModeValue('white', 'gray.800')
  const canvasBorder = useColorModeValue('gray.200', 'gray.600')
  const headingColor = useColorModeValue('gray.700', 'gray.200')
  const controlsBg = useColorModeValue('gray.100', 'gray.700')

  // Map Redux gates to CircuitGate objects for GridCell rendering
  const circuitGates = useMemo(() => gates.map(gate => {
    const def = gateLibrary.find(d => d.id === gate.type)
    if (!def) return {
      ...gate,
      name: gate.type,
      symbol: gate.type.substring(0, 2).toUpperCase(),
      description: 'Unknown gate type',
      category: 'unknown',
      color: 'gray'
    } as CircuitGate
    return {
      ...gate,
      name: def.name,
      symbol: def.symbol,
      description: def.description ?? '',
      category: def.category ?? 'unknown',
      color: def.color ?? 'gray'
    } as CircuitGate
  }), [gates])

  // Render SVG visualization
  useEffect(() => {
    if (!qubits.length) return

    const timer = setTimeout(() => {
      try {
        const svg = renderCircuitSvg(qubits, circuitGates)
        if (svgContainerRef.current) svgContainerRef.current.innerHTML = svg
      } catch (err) {
        console.error('SVG render error', err)
        toast({
          title: 'Visualization Error',
          description: 'Could not render the circuit visualization.',
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [qubits, circuitGates, toast])

  // Zoom handlers
  const handleZoomChange = useCallback((value: number) => {
    dispatch(setZoomLevel(value))
    setCellSize(60 * value)
  }, [dispatch])

  const handleZoomIn = useCallback(() => handleZoomChange(Math.min(zoomLevel + 0.1, 2)), [handleZoomChange, zoomLevel])
  const handleZoomOut = useCallback(() => handleZoomChange(Math.max(zoomLevel - 0.1, 0.5)), [handleZoomChange, zoomLevel])

  // Drop gate handler
  const handleDrop = useCallback((item: DroppedGate, position: CircuitPosition) => {
    const gateDef = gateLibrary.find(g => g.id === item.gateType)
    if (!gateDef) return console.warn(`Gate type "${item.gateType}" not found`)

    if ((gateDef.targets || 0) + (gateDef.controls || 0) > 1 && qubits.length < 2) {
      toast({
        title: 'Not enough qubits',
        description: 'Add more qubits to use multi-qubit gates.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    const newGate: Omit<Gate, 'id'> = {
      type: gateDef.id,
      qubit: position.qubit,
      position: position.position,
      params: gateDef.params?.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {}) ?? {}
    }

    if (gateDef.targets && gateDef.targets > 0) {
      const targets = qubits.map(q => q.id).filter(id => id !== position.qubit)
      if (qubits.length === 2) newGate.targets = [position.qubit === 0 ? 1 : 0]
      else if (targets.length >= gateDef.targets) newGate.targets = targets.slice(0, gateDef.targets)
      else {
        toast({
          title: 'No available target qubits',
          description: `This gate requires ${gateDef.targets} target(s).`,
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
        return
      }
    }

    if (gateDef.controls && gateDef.controls > 0 && gateDef.id !== 'cnot' && gateDef.id !== 'cz') {
      const availableControls = qubits.map(q => q.id)
        .filter(id => id !== position.qubit && !(newGate.targets ?? []).includes(id))
      if (availableControls.length >= gateDef.controls) newGate.controls = availableControls.slice(0, gateDef.controls)
      else {
        toast({
          title: 'Not enough qubits for controls',
          description: `This gate requires ${gateDef.controls} control(s).`,
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
        return
      }
    }

    dispatch(addGate(newGate))
  }, [dispatch, qubits, toast])

  // Import circuit handler
  const handleCircuitImport = useCallback((decoded: DecodedCircuit) => {
  try {
    if (!decoded.qubits?.length) {
      toast({
        title: 'Import Failed',
        description: 'Circuit must have at least one qubit.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Normalize gates for slice
    // Normalize gates for slice
    const gatesForSlice: Gate[] = decoded.gates.map((gate, index) => {
      let controls = gate.controls ?? []
      let targets = gate.targets ?? []

      // Ensure control and target are not the same
      targets = targets.filter(t => !controls.includes(t))

      return {
        ...gate,
        id: gate.id ?? `gate-${Math.random().toString(36).substring(2, 8)}`,
        type: gate.type.toLowerCase(),
        qubit: controls[0] ?? targets[0] ?? 0,  // main qubit = first control
        controls,
        targets,
        position: gate.position ?? index,        // <-- important: set position
        params: gate.params ?? {},
      }
    })





    // Determine maxPosition safely
    const maxPosition = gatesForSlice.length
      ? Math.max(...gatesForSlice.map(g => g.position ?? 0)) + 5
      : 10;

    // Dispatch import
    dispatch(importCircuit({
      qubits: decoded.qubits,
      gates: gatesForSlice,
      maxPosition,
      name: decoded.name ?? 'Imported Circuit',
      description: decoded.description ?? ''
    }));

    toast({
      title: 'Circuit Imported',
      description: 'The quantum circuit has been successfully loaded.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  } catch (err: any) {
    console.error('Error importing circuit:', err);
    toast({
      title: 'Import Failed',
      description: err.message || 'Could not import the circuit.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }
}, [dispatch, toast]);



  // Gate click/remove handlers
  const handleGateClick = useCallback((id: string) => dispatch(selectGate(id)), [dispatch])
  const handleGateRemove = useCallback((id: string) => dispatch(removeGate(id)), [dispatch])

  // Render grid
  const renderGrid = useMemo(() => {
    if (!qubits.length) return null
    return qubits.map((q, qubitIndex) => (
      <HStack key={q.id} spacing={0} align="center">
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
          {q.name}
        </Box>
        {Array.from({ length: maxPosition }).map((_, pos) => (
          <GridCell
            key={`cell-${qubitIndex}-${pos}`}
            qubit={qubitIndex}
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
        ))}
      </HStack>
    ))
  }, [qubits, maxPosition, circuitGates, selectedGateId, gridBorderColor, gridBg, qubitLabelBg, qubitLabelColor, handleDrop, handleGateClick, handleGateRemove, cellSize])

  if (!qubits.length) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="md" color={headingColor}>No qubits in circuit</Heading>
        <Text mt={2}>Add qubits from the sidebar to start building your circuit</Text>
      </Box>
    )
  }

  return (
    <Box bg={canvasBg} borderRadius="md" boxShadow="sm">
      <Flex p={2} bg={controlsBg} borderRadius="md" mb={2} alignItems="center" justifyContent="space-between">
        <ImportCircuitButton onCircuitDecoded={handleCircuitImport} />
        <Flex alignItems="center">
          <Text fontSize="sm" mr={2}>Zoom:</Text>
          <Tooltip label="Zoom Out">
            <IconButton aria-label="Zoom out" icon={<MinusIcon />} size="sm" onClick={handleZoomOut} mr={2} />
          </Tooltip>
          <Slider value={zoomLevel} min={0.5} max={2} step={0.1} onChange={handleZoomChange} w="150px" colorScheme="blue">
            <SliderTrack><SliderFilledTrack /></SliderTrack>
            <SliderThumb />
          </Slider>
          <Tooltip label="Zoom In">
            <IconButton aria-label="Zoom in" icon={<AddIcon />} size="sm" onClick={handleZoomIn} ml={2} />
          </Tooltip>
          <Text fontSize="sm" ml={2}>{Math.round(zoomLevel * 100)}%</Text>
        </Flex>
      </Flex>

      <ResizablePanel direction="vertical" defaultSize={gridHeight} minSize={200} maxSize={600} onResize={setGridHeight} mb={4}>
        <Box p={4}>
          <Heading size="md" mb={4} color={headingColor}>Quantum Circuit</Heading>
          <Box borderWidth={1} borderColor={canvasBorder} borderRadius="md" overflowX="auto" overflowY="auto" className="circuit-grid-container" h="100%">
            <VStack spacing={0} align="stretch">{renderGrid}</VStack>
          </Box>
        </Box>
      </ResizablePanel>

      <Divider borderColor={canvasBorder} />

      <ResizablePanel direction="vertical" defaultSize={visualizationHeight} minSize={200} maxSize={600} onResize={setVisualizationHeight}>
        <Box p={4}>
          <Heading size="md" mb={4} color={headingColor}>Circuit Visualization</Heading>
          <Box ref={svgContainerRef} borderWidth={1} borderColor={canvasBorder} borderRadius="md" p={4} overflowX="auto" overflowY="auto" className="circuit-svg-container" h="100%" />
        </Box>
      </ResizablePanel>
    </Box>
  )
}

export default CircuitCanvas
