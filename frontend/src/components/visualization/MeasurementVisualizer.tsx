import {
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  Progress,
  Tag,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

type PerQubitProbabilities = Record<string, Record<string, number>>

interface MeasurementVisualizerProps {
  perQubitProbabilities?: PerQubitProbabilities | null
  measurementBasis?: Record<string, string> | null
  confidenceIntervals?: Record<string, [number, number]> | null
  stateProbabilities?: Record<string, number>
  measurementTimeline?: { qubit: number; position?: number; basis?: string }[]
}

const MeasurementVisualizer = ({
  perQubitProbabilities,
  measurementBasis,
  confidenceIntervals,
  stateProbabilities,
  measurementTimeline,
}: MeasurementVisualizerProps) => {
  const barBg = useColorModeValue('gray.100', 'gray.700')
  const accent = useColorModeValue('blue.500', 'blue.300')
  const basisColors: Record<string, string> = {
    x: 'red.400',
    y: 'green.400',
    z: 'blue.400',
  }

  const perQubitEntries = perQubitProbabilities ? Object.entries(perQubitProbabilities) : []
  const timelineEntries = measurementTimeline ? [...measurementTimeline] : []
  const histogramEntries = stateProbabilities
    ? Object.entries(stateProbabilities)
        .filter(([_, prob]) => prob > 0.001)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : []

  if (perQubitEntries.length === 0 && histogramEntries.length === 0 && timelineEntries.length === 0) {
    return <Text color="gray.500">Measurement visualization data is unavailable.</Text>
  }

  return (
    <VStack spacing={4} align="stretch">
      {perQubitEntries.length > 0 && (
        <>
          <Heading size="sm">Per-Qubit Measurement</Heading>
          <Grid templateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap={4}>
            {perQubitEntries.map(([qubit, probs]) => {
              const p0 = probs['0'] ?? 0
              const p1 = probs['1'] ?? 0
              const basis = measurementBasis?.[qubit] ?? 'z'
              const basisColor = basisColors[basis] ?? 'gray.400'

              return (
                <GridItem key={qubit} p={3} borderRadius="md" bg={barBg}>
                  <HStack justify="space-between" mb={2}>
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="full" bg={basisColor} />
                      <Text fontWeight="bold">q{qubit}</Text>
                    </HStack>
                    <Tag size="sm" colorScheme="purple">
                      {basis.toUpperCase()} basis
                    </Tag>
                  </HStack>
                  <Box mb={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm">|0&gt;</Text>
                      <Text fontSize="sm">{(p0 * 100).toFixed(1)}%</Text>
                    </HStack>
                    <Progress value={p0 * 100} size="sm" colorScheme="blue" />
                  </Box>
                  <Box>
                    <HStack justify="space-between">
                      <Text fontSize="sm">|1&gt;</Text>
                      <Text fontSize="sm">{(p1 * 100).toFixed(1)}%</Text>
                    </HStack>
                    <Progress value={p1 * 100} size="sm" colorScheme="green" />
                  </Box>
                  {confidenceIntervals && (
                    <Text mt={2} fontSize="xs" color={accent}>
                      Confidence intervals are available per bitstring in the results panel.
                    </Text>
                  )}
                </GridItem>
              )
            })}
          </Grid>
        </>
      )}

      {histogramEntries.length > 0 && (
        <>
          <Heading size="sm">Probability Histogram</Heading>
          <VStack spacing={3} align="stretch">
            {histogramEntries.map(([state, prob]) => {
              const interval = confidenceIntervals?.[state]
              const lower = interval ? interval[0] : null
              const upper = interval ? interval[1] : null
              const maxValue = histogramEntries[0][1]
              const scale = maxValue > 0 ? 100 / maxValue : 0
              const barWidth = prob * scale
              const ciLeft = lower !== null ? lower * scale : null
              const ciWidth = lower !== null && upper !== null ? (upper - lower) * scale : null

              return (
                <Box key={state}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" fontFamily="monospace">
                      |{state}{'>'}
                    </Text>
                    <Text fontSize="sm">{(prob * 100).toFixed(2)}%</Text>
                  </HStack>
                  <Box position="relative" h="18px" bg={barBg} borderRadius="full" overflow="hidden">
                    <Box h="100%" bg="blue.400" w={`${barWidth}%`} borderRadius="full" />
                    {ciLeft !== null && ciWidth !== null && (
                      <Box
                        position="absolute"
                        top="50%"
                        left={`${ciLeft}%`}
                        transform="translateY(-50%)"
                        height="4px"
                        width={`${ciWidth}%`}
                        bg="orange.400"
                        borderRadius="full"
                      />
                    )}
                  </Box>
                </Box>
              )
            })}
          </VStack>
        </>
      )}

      {timelineEntries.length > 0 && (
        <>
          <Heading size="sm">Measurement Timeline</Heading>
          <HStack spacing={2} wrap="wrap">
            {timelineEntries.map((entry, idx) => (
              <Tag key={`${entry.qubit}-${entry.position ?? idx}`} size="sm" colorScheme="gray">
                q{entry.qubit} @ {entry.position ?? idx} ({(entry.basis ?? 'z').toUpperCase()})
              </Tag>
            ))}
          </HStack>
        </>
      )}
    </VStack>
  )
}

export default MeasurementVisualizer
