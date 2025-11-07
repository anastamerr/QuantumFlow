 import { Box, Text, Tooltip, useColorModeValue } from '@chakra-ui/react'
import { useDrag } from 'react-dnd'
import { Gate } from '../../types/circuit'

interface GateItemProps {
  gate: {
    id: string
    name: string
    symbol: string
    description: string
    category: string
    color: string
    params?: {
      name: string
      type: 'number' | 'angle' | 'select'
      default: number | string
      options?: string[]
      min?: number
      max?: number
      step?: number
    }[]
    targets?: number
    controls?: number
  }
}

const GateItem = ({ gate }: GateItemProps) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue(`${gate.color}.50`, `${gate.color}.900`)
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'gate',
    item: { gateType: gate.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <Tooltip label={gate.description} placement="right">
      <Box
        ref={drag}
        p={2}
        borderWidth={1}
        borderRadius="md"
        borderColor={borderColor}
        bg={bg}
        opacity={isDragging ? 0.5 : 1}
        cursor="grab"
        _hover={{ bg: hoverBg }}
        className="gate"
        display="flex"
        alignItems="center"
      >
        <Box
          w="30px"
          h="30px"
          borderRadius="md"
          bg={`${gate.color}.500`}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="bold"
          mr={2}
        >
          {gate.symbol}
        </Box>
        <Text fontSize="sm">{gate.name}</Text>
      </Box>
    </Tooltip>
  )
}

export default GateItem