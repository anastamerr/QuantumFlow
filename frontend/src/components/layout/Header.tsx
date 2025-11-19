import { Box, Flex, Heading, IconButton, Spacer, useColorMode, Button, HStack } from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { setActivePanel, selectActivePanel, toggleTutorial } from '../../store/slices/uiSlice'
import type { UiState } from '../../store/slices/uiSlice'
import { clearCircuit, selectCircuitName } from '../../store/slices/circuitSlice'

const Header = () => {
  const dispatch = useDispatch()
  const activePanel = useSelector(selectActivePanel)
  const circuitName = useSelector(selectCircuitName)
  const { colorMode, toggleColorMode } = useColorMode()

  const handlePanelChange = (panel: UiState['activePanel']) => {
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

  // Helper for navigation button styles to keep them consistent
  const getNavBtnStyles = (panelName: string) => ({
    variant: activePanel === panelName ? 'solid' : 'ghost',
    bg: activePanel === panelName ? 'whiteAlpha.300' : 'transparent',
    _hover: { bg: 'whiteAlpha.200' },
    color: 'white',
    // Remove default colorScheme props to avoid color clashes
  })

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
            onClick={() => handlePanelChange('circuit')}
            {...getNavBtnStyles('circuit')}
          >
            Circuit
          </Button>
          <Button
            size="sm"
            onClick={() => handlePanelChange('code')}
            {...getNavBtnStyles('code')}
          >
            Code
          </Button>
          <Button
            size="sm"
            onClick={() => handlePanelChange('simulation')}
            {...getNavBtnStyles('simulation')}
          >
            Simulation
          </Button>
          <Button
            size="sm"
            onClick={() => handlePanelChange('export')}
            {...getNavBtnStyles('export')}
          >
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => handlePanelChange('algorithms')}
            {...getNavBtnStyles('algorithms')}
          >
            Algorithms
          </Button>
          
          {/* Divider or spacing could go here */}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearCircuit}
            color="red.300" // Light red text for visibility on dark bg
            _hover={{ bg: 'whiteAlpha.200', color: 'red.200' }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleTutorial}
            color="teal.200" // Light teal text
            _hover={{ bg: 'whiteAlpha.200', color: 'teal.100' }}
          >
            Tutorial
          </Button>
          
          <IconButton
            aria-label="Toggle color mode"
            // FIX: Uncommented and wrapped in span
            icon={<span>{colorMode === 'light' ? '🌙' : '☀️'}</span>}
            size="sm"
            onClick={toggleColorMode}
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
          />
        </HStack>
      </Flex>
    </Box>
  )
}

export default Header