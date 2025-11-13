import { Box, useColorModeValue } from '@chakra-ui/react'
import { useDrop } from 'react-dnd'
import { Gate, CircuitPosition, DroppedGate } from '../../types/circuit'
import CircuitGate from './CircuitGate'

/**
 * GridCell component represents a single cell in the quantum circuit grid
 * It handles drag and drop functionality for gates
 */
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
  width = "60px",
  height = "60px"
}) => {
  // Theme colors
  const hoverBg = useColorModeValue('blue.50', 'blue.900')
  const dropIndicatorBg = useColorModeValue('blue.100', 'blue.800')
 
  // Find gates at this position
  const gatesAtPosition = gates.filter(
    gate => gate.qubit === qubit && gate.position === position
  )
 
  // Create a drop target for this cell
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'gate',
    drop: (item: DroppedGate) => onDrop(item, { qubit, position }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [qubit, position, onDrop]) // Add dependencies to fix React hooks rule violation
 
  // Determine background color based on drop state
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
  )
}

export default GridCell