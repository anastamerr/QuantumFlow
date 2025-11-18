import React from 'react'
import { Box, Text } from '@chakra-ui/react'
import { QubitPosition } from '@/types/qubitTouchdown' 

// --- Constants ---
const NODE_POSITIONS: Record<QubitPosition, { top: string; left: string }> = {
  '+': { top: '5%', left: '50%' },
  '0': { top: '30%', left: '25%' },
  '-i': { top: '30%', left: '75%' },
  '+i': { top: '60%', left: '25%' },
  '1': { top: '60%', left: '75%' },
  '-': { top: '85%', left: '50%' },
}

type Edge = {
  from: QubitPosition
  to: QubitPosition
  label: string
}

const EDGES: Edge[] = [
  { from: '0', to: '+', label: 'H' },
  { from: '0', to: '-i', label: '√x' },
  { from: '0', to: '1', label: 'X,Y' },
  { from: '+', to: '0', label: 'H' },
  { from: '-i', to: '+', label: 'S' },
  { from: '-i', to: '+i', label: 'X,Z,H' },
  { from: '-i', to: '1', label: '√x' },
  { from: '1', to: '0', label: 'X,Y' },
  { from: '1', to: '+i', label: '√x' },
  { from: '1', to: '-', label: 'H' },
  { from: '-', to: '1', label: 'H' },
  { from: '+i', to: '0', label: '√x' },
  { from: '+i', to: '-i', label: 'X,Z,H' },
  { from: '+i', to: '-', label: 'S' },
]

// --- Sub-Components ---

function EdgeArrow({ edge }: { edge: Edge }) {
  const from = NODE_POSITIONS[edge.from]
  const to = NODE_POSITIONS[edge.to]

  const x1 = parseFloat(from.left)
  const y1 = parseFloat(from.top)
  const x2 = parseFloat(to.left)
  const y2 = parseFloat(to.top)

  const isBidirectional = EDGES.some((e) => e.from === edge.to && e.to === edge.from)
  const t = isBidirectional ? 0.25 : 0.5

  const labelLeft = x1 + (x2 - x1) * t
  const labelTop = y1 + (y2 - y1) * t

  const markerId = `arrowhead-${edge.from}-${edge.to}`

  return (
    <>
      <Box position="absolute" top="0" left="0" w="100%" h="100%" pointerEvents="none" zIndex={0}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="7"
              refX="28"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="white" />
            </marker>
          </defs>
          <line
            x1={from.left}
            y1={from.top}
            x2={to.left}
            y2={to.top}
            stroke="white"
            strokeWidth="2"
            opacity="0.8"
            markerEnd={`url(#${markerId})`}
          />
        </svg>
      </Box>

      <Box
        position="absolute"
        top={`${labelTop}%`}
        left={`${labelLeft}%`}
        transform="translate(-50%, -120%)"
        zIndex={1}
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="white"
          bg="blackAlpha.700"
          px={1}
          borderRadius="sm"
          whiteSpace="nowrap"
        >
          {edge.label}
        </Text>
      </Box>
    </>
  )
}

function BoardNode({ pos, isBallHere }: { pos: QubitPosition; isBallHere: boolean }) {
  const node = NODE_POSITIONS[pos]
  return (
    <Box
      position="absolute"
      top={node.top}
      left={node.left}
      transform="translate(-50%, -50%)"
      zIndex={2}
    >
      <Box
        w="70px"
        h="70px"
        borderRadius="full"
        bg={isBallHere ? 'yellow.400' : 'yellow.200'}
        color="black"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderWidth={3}
        borderColor={isBallHere ? 'orange.500' : 'yellow.600'}
        fontWeight="bold"
        boxShadow={isBallHere ? '0 0 15px rgba(255, 200, 0, 0.8)' : 'none'}
        transition="all 0.3s ease"
      >
        {pos}
      </Box>
    </Box>
  )
}

// --- Main Component ---

interface QubitBoardProps {
  ballPosition: QubitPosition | undefined
}

export const QubitBoard = ({ ballPosition }: QubitBoardProps) => {
  return (
    <Box 
        flex="1" 
        w="full" 
        position="relative" 
        borderRadius="md" 
        borderWidth={1} 
        borderColor="whiteAlpha.500" 
        overflow="hidden" 
        bg="green.800"
    >
        {EDGES.map((edge, idx) => (
            <EdgeArrow key={`${edge.from}-${edge.to}-${idx}`} edge={edge} />
        ))}

        {(Object.keys(NODE_POSITIONS) as QubitPosition[]).map((pos) => (
            <BoardNode key={pos} pos={pos} isBallHere={ballPosition === pos} />
        ))}
    </Box>
  )
}