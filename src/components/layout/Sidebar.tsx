import { Box, VStack, Heading, Divider, Text, useColorModeValue } from '@chakra-ui/react'
import { useDispatch } from 'react-redux'
import { addQubit, removeQubit } from '../../store/slices/circuitSlice'
import GateItem from '../gates/GateItem'
import { gateLibrary } from '../../utils/gateLibrary'

const Sidebar = () => {
  const dispatch = useDispatch()
  const bg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleAddQubit = () => {
    dispatch(addQubit())
  }

  const handleRemoveQubit = () => {
    dispatch(removeQubit(0))
  }

  // Group gates by category
  const gatesByCategory: Record<string, typeof gateLibrary> = {}
  gateLibrary.forEach(gate => {
    if (!gatesByCategory[gate.category]) {
      gatesByCategory[gate.category] = []
    }
    gatesByCategory[gate.category].push(gate)
  })

  return (
    <Box
      w="250px"
      h="100%"
      bg={bg}
      p={4}
      borderRightWidth={1}
      borderColor={borderColor}
      overflowY="auto"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="md">Gate Palette</Heading>
        <Text fontSize="sm" color="gray.500">
          Drag gates onto the circuit canvas
        </Text>

        <Box>
          <Heading size="sm" mb={2}>Circuit Controls</Heading>
          <VStack spacing={2} align="stretch">
            <Box 
              p={2} 
              borderWidth={1} 
              borderRadius="md" 
              cursor="pointer"
              _hover={{ bg: 'blue.50' }}
              onClick={handleAddQubit}
            >
              Add Qubit
            </Box>
            <Box 
              p={2} 
              borderWidth={1} 
              borderRadius="md" 
              cursor="pointer"
              _hover={{ bg: 'red.50' }}
              onClick={handleRemoveQubit}
            >
              Remove Last Qubit
            </Box>
          </VStack>
        </Box>

        <Divider />

        {Object.entries(gatesByCategory).map(([category, gates]) => (
          <Box key={category}>
            <Heading size="sm" mb={2}>{category}</Heading>
            <VStack spacing={2} align="stretch">
              {gates.map(gate => (
                <GateItem key={gate.id} gate={gate} />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}

export default Sidebar