import { Box, Flex, VStack } from '@chakra-ui/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import CircuitCanvas from './components/canvas/CircuitCanvas'
import CodePanel from './components/panels/CodePanel'
import { useSelector } from 'react-redux'
import { selectActivePanel } from './store/slices/uiSlice'
import SimulationPanel from './components/panels/SimulationPanel'
import ExportPanel from './components/panels/ExportPanel'
import GateParamsPanel from './components/panels/GateParamsPanel'
import ResizablePanel from './components/layout/ResizablePanel'

function App() {
  const activePanel = useSelector(selectActivePanel)

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
                p={4}
              >
                {activePanel === 'code' && <CodePanel />}
                {activePanel === 'simulation' && <SimulationPanel />}
                {activePanel === 'export' && <ExportPanel />}
              </ResizablePanel>
            </Flex>
          </Box>
          
          <GateParamsPanel />
        </Flex>
      </VStack>
    </DndProvider>
  )
}

export default App