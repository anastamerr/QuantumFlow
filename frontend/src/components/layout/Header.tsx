import { Box, Flex, Heading, IconButton, Spacer, useColorMode, Button, HStack } from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { setActivePanel, selectActivePanel, toggleTutorial } from '../../store/slices/uiSlice'
import { clearCircuit, selectCircuitName } from '../../store/slices/circuitSlice'
// ⬇️ NEW: Import debug action and selector ⬇️
import { toggleSnapshots, selectShowSnap } from '../../store/slices/debugSlice' 

const Header = () => {
  const dispatch = useDispatch()
  const activePanel = useSelector(selectActivePanel)
  const circuitName = useSelector(selectCircuitName)
  const { colorMode, toggleColorMode } = useColorMode()
  // ⬇️ NEW: Select the state for the snapshots toggle ⬇️
  const showSnap = useSelector(selectShowSnap) 

  const handlePanelChange = (panel: 'circuit' | 'code' | 'simulation' | 'export' | 'algorithms') => {
    dispatch(setActivePanel(panel))
  }

  const handleClearCircuit = () => {
    if (confirm('Are you sure you want to clear the current circuit?')) {
      dispatch(clearCircuit())
    }
  }

  const handleToggleTutorial = () => {
    dispatch(toggleTutorial())
  }
  
  // ⬇️ NEW: Handler function to toggle the snapshot feature ⬇️
  const handleToggleSnapshots = () => {
    dispatch(toggleSnapshots())
  }

  return (
    <Box as="header" bg="quantum.primary" color="white" p={3} boxShadow="md">
      <Flex align="center">
        <Heading size="md" fontWeight="bold">QuantumFlow</Heading>
        <Box ml={2} fontSize="sm" opacity={0.8}>
          {circuitName}
        </Box>
        <Spacer />
        
        <HStack spacing={2}>
          <Button
            size="sm"
            variant={activePanel === 'circuit' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('circuit')}
            colorScheme="blue"
          >
            Circuit
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'code' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('code')}
            colorScheme="blue"
          >
            Code
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'simulation' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('simulation')}
            colorScheme="blue"
          >
            Simulation
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'export' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('export')}
            colorScheme="blue"
          >
            Export
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'algorithms' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('algorithms')}
            colorScheme="purple"
          >
            Algorithms
          </Button>
          
          {/* ⬇️ NEW TOGGLE BUTTON FOR SHOW STATE AFTER EACH GATE ⬇️ */}
          <Button
            size="sm"
            variant={showSnap ? 'solid' : 'outline'} // 'solid' when ON, 'outline' when OFF
            onClick={handleToggleSnapshots}
            colorScheme="yellow" // Using yellow for visibility as a debug/development tool
          >
            {showSnap ? 'Snapshots ON' : 'Snapshots OFF'}
          </Button>
          {/* ⬆️ END OF NEW TOGGLE BUTTON ⬆️ */}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearCircuit}
            colorScheme="red"
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleTutorial}
            colorScheme="teal"
          >
            Tutorial
          </Button>
          <IconButton
            aria-label="Toggle color mode"
            // icon={colorMode === 'light' ? '🌙' : '☀️'}
            size="sm"
            onClick={toggleColorMode}
            variant="ghost"
          />
        </HStack>
      </Flex>
    </Box>
  )
}

export default Header