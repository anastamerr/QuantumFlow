import { decodeCircuitCode, DecodedCircuit } from './decoders' // your decoder module

type SupportedFormat = 'json' | 'qiskit' | 'cirq' | 'qasm'

const extensionToFormat: Record<string, SupportedFormat> = {
  '.json': 'json',
  '.py': 'qiskit', // default to Qiskit; will detect Cirq automatically
  '.qasm': 'qasm',
}

/**
 * Takes a File object from an <input type="file"> and decodes it.
 */
export const decodeCircuitFile = (file: File): Promise<DecodedCircuit> => {
  return new Promise((resolve, reject) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const format = extensionToFormat[ext]

    if (!format) {
      reject(new Error(`Unsupported file format: ${ext}. Supported: ${Object.keys(extensionToFormat).join(', ')}`))
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const code = reader.result as string

      // Detect Cirq if Python file
      const actualFormat: SupportedFormat =
        format === 'qiskit' && code.includes('cirq.') ? 'cirq' : format

      try {
        const decoded = decodeCircuitCode(code, actualFormat)
        resolve(decoded)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`))
    }

    reader.readAsText(file)
  })
}
