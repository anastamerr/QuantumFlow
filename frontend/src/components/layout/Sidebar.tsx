import { Box, VStack, Heading, Divider, Text, useColorModeValue, InputGroup, Input, InputLeftElement, Icon, HStack, Button, useToast } from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { addQubit, removeQubit, selectQubits, selectGates, addGates } from '../../store/slices/circuitSlice'
import { setActivePanel, selectActivePanel } from '../../store/slices/uiSlice'
import type { UiState } from '../../store/slices/uiSlice'
import GateItem from '../gates/GateItem'
import { gateLibrary } from '../../utils/gateLibrary'
import { SearchIcon, RepeatIcon, ExternalLinkIcon, SettingsIcon, EditIcon, StarIcon } from '@chakra-ui/icons'
import { useState, useEffect, useMemo, type ComponentType } from 'react'
import type { IconProps } from '@chakra-ui/react'
import { optimizeCircuitApi } from '../../lib/quantumApi'

const BarChartIcon = (props: IconProps) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M5 21h2V11H5v10zm6 0h2V3h-2v18zm6 0h2v-7h-2v7z"
    />
  </Icon>
)

const Sidebar = () => {
  const dispatch = useDispatch()
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const activePanel = useSelector(selectActivePanel)
  const bg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const searchBg = useColorModeValue('white', 'gray.800')
  const searchBorder = useColorModeValue('gray.300', 'gray.600')
  const panelBg = useColorModeValue('white', 'gray.800')
  const panelHoverBg = useColorModeValue('blue.50', 'gray.700')
  const toast = useToast()
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(gateLibrary)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const ImageIcon = (props: IconProps) => (
    <Icon viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
      />
    </Icon>
  )

  const panelShortcuts: Array<{
    key: UiState['activePanel']
    label: string
    icon: ComponentType<IconProps>
  }> = [
    { key: 'code', label: 'Code', icon: EditIcon },
    { key: 'simulation', label: 'Simulation', icon: RepeatIcon },
    { key: 'mpl', label: 'MPL View', icon: ImageIcon },
    { key: 'export', label: 'Export', icon: ExternalLinkIcon },
    { key: 'algorithms', label: 'Algorithms', icon: SettingsIcon },
    { key: 'statistics', label: 'Statistics', icon: BarChartIcon },
  ]

  const handlePanelSelect = (panel: UiState['activePanel']) => {
    dispatch(setActivePanel(panel))
  }

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

  const handleOptimizeCircuit = async () => {
    if (gates.length === 0) {
      toast({
        status: 'info',
        title: 'No gates to optimize',
        description: 'Add some gates to the canvas before running the optimizer.',
      })
      return
    }

    setIsOptimizing(true)
    try {
      const response = await optimizeCircuitApi({
        num_qubits: qubits.length,
        gates: gates.map(({ id, ...gate }) => ({
          type: gate.type,
          qubit: gate.qubit,
          position: gate.position,
          params: gate.params,
          targets: gate.targets,
          controls: gate.controls,
        })),
      })

      if (response?.gates) {
        dispatch(
          addGates(
            response.gates.map((gate, index) => ({
              type: gate.type,
              qubit: gate.qubit ?? 0,
              position: typeof gate.position === 'number' ? gate.position : index,
              params: gate.params,
              targets: gate.targets,
              controls: gate.controls,
            })),
          ),
        )
        toast({
          status: 'success',
          title: 'Circuit optimized',
          description: 'Circuit optimized! Gate count reduced.',
        })
      }
    } catch (error) {
      toast({
        status: 'error',
        title: 'Optimization failed',
        description: error instanceof Error ? error.message : 'Unable to optimize the circuit.',
      })
    } finally {
      setIsOptimizing(false)
    }
  }

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

        <Box>
          <Heading size="sm" mb={2}>Panels</Heading>
          <VStack spacing={2} align="stretch">
            {panelShortcuts.map(({ key, label, icon: PanelIcon }) => (
              <Box
                key={key}
                p={2}
                borderWidth={1}
                borderRadius="md"
                cursor="pointer"
                bg={activePanel === key ? 'blue.500' : panelBg}
                color={activePanel === key ? 'white' : 'inherit'}
                _hover={{ bg: activePanel === key ? 'blue.600' : panelHoverBg }}
                onClick={() => handlePanelSelect(key)}
              >
                <HStack spacing={2}>
                  <PanelIcon boxSize={4} />
                  <Text fontSize="sm" fontWeight="medium">
                    {label}
                  </Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
        
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
            <Button
              leftIcon={<StarIcon />}
              colorScheme="purple"
              variant="solid"
              onClick={handleOptimizeCircuit}
              isLoading={isOptimizing}
              loadingText="Optimizing..."
            >
              Optimize Circuit
            </Button>
          </VStack>
        </Box>

        <Divider />

        {/* Gate Categories with Filter Applied */}
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
        
        {/* Show search tips if actively searching */}
        {searchQuery.trim() !== '' && (
          <Box mt={2} p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
            <Text fontSize="xs" color={useColorModeValue('blue.700', 'blue.300')}>
              Search by name, symbol, or description. Clear the search to see all gates.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default Sidebar