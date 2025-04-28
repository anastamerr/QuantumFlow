import { Qubit, Gate } from '../types/circuit'
import { gateLibrary } from './gateLibrary'

/**
 * Renders a quantum circuit as an SVG string
 * @param qubits Array of qubits in the circuit
 * @param gates Array of gates in the circuit
 * @returns SVG representation of the circuit as a string
 */
export const renderCircuitSvg = (qubits: Qubit[], gates: Gate[]): string => {
  try {
    if (qubits.length === 0) {
      return '<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50" font-family="sans-serif">Empty circuit - add qubits to visualize</text></svg>'
    }

    // Calculate dimensions
    const cellWidth = 60
    const cellHeight = 60
    const labelWidth = 80
    const wireSpacing = 60
    const padding = 20

    // Find the maximum position used by any gate
    const maxPos = gates.length > 0 
      ? Math.max(...gates.map(g => g.position || 0)) + 1 
      : 10

    const width = labelWidth + (maxPos * cellWidth) + (2 * padding)
    const height = (qubits.length * wireSpacing) + (2 * padding)

    // Start SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
`
    
    // Add styles
    svg += `<style>
      .wire { stroke: #718096; stroke-width: 2; }
      .gate-rect { stroke: #2D3748; stroke-width: 1; }
      .gate-text { font-family: sans-serif; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
      .qubit-label { font-family: sans-serif; font-size: 14px; text-anchor: middle; dominant-baseline: middle; }
      .control-point { stroke: #2D3748; stroke-width: 1; fill: #2D3748; }
      .target-x { stroke: #2D3748; stroke-width: 2; fill: none; }
      .connector-line { stroke: #2D3748; stroke-width: 2; }
      /* Time markers */
      .time-marker { stroke: #E2E8F0; stroke-width: 1; stroke-dasharray: 4, 4; }
      .time-label { font-family: sans-serif; font-size: 10px; text-anchor: middle; fill: #718096; }
    </style>\n`

    // Draw time markers (vertical lines)
    for (let t = 0; t <= maxPos; t++) {
      const x = padding + labelWidth + (t * cellWidth)
      svg += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" class="time-marker" />
`
      // Add time labels every 5 positions
      if (t % 5 === 0) {
        svg += `<text x="${x}" y="${padding - 5}" class="time-label">t=${t}</text>
`
      }
    }
    
    // Draw qubit wires
    for (let i = 0; i < qubits.length; i++) {
      const y = padding + (i * wireSpacing)
      
      // Qubit label
      svg += `<rect x="${padding}" y="${y - cellHeight/2}" width="${labelWidth}" height="${cellHeight}" fill="#EBF8FF" stroke="#BEE3F8" rx="3" />
`
      svg += `<text x="${padding + labelWidth/2}" y="${y}" class="qubit-label">${qubits[i].name}</text>
`
      
      // Wire
      svg += `<line x1="${padding + labelWidth}" y1="${y}" x2="${width - padding}" y2="${y}" class="wire" />
`
    }

    // Draw gates
    gates.forEach(gate => {
      const gateDefinition = gateLibrary.find(g => g.id === gate.type)
      if (!gateDefinition) return

      const qubit = gate.qubit || 0
      const position = gate.position || 0
      const x = padding + labelWidth + (position * cellWidth) + (cellWidth / 2)
      const y = padding + (qubit * wireSpacing)
      const gateColor = gateDefinition.color || 'gray'

      // Handle different gate types
      if (gate.type === 'cnot' || gate.type === 'cz') {
        // Draw control qubit
        const controlQubit = gate.qubit !== undefined ? gate.qubit : (gate.controls && gate.controls.length > 0 ? gate.controls[0] : 0)
        const controlY = padding + (controlQubit * wireSpacing)
        svg += `<circle cx="${x}" cy="${controlY}" r="5" class="control-point" />
`

        // Draw target qubit
        const targetQubit = gate.targets && gate.targets.length > 0 ? gate.targets[0] : 0
        const targetY = padding + (targetQubit * wireSpacing)

        // Connect control and target
        svg += `<line x1="${x}" y1="${controlY}" x2="${x}" y2="${targetY}" class="connector-line" />
`

        if (gate.type === 'cnot') {
          // Draw X gate on target
          svg += `<circle cx="${x}" cy="${targetY}" r="15" class="target-x" />
`
          svg += `<line x1="${x-15}" y1="${targetY}" x2="${x+15}" y2="${targetY}" class="target-x" />
`
          svg += `<line x1="${x}" y1="${targetY-15}" x2="${x}" y2="${targetY+15}" class="target-x" />
`
        } else {
          // Draw Z gate on target (dot)
          svg += `<circle cx="${x}" cy="${targetY}" r="15" class="target-x" />
`
          svg += `<text x="${x}" y="${targetY}" class="gate-text" fill="#2D3748">Z</text>
`
        }
      } else if (gate.type === 'swap') {
        // Draw SWAP gate
        const qubit1 = gate.qubit || 0
        const qubit2 = gate.targets && gate.targets.length > 0 ? gate.targets[0] : 1
        const y1 = padding + (qubit1 * wireSpacing)
        const y2 = padding + (qubit2 * wireSpacing)

        // Connect qubits
        svg += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="connector-line" />
`

        // Draw X symbols
        svg += `<line x1="${x-10}" y1="${y1-10}" x2="${x+10}" y2="${y1+10}" class="target-x" />
`
        svg += `<line x1="${x-10}" y1="${y1+10}" x2="${x+10}" y2="${y1-10}" class="target-x" />
`
        svg += `<line x1="${x-10}" y1="${y2-10}" x2="${x+10}" y2="${y2+10}" class="target-x" />
`
        svg += `<line x1="${x-10}" y1="${y2+10}" x2="${x+10}" y2="${y2-10}" class="target-x" />
`
      } else if (gate.type === 'toffoli') {
        // Draw Toffoli gate
        const control1 = gate.controls && gate.controls.length > 0 ? gate.controls[0] : 0
        const control2 = gate.controls && gate.controls.length > 1 ? gate.controls[1] : 1
        const target = gate.targets && gate.targets.length > 0 ? gate.targets[0] : 2
        const y1 = padding + (control1 * wireSpacing)
        const y2 = padding + (control2 * wireSpacing)
        const y3 = padding + (target * wireSpacing)

        // Connect controls and target
        const minY = Math.min(y1, y2, y3)
        const maxY = Math.max(y1, y2, y3)
        svg += `<line x1="${x}" y1="${minY}" x2="${x}" y2="${maxY}" class="connector-line" />
`

        // Draw control points
        svg += `<circle cx="${x}" cy="${y1}" r="5" class="control-point" />
`
        svg += `<circle cx="${x}" cy="${y2}" r="5" class="control-point" />
`

        // Draw X gate on target
        svg += `<circle cx="${x}" cy="${y3}" r="15" class="target-x" />
`
        svg += `<line x1="${x-15}" y1="${y3}" x2="${x+15}" y2="${y3}" class="target-x" />
`
        svg += `<line x1="${x}" y1="${y3-15}" x2="${x}" y2="${y3+15}" class="target-x" />
`
      } else {
        // Draw standard gate
        const gateColorHex = getGateColor(gateColor)
        svg += `<rect x="${x - 20}" y="${y - 20}" width="40" height="40" rx="5" fill="${gateColorHex}" class="gate-rect" />
`
        svg += `<text x="${x}" y="${y}" class="gate-text" fill="white">${gateDefinition.symbol}</text>
`

        // Add parameter if present
        if (gateDefinition.params && gateDefinition.params.length > 0 && gate.params) {
          const paramName = gateDefinition.params[0].name
          const paramValue = gate.params[paramName] !== undefined 
            ? gate.params[paramName] 
            : gateDefinition.params[0].default
            
          svg += `<text x="${x}" y="${y + 30}" font-family="sans-serif" font-size="10px" text-anchor="middle">${paramValue}</text>
`
        }
      }
    })

    // Close SVG
    svg += '</svg>'

    return svg
  } catch (error) {
    console.error("Error rendering circuit SVG:", error)
    // Return a simple error SVG
    return `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="30" font-family="sans-serif" fill="red">Error rendering circuit</text>
      <text x="10" y="50" font-family="sans-serif" fill="red">${error instanceof Error ? error.message : 'Unknown error'}</text>
    </svg>`
  }
}

// Helper function to get gate colors
const getGateColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue': '#3182CE',
    'red': '#E53E3E',
    'green': '#38A169',
    'purple': '#805AD5',
    'teal': '#319795',
    'cyan': '#00B5D8',
    'orange': '#DD6B20',
    'pink': '#D53F8C',
    'yellow': '#D69E2E',
    'gray': '#718096'
  }

  return colorMap[color] || colorMap.gray
}