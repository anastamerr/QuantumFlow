import { Box, Heading, VStack, Button, useColorModeValue, Radio, RadioGroup, Stack, Text, useToast } from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { selectQubits, selectGates, selectCircuitName, selectCircuitDescription } from '../../store/slices/circuitSlice'
import { useState } from 'react'
import { generateQiskitCode, generateCirqCode } from '../../utils/codeGenerator'
import { Gate } from '../../types/circuit'

const ExportPanel = () => {
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const circuitName = useSelector(selectCircuitName)
  const circuitDescription = useSelector(selectCircuitDescription)
  const [exportFormat, setExportFormat] = useState<string>('json')
  const toast = useToast()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  // Generate the export data based on the selected format
  const getExportData = (): string => {
    switch (exportFormat) {
      case 'json':
        return JSON.stringify({
          name: circuitName,
          description: circuitDescription,
          qubits,
          gates,
        }, null, 2)
      case 'qiskit':
        // Fix type error by ensuring gates match the expected type
        return generateQiskitCode(qubits, gates)
      case 'cirq':
        // Fix type error by ensuring gates match the expected type
        return generateCirqCode(qubits, gates)
      case 'svg':
        // In a real implementation, this would generate an SVG file
        // For now, we'll return a placeholder message
        return '<!-- SVG export would be implemented here -->';
      default:
        return ''
    }
  }
  
  // Handle export button click
  const handleExport = () => {
    const data = getExportData()
    let filename = ''
    let mimeType = ''
    
    // Set filename and MIME type based on format
    switch (exportFormat) {
      case 'json':
        filename = `${circuitName.replace(/\s+/g, '_')}.json`
        mimeType = 'application/json'
        break
      case 'qiskit':
      case 'cirq':
        filename = `${circuitName.replace(/\s+/g, '_')}.py`
        mimeType = 'text/plain'
        break
      case 'svg':
        filename = `${circuitName.replace(/\s+/g, '_')}.svg`
        mimeType = 'image/svg+xml'
        break
      default:
        filename = `${circuitName.replace(/\s+/g, '_')}.txt`
        mimeType = 'text/plain'
    }
    
    // Create a download link
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Show success toast
    toast({
      title: 'Export successful',
      description: `Circuit exported as ${filename}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }
  
  return (
    <Box>
      <Heading size="md" mb={4}>Export Circuit</Heading>
      
      <VStack spacing={4} align="stretch">
        <Box 
          p={4} 
          borderRadius="md" 
          bg={bg} 
          borderWidth={1} 
          borderColor={borderColor}
        >
          <Heading size="sm" mb={3}>Export Format</Heading>
          
          <RadioGroup onChange={setExportFormat} value={exportFormat}>
            <Stack direction="column" spacing={2}>
              <Radio value="json">JSON (Circuit Design)</Radio>
              <Radio value="qiskit">Qiskit Python Code</Radio>
              <Radio value="cirq">Cirq Python Code</Radio>
              <Radio value="svg">SVG (Circuit Diagram)</Radio>
            </Stack>
          </RadioGroup>
        </Box>
        
        <Box 
          p={4} 
          borderRadius="md" 
          bg={bg} 
          borderWidth={1} 
          borderColor={borderColor}
        >
          <Heading size="sm" mb={3}>Circuit Information</Heading>
          
          <Text><strong>Name:</strong> {circuitName}</Text>
          {circuitDescription && (
            <Text><strong>Description:</strong> {circuitDescription}</Text>
          )}
          <Text><strong>Qubits:</strong> {qubits.length}</Text>
          <Text><strong>Gates:</strong> {gates.length}</Text>
        </Box>
        
        <Button 
          colorScheme="blue" 
          onClick={handleExport}
          isDisabled={gates.length === 0}
          leftIcon={<span>📥</span>}
        >
          Export Circuit
        </Button>
        
        {gates.length === 0 && (
          <Text color="orange.500" fontSize="sm">
            Your circuit is empty. Add gates to enable export.
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export default ExportPanel