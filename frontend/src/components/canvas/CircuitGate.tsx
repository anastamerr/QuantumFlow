import { Box, IconButton, Text, Tooltip, useColorModeValue } from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons'
import { Gate } from '../../types/circuit'
import { gateLibrary } from '../../utils/gateLibrary'

const formatParam = (value: number): string => {
  if (!Number.isFinite(value)) return ''

  const PI = Math.PI
  const HALF_PI = Math.PI / 2
  const EPSILON = 1e-3
  const isClose = (target: number) => Math.abs(value - target) < EPSILON

  if (isClose(0)) return '0'
  if (isClose(PI)) return 'π'
  if (isClose(-PI)) return '-π'
  if (isClose(HALF_PI)) return 'π/2'
  if (isClose(-HALF_PI)) return '-π/2'

  return value.toFixed(4)
}

/**
 * CircuitGate component represents a quantum gate in the circuit
 */
interface CircuitGateProps {
  gate: Gate
  isSelected: boolean
  onClick: () => void
  onRemove: () => void
  size?: number
}

const CircuitGate: React.FC<CircuitGateProps> = ({ 
  gate, 
  isSelected, 
  onClick, 
  onRemove,
  size = 60 // Default size if not provided
}) => {
  // Find the gate definition from the library
  const gateDefinition = gateLibrary.find(g => g.id === gate.type)
  
  if (!gateDefinition) return null
  
  // Theme colors
  const bg = useColorModeValue(`${gateDefinition.color}.500`, `${gateDefinition.color}.600`)
  const hoverBg = useColorModeValue(`${gateDefinition.color}.600`, `${gateDefinition.color}.700`)
  const selectedBorderColor = useColorModeValue('blue.500', 'blue.300')
  const textColor = 'white'
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.4)')
  
  const formattedParam = (() => {
    if (!gate.params || Object.keys(gate.params).length === 0) return ''
    const rawValue = Object.values(gate.params)[0]
    const numericValue =
      typeof rawValue === 'number' ? rawValue : typeof rawValue === 'string' ? parseFloat(rawValue) : NaN

    if (Number.isFinite(numericValue)) {
      return formatParam(numericValue)
    }

    return rawValue?.toString() ?? ''
  })()

  return (
    <Tooltip 
      label={gateDefinition.description} 
      placement="top" 
      hasArrow
      openDelay={500}
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={bg}
        color={textColor}
        borderWidth={isSelected ? 3 : 1}
        borderColor={isSelected ? selectedBorderColor : 'transparent'}
        borderRadius="md"
        boxShadow={isSelected ? `0 0 0 2px ${selectedBorderColor}, 0 4px 6px ${shadowColor}` : `0 2px 4px ${shadowColor}`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        onClick={onClick}
        zIndex={isSelected ? 2 : 1}
        transition="all 0.2s"
        _hover={{
          bg: hoverBg,
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 8px ${shadowColor}`
        }}
        data-testid={`circuit-gate-${gate.id}`}
      >
        <Text fontWeight="bold" fontSize="sm">
          {gateDefinition.symbol}
        </Text>
        
        {/* Parameter display if applicable */}
        {formattedParam && (
          <Text 
            position="absolute" 
            bottom="-18px" 
            fontSize="xs" 
            color="gray.500"
            bg="white"
            px={1}
            borderRadius="sm"
            zIndex={3}
          >
            {formattedParam}
          </Text>
        )}
        
        {/* Remove button */}
        {isSelected && (
          <IconButton
            aria-label="Remove gate"
            icon={<CloseIcon />}
            size="xs"
            position="absolute"
            top="-8px"
            right="-8px"
            colorScheme="red"
            borderRadius="full"
            boxShadow="md"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            _hover={{
              transform: 'scale(1.1)'
            }}
          />
        )}
      </Box>
    </Tooltip>
  )
}

export default CircuitGate