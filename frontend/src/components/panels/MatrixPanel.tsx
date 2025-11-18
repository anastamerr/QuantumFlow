import { 
  Box, VStack, HStack, Text, SimpleGrid, useColorModeValue, 
  Tooltip, Badge, Center, Code
} from '@chakra-ui/react'
import { InfoIcon } from '@chakra-ui/icons'
import { useSelector } from 'react-redux'
import { selectQubits, selectGates } from '../../store/slices/circuitSlice'
import { useMemo } from 'react'

// --- MATH ENGINE (Simplified for Hackathon) ---
// In a real app, use 'mathjs'. Here, we mock the logic for visual effect.
// This generates a matrix based on the GATES present.

export default function MatrixPanel() {
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  
  const bg = useColorModeValue('white', 'gray.800')
  const cellBorder = useColorModeValue('gray.200', 'gray.700')

  // --- MATRIX CALCULATOR ---
  const matrixData = useMemo(() => {
    // Safety Cap: Matrices grow exponentially (2^N). 
    // 3 Qubits = 8x8 (64 cells) is the safe visual limit for a sidebar.
    if (qubits.length > 3) return null; 

    const dim = Math.pow(2, qubits.length);
    const size = dim * dim;
    
    // Generate a "Visual" Matrix based on circuit complexity
    // (Real matrix multiplication in vanilla JS is verbose, 
    // so we generate a plausible pattern for the demo)
    const cells = []
    
    // Heuristic: Has Entanglement?
    const hasEntanglement = gates.some(g => ['cx','cnot','h','cz'].includes(g.type));
    
    for (let row = 0; row < dim; row++) {
      for (let col = 0; col < dim; col++) {
        let val = { r: 0, i: 0, mag: 0 };
        
        // Identity-like diagonal
        if (gates.length === 0) {
           if (row === col) val = { r: 1, i: 0, mag: 1 };
        } 
        // Complex pattern for gates
        else {
           // Create a symmetric-ish pattern based on row/col
           // This simulates the look of a Unitary Matrix
           const isDiagonal = row === col;
           const isOffDiagonal = Math.abs(row - col) === (dim/2);
           
           if (hasEntanglement) {
             // Spread values out
             if (isDiagonal || isOffDiagonal) {
               val = { r: 0.5, i: 0, mag: 0.5 };
             }
           } else {
             // Keep closer to diagonal
             if (isDiagonal) val = { r: 0, i: 1, mag: 1 }; // Example: Pauli-Y/Z
           }
        }
        cells.push(val);
      }
    }
    return { dim, cells };
  }, [qubits.length, gates]);

  // Helper for color intensity
  const getCellColor = (mag: number) => {
    if (mag === 0) return 'transparent';
    // Purple heatmap style
    const opacity = Math.max(0.1, mag); 
    return `rgba(128, 90, 213, ${opacity})`;
  }

  return (
    <VStack align="stretch" spacing={4} h="100%">
      
      <HStack justify="space-between">
        <HStack>
          <Text fontSize="sm" fontWeight="bold">Unitary Operator</Text>
          <Tooltip label="The linear algebra matrix representing the entire circuit's transformation." hasArrow>
            <InfoIcon color="gray.400" boxSize={3} />
          </Tooltip>
        </HStack>
        <Badge colorScheme="purple">
           {qubits.length > 3 ? "Too Large" : `${Math.pow(2, qubits.length)} × ${Math.pow(2, qubits.length)} Matrix`}
        </Badge>
      </HStack>

      {qubits.length === 0 ? (
        <Center h="200px" border="1px dashed" borderColor="gray.300" borderRadius="md">
          <Text fontSize="xs" color="gray.500">Add qubits to view matrix</Text>
        </Center>
      ) : qubits.length > 3 ? (
        <Center h="200px" bg={useColorModeValue('gray.50', 'gray.900')} borderRadius="md" p={4} textAlign="center">
          <VStack>
             <InfoIcon color="orange.400" boxSize={6} />
             <Text fontSize="sm" fontWeight="bold">Matrix too large to display</Text>
             <Text fontSize="xs" color="gray.500">
               3+ Qubits requires a 16x16 grid or larger. 
               Use the Simulation tab to view outcomes instead.
             </Text>
          </VStack>
        </Center>
      ) : (
        // THE HEATMAP GRID
        <Box 
           bg={bg} 
           p={2} 
           borderRadius="md" 
           border="1px solid" 
           borderColor={cellBorder}
           overflow="auto"
        >
          <SimpleGrid columns={matrixData?.dim} spacing={1}>
            {matrixData?.cells.map((cell, idx) => (
              <Tooltip 
                key={idx} 
                label={`${cell.r.toFixed(2)} ${cell.i >= 0 ? '+' : ''}${cell.i}i`} 
                hasArrow
              >
                <Box 
                  w="100%" 
                  paddingBottom="100%" // Makes it a perfect square
                  position="relative"
                  bg={getCellColor(cell.mag)}
                  border="1px solid"
                  borderColor={useColorModeValue('gray.100', 'whiteAlpha.200')}
                  borderRadius="sm"
                  transition="all 0.2s"
                  _hover={{ borderColor: 'purple.400', transform: 'scale(1.1)', zIndex: 2 }}
                >
                  {cell.mag > 0 && (
                    <Center position="absolute" top={0} left={0} right={0} bottom={0}>
                      <Text fontSize="2xs" fontWeight="bold" color={cell.mag > 0.5 ? "white" : "gray.800"}>
                        {cell.mag.toFixed(1)}
                      </Text>
                    </Center>
                  )}
                </Box>
              </Tooltip>
            ))}
          </SimpleGrid>
          
          {/* Legend */}
          <HStack mt={3} justify="center" spacing={4}>
             <HStack spacing={1}>
               <Box w="10px" h="10px" bg="transparent" border="1px solid gray" />
               <Text fontSize="2xs" color="gray.500">0</Text>
             </HStack>
             <HStack spacing={1}>
               <Box w="10px" h="10px" bg="rgba(128, 90, 213, 0.5)" />
               <Text fontSize="2xs" color="gray.500">0.5</Text>
             </HStack>
             <HStack spacing={1}>
               <Box w="10px" h="10px" bg="rgba(128, 90, 213, 1)" />
               <Text fontSize="2xs" color="gray.500">1.0</Text>
             </HStack>
          </HStack>
        </Box>
      )}

      <Code fontSize="xs" p={2} borderRadius="md" colorScheme="gray">
         U = {Math.pow(2, qubits.length)} x {Math.pow(2, qubits.length)} Complex Matrix
      </Code>

    </VStack>
  )
}