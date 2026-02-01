import { Box, HStack, Tag, Text, Tooltip, useColorModeValue } from '@chakra-ui/react'
import { useDrag } from 'react-dnd'

interface MeasurementGateProps {
  gate: {
    id: string
    name: string
    symbol: string
    description: string
    category: string
    color: string
  }
}

const MeasurementGate = ({ gate }: MeasurementGateProps) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue(`${gate.color}.50`, `${gate.color}.900`)
  const badgeBg = useColorModeValue('gray.100', 'gray.700')

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
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <HStack spacing={2}>
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
          >
            {gate.symbol}
          </Box>
          <Text fontSize="sm">{gate.name}</Text>
        </HStack>
        <Tag size="sm" bg={badgeBg}>
          Z
        </Tag>
      </Box>
    </Tooltip>
  )
}

export default MeasurementGate
