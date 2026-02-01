import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  GridItem,
  Heading,
  Tag,
  Text,
  Wrap,
  WrapItem,
  useColorModeValue,
} from '@chakra-ui/react'

interface HardwareMetrics {
  circuit_depth: number
  circuit_width: number
  gate_count: Record<string, number>
  t_count: number
  t_depth: number
  cnot_count: number
  single_qubit_gates: number
  two_qubit_gates: number
  multi_qubit_gates: number
  measurement_count: number
  entanglement_ratio?: number | null
  entanglement_depth?: number | null
  quantum_volume?: number | null
  estimated_fidelity?: number | null
}

interface HardwareMetricsPanelProps {
  metrics?: HardwareMetrics | null
}

const HardwareMetricsPanel = ({ metrics }: HardwareMetricsPanelProps) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const labelColor = useColorModeValue('gray.500', 'gray.400')

  if (!metrics) {
    return <Text color="gray.500">Hardware metrics are unavailable. Enable metrics to see details.</Text>
  }

  const gateEntries = Object.entries(metrics.gate_count || {}).sort((a, b) => b[1] - a[1])

  return (
    <Card borderRadius="md" variant="outline" bg={cardBg} borderColor={borderColor}>
      <CardHeader pb={2}>
        <Heading size="sm">Hardware Metrics</Heading>
      </CardHeader>
      <CardBody pt={2}>
        <Grid templateColumns="repeat(auto-fit, minmax(160px, 1fr))" gap={3} mb={4}>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Circuit Depth
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.circuit_depth}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Circuit Width
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.circuit_width}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              T Count
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.t_count}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              T Depth
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.t_depth}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              CNOT Count
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.cnot_count}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Measurements
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.measurement_count}
            </Text>
          </GridItem>
          {metrics.entanglement_depth !== undefined && metrics.entanglement_depth !== null && (
            <GridItem>
              <Text fontSize="xs" color={labelColor}>
                Entanglement Depth
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {metrics.entanglement_depth}
              </Text>
            </GridItem>
          )}
          {metrics.entanglement_ratio !== undefined && metrics.entanglement_ratio !== null && (
            <GridItem>
              <Text fontSize="xs" color={labelColor}>
                Entanglement Ratio
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {(metrics.entanglement_ratio * 100).toFixed(1)}%
              </Text>
            </GridItem>
          )}
          {metrics.quantum_volume !== undefined && metrics.quantum_volume !== null && (
            <GridItem>
              <Text fontSize="xs" color={labelColor}>
                Quantum Volume
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {metrics.quantum_volume}
              </Text>
            </GridItem>
          )}
        </Grid>

        <Grid templateColumns="repeat(auto-fit, minmax(160px, 1fr))" gap={3} mb={4}>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Single-Qubit Gates
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.single_qubit_gates}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Two-Qubit Gates
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.two_qubit_gates}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Multi-Qubit Gates
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.multi_qubit_gates}
            </Text>
          </GridItem>
          {metrics.estimated_fidelity !== undefined && metrics.estimated_fidelity !== null && (
            <GridItem>
              <Text fontSize="xs" color={labelColor}>
                Estimated Fidelity
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {metrics.estimated_fidelity.toFixed(4)}
              </Text>
            </GridItem>
          )}
        </Grid>

        <Divider mb={3} />

        {gateEntries.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            Gate counts are unavailable.
          </Text>
        ) : (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Gate Counts
            </Text>
            <Wrap spacing={2}>
              {gateEntries.map(([gate, count]) => (
                <WrapItem key={gate}>
                  <Tag size="sm" colorScheme="blue">
                    {gate.toUpperCase()}: {count}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}

export default HardwareMetricsPanel
