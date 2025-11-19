import { Box, useColorModeValue } from '@chakra-ui/react'
import { useDrop } from 'react-dnd'
import { Gate, CircuitPosition, DroppedGate } from '../../types/circuit'
import CircuitGate from './CircuitGate'

interface GridCellProps {
  qubit: number
  position: number
  gates: Gate[]
  selectedGateId: string | null
  gridBorderColor: string
  gridBg: string
  onDrop: (item: DroppedGate, position: CircuitPosition) => void
  onGateClick: (gateId: string) => void
  onGateRemove: (gateId: string) => void
  isCurrentStep?: boolean
  width?: string
  height?: string
}

const GridCell: React.FC<GridCellProps> = ({
  qubit,
  position,
  gates,
  selectedGateId,
  gridBorderColor,
  gridBg,
  onDrop,
  onGateClick,
  onGateRemove,
  isCurrentStep = false,
  width = "60px",
  height = "60px"
}) => {
  const hoverBg = useColorModeValue('blue.50', 'blue.900')
  const dropIndicatorBg = useColorModeValue('blue.100', 'blue.800')
  
  const gatesAtPosition = gates.filter(
    gate => gate.qubit === qubit && gate.position === position
  )
  
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'gate',
    canDrop: () => gatesAtPosition.length === 0,
    drop: (item: DroppedGate) => onDrop(item, { qubit, position }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [qubit, position, onDrop, gatesAtPosition])
  
  const cellBg = isOver && canDrop ? dropIndicatorBg : gridBg
  
  return (
    <Box
      ref={drop}
      w={width}
      h={height}
      borderWidth={1}
      borderColor={gridBorderColor}
      bg={cellBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      transition="all 0.2s"
      _hover={{ bg: gatesAtPosition.length === 0 ? hoverBg : cellBg }}
      data-testid={`grid-cell-${qubit}-${position}`}
    >
      {/* 1. Render the Gate first (It will be at z-index 1 by default or lower)
      */}
      <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
        {gatesAtPosition.map(gate => (
          <CircuitGate
            key={gate.id}
            gate={gate}
            isSelected={gate.id === selectedGateId}
            onClick={() => onGateClick(gate.id)}
            onRemove={() => onGateRemove(gate.id)}
            size={parseInt(width, 10)}
          />
        ))}
      </Box>

      {/* 2. Render the Green Overlay ON TOP 
        - zIndex="10" ensures it covers the gate
        - opacity="0.4" allows you to see the gate through the color
        - pointerEvents="none" ensures you can still click the gate underneath!
      */}
      {isCurrentStep && (
        <Box 
          position="absolute" 
          top={0} 
          left={0} 
          right={0} 
          bottom={0} 
          bg="green.400" 
          opacity={0.4} 
          zIndex={10} 
          pointerEvents="none"
          border="2px solid"
          borderColor="green.600"
          boxShadow="0 0 8px rgba(72, 187, 120, 0.6)" // Optional: nice glow effect
        />
      )}
    </Box>
  )
}

export default GridCell