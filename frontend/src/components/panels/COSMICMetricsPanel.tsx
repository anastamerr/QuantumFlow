import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  GridItem,
  Heading,
  HStack,
  Button,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tag,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'

interface FunctionalProcess {
  name: string
  gate_type?: string
  gateType?: string
  entries: number
  exits: number
  reads: number
  writes: number
  cfp: number
}

interface COSMICMetrics {
  approach: string
  entries: number
  exits: number
  reads: number
  writes: number
  total_cfp?: number
  totalCFP?: number
  functional_processes?: FunctionalProcess[]
  functionalProcesses?: FunctionalProcess[]
}

interface COSMICMetricsPanelProps {
  metrics?: COSMICMetrics | null
  comparison?: COSMICMetrics[]
}

const COSMICMetricsPanel = ({ metrics, comparison }: COSMICMetricsPanelProps) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const labelColor = useColorModeValue('gray.500', 'gray.400')

  if (!metrics) {
    return <Text color="gray.500">COSMIC metrics are unavailable. Enable metrics to see details.</Text>
  }

  const processes = metrics.functional_processes ?? metrics.functionalProcesses ?? []
  const totalCFP =
    metrics.total_cfp ?? metrics.totalCFP ?? metrics.entries + metrics.exits + metrics.reads + metrics.writes
  const approachLabel = metrics.approach ? metrics.approach.toUpperCase() : 'UNKNOWN'
  const comparisonRows = (comparison ?? []).filter((item) => item.approach !== metrics.approach)

  const exportMetrics = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let content = ''
    let mime = ''
    const filename = `cosmic-metrics-${timestamp}.${format}`

    if (format === 'json') {
      content = JSON.stringify(
        {
          primary: metrics,
          comparison: comparisonRows,
        },
        null,
        2,
      )
      mime = 'application/json'
    } else {
      const header = ['approach', 'entries', 'exits', 'reads', 'writes', 'total_cfp']
      const rows = [
        metrics,
        ...comparisonRows,
      ].map((item) => [
        item.approach,
        item.entries,
        item.exits,
        item.reads,
        item.writes,
        item.total_cfp ?? item.totalCFP ?? item.entries + item.exits + item.reads + item.writes,
      ])
      content = [header.join(','), ...rows.map((row) => row.join(','))].join('\n')
      mime = 'text/csv'
    }

    const blob = new Blob([content], { type: mime })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card borderRadius="md" variant="outline" bg={cardBg} borderColor={borderColor}>
      <CardHeader pb={2}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <HStack spacing={2}>
            <Heading size="sm">COSMIC Metrics</Heading>
            <Tag size="sm" colorScheme="purple">
              {approachLabel}
            </Tag>
          </HStack>
          <HStack spacing={2}>
            <Button size="xs" variant="outline" onClick={() => exportMetrics('csv')}>
              Export CSV
            </Button>
            <Button size="xs" variant="outline" onClick={() => exportMetrics('json')}>
              Export JSON
            </Button>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        <Grid templateColumns="repeat(auto-fit, minmax(140px, 1fr))" gap={3} mb={4}>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Entries
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.entries}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Exits
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.exits}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Reads
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.reads}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Writes
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {metrics.writes}
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" color={labelColor}>
              Total CFP
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {totalCFP}
            </Text>
          </GridItem>
        </Grid>

        <Divider mb={3} />

        <Box mb={4}>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Data Movement Flow
          </Text>
          <HStack spacing={2} wrap="wrap">
            <Tag size="sm" colorScheme="blue">
              Entry (E): {metrics.entries}
            </Tag>
            <Text fontSize="sm" color={labelColor}>
              →
            </Text>
            <Tag size="sm" colorScheme="purple">
              Read (R): {metrics.reads}
            </Tag>
            <Text fontSize="sm" color={labelColor}>
              →
            </Text>
            <Tag size="sm" colorScheme="green">
              Write (W): {metrics.writes}
            </Tag>
            <Text fontSize="sm" color={labelColor}>
              →
            </Text>
            <Tag size="sm" colorScheme="orange">
              Exit (X): {metrics.exits}
            </Tag>
          </HStack>
        </Box>

        {comparisonRows.length > 0 && (
          <Box mb={4}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Approach Comparison
            </Text>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Approach</Th>
                    <Th isNumeric>E</Th>
                    <Th isNumeric>X</Th>
                    <Th isNumeric>R</Th>
                    <Th isNumeric>W</Th>
                    <Th isNumeric>CFP</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[metrics, ...comparisonRows].map((item) => (
                    <Tr key={item.approach}>
                      <Td>{item.approach}</Td>
                      <Td isNumeric>{item.entries}</Td>
                      <Td isNumeric>{item.exits}</Td>
                      <Td isNumeric>{item.reads}</Td>
                      <Td isNumeric>{item.writes}</Td>
                      <Td isNumeric>
                        {item.total_cfp ?? item.totalCFP ?? item.entries + item.exits + item.reads + item.writes}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        )}

        {processes.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            No functional process breakdown available.
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Process</Th>
                  <Th>Gate</Th>
                  <Th isNumeric>E</Th>
                  <Th isNumeric>X</Th>
                  <Th isNumeric>R</Th>
                  <Th isNumeric>W</Th>
                  <Th isNumeric>CFP</Th>
                </Tr>
              </Thead>
              <Tbody>
                {processes.map((process) => (
                  <Tr key={process.name}>
                    <Td fontWeight="medium">{process.name}</Td>
                    <Td>{process.gate_type ?? process.gateType ?? '-'}</Td>
                    <Td isNumeric>{process.entries}</Td>
                    <Td isNumeric>{process.exits}</Td>
                    <Td isNumeric>{process.reads}</Td>
                    <Td isNumeric>{process.writes}</Td>
                    <Td isNumeric fontWeight="bold">
                      {process.cfp}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}

export default COSMICMetricsPanel
