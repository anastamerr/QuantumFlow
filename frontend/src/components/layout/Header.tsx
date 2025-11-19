import { Box, Flex, Heading, IconButton, Spacer, useColorMode, Button, HStack } from "@chakra-ui/react"
import { useDispatch, useSelector } from "react-redux"
import { setActivePanel, selectActivePanel, toggleTutorial } from "../../store/slices/uiSlice"
import { clearCircuit, selectCircuitName } from "../../store/slices/circuitSlice"

const Header = () => {
  const dispatch = useDispatch()
  const activePanel = useSelector(selectActivePanel)
  const circuitName = useSelector(selectCircuitName)
  const { colorMode, toggleColorMode } = useColorMode()

  const handlePanelChange = (panel: "circuit" | "code" | "simulation" | "export" | "algorithms" | "puzzles" | "stats" | "chat") => {
    dispatch(setActivePanel(panel))
  }

  const handleClearCircuit = () => {
    if (confirm("Are you sure you want to clear the current circuit?")) {
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
        <Spacer />
        
        <HStack spacing={2}>
          <Button
            size="sm"
            variant={activePanel === "circuit" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("circuit")}
            colorScheme="blue"
          >
            Circuit
          </Button>
          <Button
            size="sm"
            variant={activePanel === "code" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("code")}
            colorScheme="blue"
          >
            Code
          </Button>
          <Button
            size="sm"
            variant={activePanel === "simulation" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("simulation")}
            colorScheme="blue"
          >
            Simulation
          </Button>
          <Button
            size="sm"
            variant={activePanel === "export" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("export")}
            colorScheme="blue"
          >
            Export
          </Button>
          <Button
            size="sm"
            variant={activePanel === "stats" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("stats")}
            colorScheme="blue"
          >
            Stats
          </Button>
          <Button
            size="sm"
            variant={activePanel === "puzzles" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("puzzles")}
            colorScheme="cyan"
          >
            Puzzles
          </Button>
          <Button
            size="sm"
            variant={activePanel === "algorithms" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("algorithms")}
            colorScheme="purple"
          >
            Algorithms
          </Button>
          <Button
            size="sm"
            variant={activePanel === "chat" ? "solid" : "ghost"}
            onClick={() => handlePanelChange("chat")}
            colorScheme="orange"
          >
            AI Chat
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
          <Button
            size="sm"
            variant="solid"
            onClick={toggleColorMode}
            colorScheme="white"
          >
            {colorMode === "light" ? "☀️" : "🌙"}
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
}

export default Header
