import { Box, Flex, Heading, IconButton, Spacer, useColorMode, Button, HStack, Badge } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useDispatch, useSelector } from 'react-redux'
import { setActivePanel, selectActivePanel, toggleTutorial } from '../../store/slices/uiSlice'
import { clearCircuit, selectCircuitName } from '../../store/slices/circuitSlice'

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,212,0, 0.85); }
  70% { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(255,212,0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,212,0, 0); }
`

const Header = () => {
  const dispatch = useDispatch()
  const activePanel = useSelector(selectActivePanel)
  const circuitName = useSelector(selectCircuitName)
  const { colorMode, toggleColorMode } = useColorMode()

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

  return (
    <Box as="header" bg="quantum.primary" color="white" p={3} boxShadow="md">
      <Flex align="center">
        <Heading size="md" fontWeight="bold">QuantumFlow</Heading>
        <Box ml={2} fontSize="sm" opacity={0.8}>
          {circuitName}
        </Box>
        <HStack ml={4} spacing={2}>
          <Button
            size="sm"
            variant={activePanel === 'projects' ? 'solid' : 'ghost'}
            colorScheme="blue"
            onClick={() => dispatch(setActivePanel('projects'))}
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#ff0000', color: 'white' }}
          >
            Projects
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch(setActivePanel('library'))}
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#33cc33', color: 'white' }}
          >
            Library
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'blochSphere' ? 'solid' : 'ghost'}
            colorScheme="cyan"
            onClick={() => dispatch(setActivePanel('blochSphere'))}
            position="relative"
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#ff751a', color: 'white' }}
          >
            <Box position="relative" display="inline-flex" alignItems="center" px={2}>
              Bloch Sphere
              <Box
                position="absolute"
                top={-3}
                right={-3}
                bg="#FFD400"
                color="black"
                borderRadius="full"
                px={2}
                py={0}
                fontWeight={700}
                fontSize="xs"
                boxShadow="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={2}
                animation={`${pulse} 1.6s ease-in-out infinite`}
              >
                <span style={{ marginRight: 6 }}>✨</span>NEW
              </Box>
            </Box>
          </Button>
        </HStack>
        <Spacer />
        
        <HStack spacing={2}>
          <Button
            size="sm"
            variant={activePanel === 'circuit' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('circuit')}
            colorScheme="blue"
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#009900', color: 'white' }}
          >
            Circuit
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'code' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('code')}
            colorScheme="blue"
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#009900', color: 'white' }}
          >
            Code
          </Button>
          <Button
            size="sm"
            variant={activePanel === 'simulation' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('simulation')}
            colorScheme="blue"
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#009900', color: 'white' }}
          >
            Simulation
          </Button>


          <Button
            size="sm"
            variant={activePanel === 'export' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('export')}
            colorScheme="blue"
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#999966', color: 'white' }}
          >
            Export
          </Button>

        
          <Button
            size="sm"
            variant={activePanel === 'ai' ? 'solid' : 'ghost'}
            onClick={() => dispatch(setActivePanel('ai'))}
            colorScheme="yellow"
            color="red"
            fontWeight="bold"
            _hover={{ bg: '#ffffff', color: 'red' }}
          >
            AI
          </Button>

          <Button
            size="sm"
            variant={activePanel === 'algorithms' ? 'solid' : 'ghost'}
            onClick={() => handlePanelChange('algorithms')}
            colorScheme="purple"
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#000099', color: 'white' }}
          >
            Algorithms
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearCircuit}
            colorScheme="red"
            color="white"
            fontWeight="bold"
            _hover={{ bg: 'red.500', color: 'white' }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleTutorial}
            colorScheme="teal"
            color="white"
            fontWeight="bold"
            _hover={{ bg: '#990099', color: 'white' }}
          >
            Tutorial
          </Button>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <span>🌙</span> : <span>☀️</span>}
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