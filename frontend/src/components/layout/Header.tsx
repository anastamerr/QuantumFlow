import { 
  Box, 
  Flex, 
  Heading, 
  IconButton, 
  Spacer, 
  useColorMode, 
  Button, 
  HStack, 
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  Text
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
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
  
  // Show full navigation on larger screens; default to mobile layout during hydration
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false

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

  const renderDesktopBadge = (withEmoji = false) => (
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
      {withEmoji && <span style={{ marginRight: 6 }}>✨</span>}
      NEW
    </Box>
  )

  return (
    <Box as="header" bg="quantum.primary" color="white" p={3} boxShadow="md">
      {isDesktop ? (
        <Flex align="center" gap={3} minH="56px">
          <Flex align="center" minW="200px" flex="0 0 auto">
            <Heading size="md" fontWeight="bold" color="white">
              QuantumFlow
            </Heading>
          </Flex>

          <HStack spacing={2} flexShrink={0}>
            <Button
              size="sm"
              variant={activePanel === 'projects' ? 'solid' : 'ghost'}
              colorScheme="blue"
              onClick={() => dispatch(setActivePanel('projects'))}
            >
              Projects
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dispatch(setActivePanel('library'))}
            >
              Library
            </Button>
            <Button
              size="sm"
              variant={activePanel === 'blochSphere' ? 'solid' : 'ghost'}
              colorScheme="cyan"
              onClick={() => dispatch(setActivePanel('blochSphere'))}
              position="relative"
            >
              <Box position="relative" display="inline-flex" alignItems="center" px={2}>
                Bloch Sphere
                {renderDesktopBadge(true)}
              </Box>
            </Button>
          </HStack>

          <Spacer />

          <HStack spacing={2} flexWrap="wrap" justify="flex-end">
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
              variant={activePanel === 'ai' ? 'solid' : 'ghost'}
              onClick={() => dispatch(setActivePanel('ai'))}
              colorScheme="yellow"
            >
              AI
            </Button>
            <Button
              size="sm"
              variant={activePanel === 'algorithms' ? 'solid' : 'ghost'}
              onClick={() => handlePanelChange('algorithms')}
              colorScheme="purple"
            >
              Algorithms
            </Button>
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
              icon={colorMode === 'light' ? <span>🌙</span> : <span>☀️</span>}
              size="sm"
              onClick={toggleColorMode}
              variant="ghost"
            />
          </HStack>
        </Flex>
      ) : (
        <Flex align="center" justify="space-between" minH="48px">
          <Flex align="center" flex="1" minW={0}>
            <Heading size={["xs", "sm"]} fontWeight="bold" noOfLines={1}>
              QuantumFlow
            </Heading>
          </Flex>

          <HStack spacing={1}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <span>🌙</span> : <span>☀️</span>}
              size="sm"
              onClick={toggleColorMode}
              variant="ghost"
            />
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Navigation menu"
                icon={<HamburgerIcon />}
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
              <MenuList
                bg="quantum.primary"
                borderColor="whiteAlpha.300"
                color="white"
                minW="220px"
                maxH="80vh"
                overflowY="auto"
              >
                <MenuItem
                  bg={activePanel === 'projects' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => dispatch(setActivePanel('projects'))}
                >
                  📁 Projects
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'library' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => dispatch(setActivePanel('library'))}
                >
                  📚 Library
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'blochSphere' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => dispatch(setActivePanel('blochSphere'))}
                >
                  <Flex align="center" justify="space-between" w="100%">
                    <Text>🌐 Bloch Sphere</Text>
                    <Badge colorScheme="yellow" fontSize="xs" ml={2}>NEW</Badge>
                  </Flex>
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'circuit' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => handlePanelChange('circuit')}
                >
                  🔧 Circuit
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'code' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => handlePanelChange('code')}
                >
                  💻 Code
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'simulation' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => handlePanelChange('simulation')}
                >
                  ⚡ Simulation
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'export' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => handlePanelChange('export')}
                >
                  📤 Export
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'ai' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => dispatch(setActivePanel('ai'))}
                >
                  🤖 AI
                </MenuItem>
                <MenuItem
                  bg={activePanel === 'algorithms' ? 'whiteAlpha.200' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => handlePanelChange('algorithms')}
                >
                  🧮 Algorithms
                </MenuItem>
                <MenuItem
                  bg="transparent"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={handleClearCircuit}
                  color="white"
                >
                  🗑️ Clear
                </MenuItem>
                <MenuItem
                  bg="transparent"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={handleToggleTutorial}
                  color="white"
                >
                  🎓 Tutorial
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      )}
    </Box>
  )
}

export default Header