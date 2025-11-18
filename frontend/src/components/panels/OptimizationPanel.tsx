import React, { useMemo, useState } from 'react'
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Button,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useColorModeValue,
  useToast,
  Select,
  FormControl,
  FormLabel,
  Badge,
  Divider,
  Flex,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { addGates, selectGates } from '../../store/slices/circuitSlice'
import { getApiBaseUrl } from '../../lib/quantumApi'
import FullViewToggle from '../common/FullViewToggle'

// Lightweight QAOA optimization workspace (Beta).
//
// All heavy QUBO/QAOA math runs on the Python backend using Qiskit. The
// frontend is responsible for:
//   * Building problem instances (MaxCut graph or 0/1 Knapsack).
//   * Sending them to /api/v1/qaoa/optimize.
//   * Visualizing the returned best bitstring and QAOA circuit gates on the
//     existing canvas.
//
// Bitstrings coming back from the backend are already normalized so that
// bit index 0 corresponds to variable / qubit 0 and is shown as the
// left-most character. Helper functions below assume this convention.

const MAX_GRAPH_NODES = 10

interface Node {
  id: number
}

interface MaxCutEdge {
  u: number
  v: number
  weight?: number
}

interface KnapsackItem {
  value: number
  weight: number
}

const OptimizationPanel: React.FC = () => {
  const dispatch = useDispatch()
  const existingGates = useSelector(selectGates)
  const toast = useToast()

  const [activeProblem, setActiveProblem] = useState<'maxcut' | 'knapsack'>('maxcut')

  // MaxCut state
  const [nodes, setNodes] = useState<Node[]>([{ id: 0 }, { id: 1 }])
  const [edges, setEdges] = useState<MaxCutEdge[]>([{ u: 0, v: 1, weight: 1 }])

  // Knapsack state
  const [items, setItems] = useState<KnapsackItem[]>([
    { value: 5, weight: 2 },
    { value: 3, weight: 1 },
  ])
  const [capacity, setCapacity] = useState<number>(3)

  const [shots, setShots] = useState<number>(512)
  const [depth, setDepth] = useState<number>(1)
  const [isRunning, setIsRunning] = useState(false)
  const [bestBitstring, setBestBitstring] = useState<string | null>(null)
  const [bestEnergy, setBestEnergy] = useState<number | null>(null)

  const panelBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const accentBg = useColorModeValue('blue.50', 'blue.900')

  const numVariables = useMemo(() => {
    if (activeProblem === 'maxcut') {
      return nodes.length
    }
    return items.length
  }, [activeProblem, nodes.length, items.length])

  const addNode = () => {
    if (nodes.length >= MAX_GRAPH_NODES) return
    const nextId = nodes.length === 0 ? 0 : Math.max(...nodes.map(n => n.id)) + 1
    setNodes([...nodes, { id: nextId }])
  }

  const removeLastNode = () => {
    if (nodes.length <= 2) return
    const removed = nodes[nodes.length - 1]
    setNodes(nodes.slice(0, -1))
    setEdges(edges.filter(e => e.u !== removed.id && e.v !== removed.id))
  }

  const addEdge = () => {
    if (nodes.length < 2) return
    const u = nodes[0].id
    const v = nodes[1].id
    if (u === v) return
    setEdges([...edges, { u, v, weight: 1 }])
  }

  const updateEdge = (index: number, field: keyof MaxCutEdge, value: number) => {
    const next = [...edges]
    next[index] = { ...next[index], [field]: value }
    setEdges(next)
  }

  const removeEdge = (index: number) => {
    const next = [...edges]
    next.splice(index, 1)
    setEdges(next)
  }

  const addItem = () => {
    setItems([...items, { value: 1, weight: 1 }])
  }

  const updateItem = (index: number, field: keyof KnapsackItem, value: number) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  const removeItem = (index: number) => {
    const next = [...items]
    next.splice(index, 1)
    setItems(next)
  }

  const suggestKnapsack = () => {
    // Simple suggestion: generate a small random instance
    const n = 4
    const generated: KnapsackItem[] = []
    for (let i = 0; i < n; i++) {
      const value = 2 + Math.floor(Math.random() * 8)
      const weight = 1 + Math.floor(Math.random() * 5)
      generated.push({ value, weight })
    }
    const totalWeight = generated.reduce((acc, it) => acc + it.weight, 0)
    setItems(generated)
    setCapacity(Math.max(2, Math.floor(totalWeight * 0.6)))
  }

  const layoutNodes = useMemo(() => {
    const n = nodes.length
    const radius = 120
    const centerX = 150
    const centerY = 150
    const positions: Record<number, { x: number; y: number }> = {}
    nodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / Math.max(1, n)
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
    })
    return positions
  }, [nodes])

  // For MaxCut: treat bit i of the best bitstring as membership of node i in one partition.
  const isNodeSelected = (nodeId: number): boolean => {
    if (!bestBitstring) return false
    const idx = nodes.findIndex(n => n.id === nodeId)
    if (idx < 0 || idx >= bestBitstring.length) return false
    return bestBitstring[idx] === '1'
  }

  // For Knapsack: bit i indicates whether item i is in the chosen subset.
  const isItemSelected = (index: number): boolean => {
    if (!bestBitstring) return false
    if (index < 0 || index >= bestBitstring.length) return false
    return bestBitstring[index] === '1'
  }

  const handleRunOptimization = async () => {
    try {
      if (numVariables === 0) {
        toast({
          title: 'No variables',
          description: 'Define a graph or knapsack instance first.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      setIsRunning(true)
      setBestBitstring(null)
      setBestEnergy(null)

  // Build problem payload for backend QAOA endpoint.
  // All QUBO and QAOA computations happen server-side.
      const apiBase = getApiBaseUrl()
      const payload: any = {
        problem_type: activeProblem,
        p: depth,
        shots,
      }

      if (activeProblem === 'maxcut') {
        payload.edges = edges.map(e => ({ u: e.u, v: e.v, weight: e.weight ?? 1 }))
      } else {
        payload.items = items.map(it => ({ value: it.value, weight: it.weight }))
        payload.capacity = capacity
      }

      const resp = await fetch(`${apiBase}/api/v1/qaoa/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(text || 'Backend QAOA request failed')
      }

      const data = await resp.json()

      // Merge backend QAOA gates into canvas.
      //
      // The backend returns a minimal gate list (type, qubit, position,
      // params, targets, controls) measured in its own time steps. We shift
      // those positions so they appear *after* the user's existing circuit
      // when rendered on the canvas.
      if (Array.isArray(data.gates)) {
        // Compute starting position after existing gates
        const maxPos = existingGates.reduce((acc, g) => (g.position ?? 0) > acc ? (g.position ?? 0) : acc, 0)
        const normalized = data.gates.map((g: any, idx: number) => ({
          type: g.type,
          qubit: g.qubit ?? 0,
          position: typeof g.position === 'number' ? g.position + maxPos + 1 : maxPos + 1 + idx,
          params: g.params ?? {},
          targets: g.targets ?? [],
          controls: g.controls ?? [],
        }))
        dispatch(addGates([...existingGates, ...normalized]))
      }

  // Update UI with backend results (best logical bitstring and QUBO energy).
      setBestBitstring(data.best_bitstring)
      setBestEnergy(data.best_energy)

      toast({
        title: 'Optimization complete',
        description: `Best bitstring ${data.best_bitstring} with energy ${data.best_energy.toFixed(3)}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    } catch (err: any) {
      console.error('Optimization error', err)
      toast({
        title: 'Optimization failed',
        description: err?.message ?? 'Unexpected error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const totalKnapsackValue = useMemo(
    () => items.reduce((acc, it, idx) => (isItemSelected(idx) ? acc + it.value : acc), 0),
    [items, bestBitstring],
  )
  const totalKnapsackWeight = useMemo(
    () => items.reduce((acc, it, idx) => (isItemSelected(idx) ? acc + it.weight : acc), 0),
    [items, bestBitstring],
  )

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <HStack justify="space-between" mb={3}>
        <Heading size="md">
          Optimization Workspace <Badge ml={2} colorScheme="cyan">Beta</Badge>
        </Heading>
        <HStack spacing={2}>
          <FullViewToggle />
          <Select
            size="sm"
            value={activeProblem}
            onChange={e => setActiveProblem(e.target.value as 'maxcut' | 'knapsack')}
            width="150px"
          >
            <option value="maxcut">MaxCut (Graph)</option>
            <option value="knapsack">Knapsack</option>
          </Select>
        </HStack>
      </HStack>

      <Box
        mb={4}
        p={3}
        borderRadius="md"
        bg={accentBg}
        borderWidth={1}
        borderColor={useColorModeValue('blue.200', 'blue.700')}
      >
        <HStack justify="space-between" align="flex-start">
          <Box>
            <Text fontSize="sm" fontWeight="medium">QAOA Settings</Text>
            <HStack spacing={4} mt={2}>
              <FormControl maxW="140px">
                <FormLabel fontSize="xs" mb={1}>Depth p</FormLabel>
                <NumberInput size="sm" min={1} max={3} value={depth} onChange={(_, v) => setDepth(v || 1)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl maxW="160px">
                <FormLabel fontSize="xs" mb={1}>Shots</FormLabel>
                <NumberInput size="sm" min={128} max={8192} step={128} value={shots} onChange={(_, v) => setShots(v || 512)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>
          </Box>
          <Box textAlign="right">
            <Button
              colorScheme="orange"
              size="sm"
              isLoading={isRunning}
              loadingText="Running"
              onClick={handleRunOptimization}
              isDisabled={numVariables === 0}
            >
              Run QAOA Optimization
            </Button>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Generates a QAOA circuit and runs it via the backend simulator.
            </Text>
          </Box>
        </HStack>
      </Box>

      <Tabs
        variant="soft-rounded"
        colorScheme="orange"
        flex={1}
        display="flex"
        flexDirection="column"
        index={activeProblem === 'maxcut' ? 0 : 1}
        onChange={idx => setActiveProblem(idx === 0 ? 'maxcut' : 'knapsack')}
      >
        <TabList>
          <Tab
            _selected={{ color: 'white', bg: 'orange.500', boxShadow: 'md' }}
            fontWeight="medium"
          >
            MaxCut Graph
          </Tab>
          <Tab
            _selected={{ color: 'white', bg: 'orange.500', boxShadow: 'md' }}
            fontWeight="medium"
          >
            Knapsack
          </Tab>
        </TabList>

        <TabPanels flex={1} display="flex">
          <TabPanel p={0} pt={3} flex={1}>
            <Box
              bg={panelBg}
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="lg"
              p={4}
              h="100%"
              display="flex"
              flexDirection="column"
            >
              <HStack justify="space-between" mb={3}>
                <Heading size="sm">Graph (Max 10 nodes)</Heading>
                <HStack spacing={2}>
                  <Button size="xs" onClick={addNode} isDisabled={nodes.length >= MAX_GRAPH_NODES}>
                    Add Node
                  </Button>
                  <Button size="xs" onClick={removeLastNode} isDisabled={nodes.length <= 2}>
                    Remove Node
                  </Button>
                  <Button size="xs" onClick={addEdge} isDisabled={nodes.length < 2}>
                    Quick Edge
                  </Button>
                </HStack>
              </HStack>

              <Flex gap={4} flex={1} direction={{ base: 'column', md: 'row' }}>
                <Box flex={1} borderWidth={1} borderColor={borderColor} borderRadius="md" p={2}>
                  <svg width="100%" height="320" viewBox="0 0 300 300">
                    {edges.map((e, idx) => {
                      const pu = layoutNodes[e.u]
                      const pv = layoutNodes[e.v]
                      if (!pu || !pv) return null
                      const midX = (pu.x + pv.x) / 2
                      const midY = (pu.y + pv.y) / 2
                      return (
                        <g key={idx}>
                          <line
                            x1={pu.x}
                            y1={pu.y}
                            x2={pv.x}
                            y2={pv.y}
                            stroke="#718096"
                            strokeWidth={1.5}
                          />
                          <text x={midX} y={midY} fill="#2D3748" fontSize="10" textAnchor="middle">
                            {e.weight ?? 1}
                          </text>
                        </g>
                      )
                    })}
                    {nodes.map(node => {
                      const pos = layoutNodes[node.id]
                      if (!pos) return null
                      const selected = isNodeSelected(node.id)
                      return (
                        <g key={node.id}>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={selected ? 14 : 12}
                            fill={selected ? '#ED8936' : '#3182CE'}
                            stroke="#1A202C"
                            strokeWidth={1}
                          />
                          <text
                            x={pos.x}
                            y={pos.y + 4}
                            textAnchor="middle"
                            fontSize="12"
                            fill="white"
                          >
                            {node.id}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </Box>

                <Box flex={1} borderWidth={1} borderColor={borderColor} borderRadius="md" p={3}>
                  <Heading size="sm" mb={2}>Edges</Heading>
                  {edges.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">No edges. Add edges to define the MaxCut instance.</Text>
                  ) : (
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>u</Th>
                          <Th>v</Th>
                          <Th>Weight</Th>
                          <Th></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {edges.map((e, idx) => (
                          <Tr key={idx}>
                            <Td>
                              <NumberInput
                                size="xs"
                                min={0}
                                max={nodes.length - 1}
                                value={e.u}
                                onChange={(_, v) => updateEdge(idx, 'u', v)}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <NumberInput
                                size="xs"
                                min={0}
                                max={nodes.length - 1}
                                value={e.v}
                                onChange={(_, v) => updateEdge(idx, 'v', v)}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <NumberInput
                                size="xs"
                                min={-10}
                                max={10}
                                step={0.5}
                                value={e.weight ?? 1}
                                onChange={(_, v) => updateEdge(idx, 'weight', v)}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <IconButton
                                aria-label="Remove edge"
                                icon={<DeleteIcon />}
                                size="xs"
                                variant="ghost"
                                onClick={() => removeEdge(idx)}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}

                  {bestBitstring && (
                    <Box mt={3} p={2} borderRadius="md" bg={useColorModeValue('green.50', 'green.900')}>
                      <Text fontSize="sm">
                        Best partition bitstring: <Badge colorScheme="green">{bestBitstring}</Badge>
                      </Text>
                      {bestEnergy !== null && (
                        <Text fontSize="xs" color="gray.600">QUBO energy: {bestEnergy.toFixed(3)}</Text>
                      )}
                    </Box>
                  )}
                </Box>
              </Flex>
            </Box>
          </TabPanel>

          <TabPanel p={0} pt={3} flex={1}>
            <Box
              bg={panelBg}
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="lg"
              p={4}
              h="100%"
              display="flex"
              flexDirection="column"
            >
              <HStack justify="space-between" mb={3}>
                <Heading size="sm">0/1 Knapsack</Heading>
                <HStack spacing={2}>
                  <Button size="xs" onClick={suggestKnapsack}>
                    Suggest Instance
                  </Button>
                  <Button size="xs" onClick={addItem}>
                    Add Item
                  </Button>
                </HStack>
              </HStack>

              <Flex gap={4} flex={1} direction={{ base: 'column', md: 'row' }}>
                <Box flex={2}>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>Value</Th>
                        <Th>Weight</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((item, idx) => (
                        <Tr key={idx} bg={isItemSelected(idx) ? useColorModeValue('green.50', 'green.900') : undefined}>
                          <Td>#{idx}</Td>
                          <Td>
                            <NumberInput
                              size="xs"
                              min={0}
                              max={100}
                              value={item.value}
                              onChange={(_, v) => updateItem(idx, 'value', v)}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </Td>
                          <Td>
                            <NumberInput
                              size="xs"
                              min={0}
                              max={100}
                              value={item.weight}
                              onChange={(_, v) => updateItem(idx, 'weight', v)}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Remove item"
                              icon={<DeleteIcon />}
                              size="xs"
                              variant="ghost"
                              onClick={() => removeItem(idx)}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  <HStack mt={3} spacing={4}>
                    <FormControl maxW="200px">
                      <FormLabel fontSize="xs" mb={1}>Capacity</FormLabel>
                      <NumberInput
                        size="sm"
                        min={0}
                        max={500}
                        value={capacity}
                        onChange={(_, v) => setCapacity(v || 0)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </HStack>
                </Box>

                <Box flex={1} borderWidth={1} borderColor={borderColor} borderRadius="md" p={3}>
                  <Heading size="sm" mb={2}>Best Solution</Heading>
                  {bestBitstring ? (
                    <VStack align="stretch" spacing={2}>
                      <Text fontSize="sm">
                        Bitstring: <Badge colorScheme="green">{bestBitstring}</Badge>
                      </Text>
                      <Text fontSize="sm">Total value: {totalKnapsackValue}</Text>
                      <Text fontSize="sm">Total weight: {totalKnapsackWeight} / {capacity}</Text>
                      {bestEnergy !== null && (
                        <Text fontSize="xs" color="gray.600">QUBO energy: {bestEnergy.toFixed(3)}</Text>
                      )}
                      {totalKnapsackWeight > capacity && (
                        <Text fontSize="xs" color="red.500">
                          Constraint violated: weight exceeds capacity.
                        </Text>
                      )}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      Run QAOA to see the recommended subset of items.
                    </Text>
                  )}

                  <Divider my={3} />
                  <HStack align="flex-start" spacing={2}>
                    <InfoIcon boxSize={4} color="gray.500" />
                    <Text fontSize="xs" color="gray.500">
                      The knapsack QUBO encodes the objective and capacity constraint. The best bitstring
                      corresponds to selecting items (1 = selected, 0 = not selected).
                    </Text>
                  </HStack>
                </Box>
              </Flex>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default OptimizationPanel
