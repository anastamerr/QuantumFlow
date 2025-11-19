import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Grid,
  GridItem,
  Tooltip,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { selectGateCount, selectGates, selectQubitCount, selectQubits } from '../../store/slices/circuitSlice'
import computeGateUsageMatrix from '../../utils/heatmap'

const cellSizes = {
  base: '48px',
  md: '56px',
}

const HeatmapPanel = () => {
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const qubitCount = useSelector(selectQubitCount)
  const gateCount = useSelector(selectGateCount)

  const { gateNames, matrix, maxCount } = useMemo(() => {
    return computeGateUsageMatrix({ qubits, gates })
  }, [qubits, gates])

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cellBg = useColorModeValue('gray.50', 'gray.900')
  const axisBg = useColorModeValue('gray.100', 'gray.700')
  const accentColor = useColorModeValue('blue.500', 'blue.300')
  const mutedText = useColorModeValue('gray.600', 'gray.400')

  const getIntensity = (value: number) => {
    if (maxCount === 0) return 0
    return value / maxCount
  }

  const getCellColor = (value: number) => {
    const intensity = getIntensity(value)
    if (intensity === 0) return cellBg

    const alpha = Math.min(0.1 + intensity * 0.7, 0.8)
    return `${accentColor}${Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')}`
  }

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={6}
      h="full"
      overflow="hidden"
    >
      <VStack align="stretch" spacing={4} h="full">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={2}
        >
          <Box>
            <Heading size="md">Gate Usage Heatmap</Heading>
            <Text fontSize="sm" color={mutedText}>
              Shows how frequently each gate interacts with each qubit.
            </Text>
          </Box>
          <HStack spacing={3}>
            <Badge colorScheme="blue" variant="subtle" borderRadius="md" px={3} py={1}>
              {qubitCount} qubits
            </Badge>
            <Badge colorScheme="purple" variant="subtle" borderRadius="md" px={3} py={1}>
              {gateCount} gates
            </Badge>
          </HStack>
        </Flex>

        <Flex align="center" gap={4}>
          <Text fontSize="sm" color={mutedText}>
            Legend:
          </Text>
          <HStack spacing={2}>
            {[0, 0.33, 0.66, 1].map((value) => (
              <Box key={value} textAlign="center">
                <Box
                  w="24px"
                  h="12px"
                  borderRadius="full"
                  bg={getCellColor(value * maxCount)}
                  border="1px solid"
                  borderColor={borderColor}
                />
                <Text fontSize="xs" color={mutedText}>
                  {Math.round(value * maxCount)}
                </Text>
              </Box>
            ))}
          </HStack>
        </Flex>

        <Box flex={1} overflowX={qubits.length > 16 ? 'auto' : 'hidden'}>
          {gateNames.length === 0 ? (
            <Box mt={8} textAlign="center">
              <Text color={mutedText} fontStyle="italic">
                Add gates to see usage distribution across qubits.
              </Text>
            </Box>
          ) : (
            <Box minW={qubits.length > 16 ? `${qubits.length * 56}px` : 'auto'}>
              <Grid
                templateColumns={`repeat(${qubits.length + 1}, minmax(${cellSizes.base}, ${cellSizes.md}))`}
                autoRows={{ base: cellSizes.base, md: cellSizes.md }}
                gap={2}
                alignItems="stretch"
              >
                <GridItem />
                {qubits.map((qubit) => (
                  <GridItem
                    key={qubit.id}
                    bg={axisBg}
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="medium"
                  >
                    {qubit.name || `q${qubit.id}`}
                  </GridItem>
                ))}

                {gateNames.map((gateName) => (
                  <>
                    <GridItem
                      key={`${gateName}-label`}
                      bg={axisBg}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="medium"
                      px={2}
                      textTransform="uppercase"
                      fontSize="sm"
                    >
                      {gateName}
                    </GridItem>
                    {qubits.map((_, qubitIndex) => {
                      const count = matrix[gateName]?.[qubitIndex] ?? 0
                      return (
                        <GridItem key={`${gateName}-${qubitIndex}`}>
                          <Tooltip
                            label={`${gateName} on ${qubits[qubitIndex]?.name || `q${qubitIndex}`}: ${count}`}
                            hasArrow
                            openDelay={150}
                          >
                            <Box
                              w="100%"
                              h="100%"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor={borderColor}
                              bg={getCellColor(count)}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontWeight="semibold"
                            >
                              {count > 0 ? count : '—'}
                            </Box>
                          </Tooltip>
                        </GridItem>
                      )
                    })}
                  </>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </VStack>
    </Box>
  )
}

export default HeatmapPanel

