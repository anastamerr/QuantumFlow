import { Box, Flex, VStack, useColorModeValue, useToast, Button } from '@chakra-ui/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useEffect, useState } from 'react'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import RightSidebar from './components/layout/RightSidebar' // <--- Import the new file
import CircuitCanvas from './components/canvas/CircuitCanvas'
import CodePanel from './components/panels/CodePanel'
import { useSelector } from 'react-redux'
import { selectActivePanel, selectIsFullView } from './store/slices/uiSlice'
import SimulationPanel from './components/panels/SimulationPanel'
import ExportPanel from './components/panels/ExportPanel'
import GateParamsPanel from './components/panels/GateParamsPanel'
import TutorialPanel from './components/panels/TutorialPanel'
import AlgorithmLibraryPanel from './components/panels/AlgorithmLibraryPanel'
import ResizablePanel from './components/layout/ResizablePanel'

function App() {
  // --- STATES ---
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true) // <--- New State

  const activePanel = useSelector(selectActivePanel)
  const isFullView = useSelector(selectIsFullView)
  const toast = useToast()
  const panelBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Handle keyboard shortcuts (Keep your existing code)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') return
      if (e.key === 'Escape') {} // implementation omitted
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault(); toast({ title: 'Undo', status: 'info', duration: 3000 })
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault(); toast({ title: 'Redo', status: 'info', duration: 3000 })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toast])

  // Error boundary (Keep your existing code)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      toast({ title: 'Application Error', status: 'error', isClosable: true })
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [toast])

  return (
    <DndProvider backend={HTML5Backend}>
      <VStack spacing={0} align="stretch" h="100vh">
        <Header />
        <Flex flex={1} overflow="hidden">
          
          {/* --- 1. LEFT SIDEBAR --- */}
          {isLeftSidebarOpen && (
            <Box
              position="sticky"
              top={0}
              h="calc(100vh - 60px)"
              zIndex={10}
              flexShrink={0}
              borderRight="1px solid"
              borderColor={borderColor}
            >
              <Sidebar />
            </Box>
          )}
          
          {/* --- 2. MAIN CONTENT (CENTER) --- */}
          <Box 
            flex={1} 
            p={4} 
            overflowY="auto" 
            h="calc(100vh - 60px)"
            position="relative"
            css={{ '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}}
          >
             {/* LEFT Toggle Button */}
             <Button
                size="xs"
                position="absolute"
                left="10px"
                top="10px" 
                zIndex={100}
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                colorScheme="gray"
                variant="solid"
                shadow="md"
             >
                {isLeftSidebarOpen ? '◀' : '▶ Gates'}
             </Button>

             {/* RIGHT Toggle Button (NEW) */}
             <Button
                size="xs"
                position="absolute"
                right="10px" // Positioned on the right side
                top="10px" 
                zIndex={100}
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                colorScheme="blue" // Different color to make it stand out
                variant="solid"
                shadow="md"
             >
                {isRightSidebarOpen ? '▶' : '◀ Visualizer'}
             </Button>

            <Flex direction="column" minH="100%">
              {!isFullView && (
                <Box flex={1} mb={4}>
                  <CircuitCanvas />
                </Box>
              )}
              {/* Existing Bottom Panel */}
              <ResizablePanel 
                direction="vertical" 
                defaultSize={isFullView ? 600 : 300} 
                minSize={150} 
                maxSize={isFullView ? 800 : 500}
                borderWidth={1} 
                borderRadius="md" 
                bg={panelBg}
                borderColor={borderColor}
                p={4}
                flex={isFullView ? 1 : undefined}
                height={isFullView ? "calc(100vh - 120px)" : undefined}
              >
                {activePanel === 'code' && <CodePanel />}
                {activePanel === 'simulation' && <SimulationPanel />}
                {activePanel === 'export' && <ExportPanel />}
                {activePanel === 'algorithms' && <AlgorithmLibraryPanel />}
              </ResizablePanel>
            </Flex>
          </Box>

{/* --- 3. RIGHT SIDEBAR --- */}
          {isRightSidebarOpen && (
            <Box
              position="sticky"
              top={0}
              w="30%"     // <--- CHANGE THIS (Was "400px")
              minW="300px" // <--- GOOD PRACTICE: Prevents it from getting too skinny on small screens
              h="calc(100vh - 60px)"
              zIndex={10}
              flexShrink={0}
              borderLeft="1px solid"
              borderColor={borderColor}
              bg={panelBg}
            >
              <RightSidebar />
            </Box>
          )}

          {/* Gate parameters panel - Hidden logic remains same */}
          <GateParamsPanel />
        </Flex>
        
        <TutorialPanel />
      </VStack>
    </DndProvider>
  )
}

export default App