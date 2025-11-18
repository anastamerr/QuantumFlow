import React, { useRef } from 'react'
import { Button, useToast, useColorModeValue } from '@chakra-ui/react'
import { decodeCircuitFile } from '../generator/decoders/decodersInterface' // your decoder module
import { DecodedCircuit } from '../generator/decoders/decoders'

interface ImportCircuitButtonProps {
  onCircuitDecoded: (decoded: DecodedCircuit) => void
}

const ImportCircuitButton: React.FC<ImportCircuitButtonProps> = ({ onCircuitDecoded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const bg = useColorModeValue('cyan.300', 'cyan.600')
  const hoverBg = useColorModeValue('cyan.400', 'cyan.700')

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const decoded = await decodeCircuitFile(file)
      onCircuitDecoded(decoded)
      toast({
        title: 'File imported',
        description: `${file.name} parsed successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err: any) {
      console.error('Failed to import circuit:', err)
      toast({
        title: 'Import failed',
        description: err?.message ?? 'Could not import the circuit file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      // Reset the input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".json,.py,.qasm,.txt"
      />
      <Button
        onClick={handleButtonClick}
        bg={bg}
        _hover={{ bg: hoverBg }}
        color="white"
        size="sm"
        fontWeight="semibold"
        borderRadius="md"
        boxShadow="sm"
      >
        Import
      </Button>
    </div>
  )
}

export default ImportCircuitButton
