import { Box, Text, VStack, HStack, Heading, Divider, useColorModeValue, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Flex, IconButton, Tooltip } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { selectQubits, selectGates, selectMaxPosition, addGate, removeGate, Gate as SliceGate } from '../../store/slices/circuitSlice'
import { selectSelectedGateId, selectGate, selectZoomLevel, setZoomLevel } from '../../store/slices/uiSlice'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { CircuitPosition, DroppedGate, Gate as CircuitGate } from '../../types/circuit'
import { gateLibrary } from '../../utils/gateLibrary'
import { renderCircuitSvg } from '../../utils/circuitRenderer'
import GridCell from './GridCell'
import ResizablePanel from '../layout/ResizablePanel'
import { AddIcon, MinusIcon } from '@chakra-ui/icons'

/**
 * CircuitCanvas component displays the quantum circuit grid and visualization
 */
const CircuitCanvas: React.FC = () => {
  // Redux state and dispatch
  const dispatch = useDispatch()
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const maxPosition = useSelector(selectMaxPosition)
  const selectedGateId = useSelector(selectSelectedGateId)
  const zoomLevel = useSelector(selectZoomLevel)
  
  // Local state
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState('')
  const [gridHeight, setGridHeight] = useState(300)
  const [visualizationHeight, setVisualizationHeight] = useState(300)
  const [cellSize, setCellSize] = useState(60) // Default cell size
  
  // Theme colors
  const gridBg = useColorModeValue('gray.50', 'gray.700')
  const gridBorderColor = useColorModeValue('gray.200', 'gray.600')
  const qubitLabelBg = useColorModeValue('blue.50', 'blue.900')
  const qubitLabelColor = useColorModeValue('blue.800', 'blue.100')
  const canvasBg = useColorModeValue('white', 'gray.800')
  const canvasBorder = useColorModeValue('gray.200', 'gray.600')
  const headingColor = useColorModeValue('gray.700', 'gray.200')
  const controlsBg = useColorModeValue('gray.100', 'gray.700')
  
  // Convert SliceGate[] to CircuitGate[] for GridCell compatibility
  const circuitGates = useMemo(() => {
    return gates.map(gate => {
      // Find the gate definition for additional properties
      const gateDefinition = gateLibrary.find(g => g.id === gate.type);
      
      // Return a compatible gate object
      return {
        ...gate,
        name: gateDefinition?.name || gate.type,
        symbol: gateDefinition?.symbol || gate.type,
        description: gateDefinition?.description || '',
        category: gateDefinition?.category || 'unknown',
        color: gateDefinition?.color || '#888888'
      } as CircuitGate;
    });
  }, [gates]);
  
  // Update SVG representation when circuit changes
  useEffect(() => {
    const svg = renderCircuitSvg(qubits, gates)
    setSvgContent(svg)
    
    // Apply SVG to the container
    if (svgContainerRef.current) {
      svgContainerRef.current.innerHTML = svg
    }
  }, [qubits, gates])
  
  // Handle zoom level changes
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 0.1, 2.0)
    dispatch(setZoomLevel(newZoom))
    setCellSize(60 * newZoom) // Adjust cell size based on zoom
  }, [zoomLevel, dispatch])
  
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.5)
    dispatch(setZoomLevel(newZoom))
    setCellSize(60 * newZoom) // Adjust cell size based on zoom
  }, [zoomLevel, dispatch])
  
  const handleZoomChange = useCallback((value: number) => {
    dispatch(setZoomLevel(value))
    setCellSize(60 * value) // Adjust cell size based on zoom
  }, [dispatch])
  
  /**
   * Handle dropping a gate onto the circuit
   */
  const handleDrop = useCallback((item: DroppedGate, position: CircuitPosition): void => {
    const gateDefinition = gateLibrary.find(g => g.id === item.gateType)
    
    if (!gateDefinition) return
    
    // Create a new gate instance with required properties
    // Explicitly ensure qubit is a number to match the Redux slice Gate type
    const newGate = {
      type: gateDefinition.id,
      qubit: position.qubit as number,  // Ensure this is a number
      position: position.position as number, // Ensure this is a number
      params: {},
    }
    
    // Add the gate to the circuit
    dispatch(addGate(newGate))
  }, [dispatch])
  
  // Create a drop handler for GridCell to use
  // This fixes the React hooks rule violation by moving the useDrop hook out of the render loop
  const createDropHandler = useCallback((qubit: number, position: number) => {
    return (item: DroppedGate) => handleDrop(item, { qubit, position })
  }, [handleDrop])
  
  /**
   * Handle clicking on a gate in the circuit
   */
  const handleGateClick = useCallback((gateId: string): void => {
    dispatch(selectGate(gateId))
  }, [dispatch])
  
  /**
   * Handle removing a gate from the circuit
   */
  const handleGateRemove = useCallback((gateId: string): void => {
    dispatch(removeGate(gateId))
  }, [dispatch])
  
  /**
   * Create the grid cells for the circuit
   */
  const renderGrid = useMemo(() => {
    const grid = []
    
    // For each qubit, create a row
    for (let qubit = 0; qubit < qubits.length; qubit++) {
      const cells = []
      
      // For each position, create a cell
      for (let position = 0; position < maxPosition; position++) {
        cells.push(
          <GridCell
            key={`cell-${qubit}-${position}`}
            qubit={qubit}
            position={position}
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
        )
      }
      
      // Add the row to the grid
      grid.push(
        <HStack key={`row-${qubit}`} spacing={0} align="center">
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
            {qubits[qubit].name}
          </Box>
          {cells}
        </HStack>
      )
    }
    
    return grid
  }, [
    qubits, 
    maxPosition, 
    circuitGates, 
    selectedGateId, 
    gridBorderColor, 
    gridBg, 
    qubitLabelBg, 
    qubitLabelColor,
    handleDrop,
    handleGateClick,
    handleGateRemove,
    cellSize
  ])
  
  // If no qubits, show a message
  if (qubits.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="md" color={headingColor}>No qubits in circuit</Heading>
        <Text mt={2}>Add qubits from the sidebar to start building your circuit</Text>
      </Box>
    )
  }
  
  return (
    <Box bg={canvasBg} borderRadius="md" boxShadow="sm">
      {/* Zoom Controls */}
      <Flex p={2} bg={controlsBg} borderRadius="md" mb={2} alignItems="center">
        <Text fontSize="sm" mr={2}>Zoom:</Text>
        <Tooltip label="Zoom Out">
          <IconButton
            aria-label="Zoom out"
            icon={<MinusIcon />}
            size="sm"
            onClick={handleZoomOut}
            mr={2}
          />
        </Tooltip>
        
        <Slider
          value={zoomLevel}
          min={0.5}
          max={2}
          step={0.1}
          onChange={handleZoomChange}
          w="150px"
          colorScheme="blue"
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        
        <Tooltip label="Zoom In">
          <IconButton
            aria-label="Zoom in"
            icon={<AddIcon />}
            size="sm"
            onClick={handleZoomIn}
            ml={2}
          />
        </Tooltip>
        
        <Text fontSize="sm" ml={2}>{Math.round(zoomLevel * 100)}%</Text>
      </Flex>
      
      {/* Circuit Grid */}
      <ResizablePanel 
        direction="vertical" 
        defaultSize={gridHeight}
        minSize={200}
        maxSize={600}
        onResize={setGridHeight}
        mb={4}
        overflow="auto" // Enable vertical scrolling
      >
        <Box p={4}>
          <Heading size="md" mb={4} color={headingColor}>Quantum Circuit</Heading>
          <Box 
            borderWidth={1} 
            borderColor={canvasBorder} 
            borderRadius="md" 
            overflowX="auto"
            overflowY="auto" // Enable vertical scrolling
            className="circuit-grid-container"
            h="100%"
          >
            <VStack spacing={0} align="stretch">
              {renderGrid}
            </VStack>
          </Box>
        </Box>
      </ResizablePanel>
      
      <Divider borderColor={canvasBorder} />
      
      {/* Circuit Visualization */}
      <ResizablePanel 
        direction="vertical" 
        defaultSize={visualizationHeight}
        minSize={200}
        maxSize={600}
        onResize={setVisualizationHeight}
        overflow="auto" // Enable vertical scrolling
      >
        <Box p={4}>
          <Heading size="md" mb={4} color={headingColor}>Circuit Visualization</Heading>
          <Box 
            ref={svgContainerRef}
            borderWidth={1} 
            borderColor={canvasBorder} 
            borderRadius="md" 
            p={4}
            overflowX="auto"
            overflowY="auto" // Enable vertical scrolling
            className="circuit-svg-container"
            h="100%"
          />
        </Box>
      </ResizablePanel>
    </Box>
  )
}

export default CircuitCanvas