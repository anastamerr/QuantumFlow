import { Box, VStack, Heading, Divider, Text, useColorModeValue, InputGroup, Input, InputLeftElement, Icon, Flex, IconButton, Tooltip, usePrefersReducedMotion } from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { addQubit, removeQubit, selectQubits } from '../../store/slices/circuitSlice'
import GateItem from '../gates/GateItem'
import MeasurementGate from '../gates/MeasurementGate'
import { gateLibrary } from '../../utils/gateLibrary'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons'
import { useState, useEffect, useMemo } from 'react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const dispatch = useDispatch()
  const qubits = useSelector(selectQubits)
  const bg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const searchBg = useColorModeValue('white', 'gray.800')
  const searchBorder = useColorModeValue('gray.300', 'gray.600')
  const searchTipBg = useColorModeValue('blue.50', 'blue.900')
  const searchTipColor = useColorModeValue('blue.700', 'blue.300')
  const toggleHoverBg = useColorModeValue('gray.100', 'gray.600')
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(gateLibrary)

  const handleAddQubit = () => {
    dispatch(addQubit())
  }

  const handleRemoveQubit = () => {
    if (qubits.length > 0) {
      // Remove the last qubit (highest ID)
      const lastQubitId = Math.max(...qubits.map(q => q.id))
      dispatch(removeQubit(lastQubitId))
    }
  }

  // Filter gates based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If search is empty, show all gates
      setSearchResults(gateLibrary)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = gateLibrary.filter(gate => 
        gate.name.toLowerCase().includes(query) || 
        gate.description.toLowerCase().includes(query) ||
        gate.category.toLowerCase().includes(query) ||
        gate.symbol.toLowerCase().includes(query)
      )
      setSearchResults(filtered)
    }
  }, [searchQuery])

  // Group gates by category
  const gatesByCategory = useMemo(() => {
    const grouped: Record<string, typeof gateLibrary> = {}
    searchResults.forEach(gate => {
      if (!grouped[gate.category]) {
        grouped[gate.category] = []
      }
      grouped[gate.category].push(gate)
    })
    return grouped
  }, [searchResults])

  return (
    <Box
      w="100%"
      h="100%"
      bg={bg}
      p={isCollapsed ? 2 : 4}
      borderRightWidth={1}
      borderColor={borderColor}
      overflowY={isCollapsed ? 'hidden' : 'auto'}
      overflowX="hidden"
      transition={prefersReducedMotion ? undefined : 'padding 160ms ease'}
    >
      <Flex align="center" justify={isCollapsed ? 'center' : 'space-between'} mb={isCollapsed ? 0 : 3}>
        {!isCollapsed && <Heading size="md">Gate Palette</Heading>}
        <Tooltip label={isCollapsed ? 'Expand gate palette' : 'Collapse gate palette'} placement="right">
          <IconButton
            aria-label={isCollapsed ? 'Expand gate palette' : 'Collapse gate palette'}
            icon={isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            size="sm"
            variant="ghost"
            onClick={onToggle}
            _hover={{ bg: toggleHoverBg }}
            aria-expanded={!isCollapsed}
          />
        </Tooltip>
      </Flex>

      <Box
        opacity={isCollapsed ? 0 : 1}
        transform={isCollapsed ? 'translateX(-8px)' : 'translateX(0)'}
        pointerEvents={isCollapsed ? 'none' : 'auto'}
        transition={prefersReducedMotion ? undefined : 'opacity 140ms ease, transform 180ms ease'}
        css={{ willChange: 'opacity, transform' }}
      >
        <VStack spacing={4} align="stretch">
          {/* Search Bar */}
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search gates..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
              bg={searchBg}
              borderColor={searchBorder}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
            />
          </InputGroup>
          
          {searchResults.length === 0 && searchQuery !== '' && (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
              No gates found matching "{searchQuery}"
            </Text>
          )}

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

          {/* Gate Categories with Filter Applied */}
          {Object.entries(gatesByCategory).map(([category, gates]) => (
            <Box key={category}>
              <Heading size="sm" mb={2}>{category}</Heading>
              <VStack spacing={2} align="stretch">
                {gates.map(gate => (
                  gate.id === 'measure' ? (
                    <MeasurementGate key={gate.id} gate={gate} />
                  ) : (
                    <GateItem key={gate.id} gate={gate} />
                  )
                ))}
              </VStack>
            </Box>
          ))}
          
          {/* Show search tips if actively searching */}
          {searchQuery.trim() !== '' && (
            <Box mt={2} p={3} bg={searchTipBg} borderRadius="md">
              <Text fontSize="xs" color={searchTipColor}>
                Search by name, symbol, or description. Clear the search to see all gates.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  )
}

export default Sidebar
