import React, { useRef } from 'react'
import { decodeCircuitFile } from '../generator/decoders/decodersInterface' // your decoder module
import { DecodedCircuit } from '../generator/decoders/decoders'

interface ImportCircuitButtonProps {
  onCircuitDecoded: (decoded: DecodedCircuit) => void
}

const ImportCircuitButton: React.FC<ImportCircuitButtonProps> = ({ onCircuitDecoded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const decoded = await decodeCircuitFile(file)
      onCircuitDecoded(decoded)
    } catch (err: any) {
      console.error('Failed to import circuit:', err)
      alert(err.message)
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
        accept=".json,.py,.qasm"
      />
      <button
        onClick={handleButtonClick}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
      >
        Import
      </button>
    </div>
  )
}

export default ImportCircuitButton
