import { Box, Flex, VStack, useColorModeValue, useToast } from '@chakra-ui/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useEffect } from 'react'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import CircuitCanvas from './components/canvas/CircuitCanvas'
import CodePanel from './components/panels/CodePanel'
import { useSelector } from 'react-redux'
import { selectActivePanel } from './store/slices/uiSlice'
import SimulationPanel from './components/panels/SimulationPanel'
import ExportPanel from './components/panels/ExportPanel'
import GateParamsPanel from './components/panels/GateParamsPanel'
import TutorialPanel from './components/panels/TutorialPanel'
import ResizablePanel from './components/layout/ResizablePanel'

function App() {
  const activePanel = useSelector(selectActivePanel)
  const toast = useToast()
  const panelBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Handle keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if not in input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }
      
      // Escape key to close panels or deselect items
      if (e.key === 'Escape') {
        // Would need to dispatch relevant actions
        // Implementation omitted for brevity
      }
      
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        toast({
          title: 'Undo',
          description: 'Undo functionality is coming in a future update',
          status: 'info',
          duration: 3000,
        })
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        toast({
          title: 'Redo',
          description: 'Redo functionality is coming in a future update',
          status: 'info',
          duration: 3000,
        })
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toast])

  // Error boundary for the entire application (simplified version)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      toast({
        title: 'Application Error',
        description: 'An unexpected error occurred. Try refreshing the page.',
        status: 'error',
        duration: null,
        isClosable: true,
      })
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [toast])

  return (
    <DndProvider backend={HTML5Backend}>
      <VStack spacing={0} align="stretch" h="100vh">
        <Header />
        <Flex flex={1} overflow="hidden">
          {/* Fixed sidebar that doesn't scroll */}
          <Box
            position="sticky"
            top={0}
            h="calc(100vh - 60px)" // Adjust based on header height
            zIndex={10}
            flexShrink={0}
          >
            <Sidebar />
          </Box>
          
          {/* Main content area with vertical scrolling */}
          <Box 
            flex={1} 
            p={4} 
            overflowY="auto" 
            h="calc(100vh - 60px)" // Adjust based on header height
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                width: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <Flex direction="column" minH="100%">
              <Box flex={1} mb={4}>
                <CircuitCanvas />
              </Box>
              <ResizablePanel 
                direction="vertical" 
                defaultSize={300} 
                minSize={150} 
                maxSize={500}
                borderWidth={1} 
                borderRadius="md" 
                bg={panelBg}
                borderColor={borderColor}
                p={4}
              >
                {activePanel === 'code' && <CodePanel />}
                {activePanel === 'simulation' && <SimulationPanel />}
                {activePanel === 'export' && <ExportPanel />}
              </ResizablePanel>
            </Flex>
          </Box>
            {/* Gate parameters panel - will only render when a gate is selected */}
          <GateParamsPanel />
        </Flex>
        
        {/* Tutorial panel - modal overlay */}
        <TutorialPanel />
      </VStack>
    </DndProvider>
  )
}

export default App