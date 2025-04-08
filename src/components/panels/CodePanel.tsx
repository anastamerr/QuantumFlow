import { Box, Heading, Text, Button, useColorModeValue, HStack, Select } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { selectQubits, selectGates } from '../../store/slices/circuitSlice'
import { selectCodeFormat, setCodeFormat } from '../../store/slices/uiSlice'
import { generateQiskitCode } from '../../utils/codeGenerator'
import { generateCirqCode } from '../../utils/codeGenerator'

const CodePanel = () => {
  const dispatch = useDispatch()
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const codeFormat = useSelector(selectCodeFormat)
  
  const codeBg = useColorModeValue('gray.50', 'gray.800')
  const codeBorder = useColorModeValue('gray.200', 'gray.600')
  
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCodeFormat(e.target.value as 'qiskit' | 'cirq' | 'json'))
  }
  
  const handleCopyCode = () => {
    let code = ''
    
    if (codeFormat === 'qiskit') {
      code = generateQiskitCode(qubits, gates)
    } else if (codeFormat === 'cirq') {
      code = generateCirqCode(qubits, gates)
    } else if (codeFormat === 'json') {
      code = JSON.stringify({ qubits, gates }, null, 2)
    }
    
    navigator.clipboard.writeText(code)
      .then(() => alert('Code copied to clipboard!'))
      .catch(err => console.error('Failed to copy code:', err))
  }
  
  const getGeneratedCode = () => {
    if (codeFormat === 'qiskit') {
      return generateQiskitCode(qubits, gates)
    } else if (codeFormat === 'cirq') {
      return generateCirqCode(qubits, gates)
    } else if (codeFormat === 'json') {
      return JSON.stringify({ qubits, gates }, null, 2)
    }
    return ''
  }
  
  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Generated Code</Heading>
        <HStack>
          <Select size="sm" value={codeFormat} onChange={handleFormatChange} w="120px">
            <option value="qiskit">Qiskit</option>
            <option value="cirq">Cirq</option>
            <option value="json">JSON</option>
          </Select>
          <Button size="sm" colorScheme="blue" onClick={handleCopyCode}>
            Copy Code
          </Button>
        </HStack>
      </HStack>
      
      <Box 
        p={4} 
        borderRadius="md" 
        bg={codeBg} 
        borderWidth={1} 
        borderColor={codeBorder}
        overflowX="auto"
        fontFamily="monospace"
        fontSize="sm"
        whiteSpace="pre"
      >
        {gates.length === 0 ? (
          <Text color="gray.500" fontStyle="italic">
            Your circuit is empty. Drag and drop gates to generate code.
          </Text>
        ) : (
          getGeneratedCode()
        )}
      </Box>
    </Box>
  )
}

export default CodePanel