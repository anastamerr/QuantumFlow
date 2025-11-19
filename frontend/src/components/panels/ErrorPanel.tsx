import { 
  Box, VStack, Text, Alert, AlertIcon, AlertTitle, 
  AlertDescription, Button, useColorModeValue, Icon 
} from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { useSelector, useDispatch } from 'react-redux'
import { selectGates, selectQubits } from '../../store/slices/circuitSlice'
import { selectGate as uiSelectGate } from '../../store/slices/uiSlice'
import { useMemo } from 'react'

export default function ErrorPanel() {
  const dispatch = useDispatch()
  const gates = useSelector(selectGates)
  const qubits = useSelector(selectQubits)

  // --- VALIDATION LOGIC ---
  const errors = useMemo(() => {
    const issues: any[] = []

    // 1. EMPTY CHECK
    if (gates.length === 0) {
      issues.push({
        id: 'empty-circuit',
        severity: 'info',
        title: 'Circuit is empty',
        desc: 'Drag gates from the left sidebar to begin.',
        action: null
      })
      return issues
    }

    const qubitExists = (id: number) => qubits.some(q => q.id === id)

    gates.forEach(gate => {
      const gType = gate.type.toLowerCase()

      // CHECK 1: PARAMETERS
      const validateParam = (paramNames: string[], label: string) => {
        if (!gate.params) return false
        const foundKey = paramNames.find(k => gate.params![k] !== undefined && gate.params![k] !== "")
        if (!foundKey) return false
        const val = Number(gate.params[foundKey])
        if (isNaN(val)) return false
        if (Math.abs(val) < 0.0001) return false 
        return true
      }

      if (['rx', 'ry'].includes(gType)) {
        if (!validateParam(['theta', 'angle', 'value', 'rad'], 'Angle')) {
          issues.push({
            id: `param-missing-${gate.id}`,
            severity: 'error',
            title: `Invalid Angle`,
            desc: `${gate.type.toUpperCase()} needs a valid angle (non-zero).`,
            gateId: gate.id
          })
        }
      }

      if (['rz', 'p', 'phase', 'u1'].includes(gType)) {
        if (!validateParam(['phi', 'lambda', 'angle'], 'Phase')) {
          issues.push({
            id: `phase-missing-${gate.id}`,
            severity: 'error',
            title: `Invalid Phase`,
            desc: `${gate.type.toUpperCase()} needs a valid phase (non-zero).`,
            gateId: gate.id
          })
        }
      }

      // CHECK 2: GHOST QUBITS
      if (!qubitExists(gate.qubit)) {
         issues.push({
           id: `ghost-main-${gate.id}`,
           severity: 'error',
           title: 'Detached Gate',
           desc: `Gate attached to missing qubit q${gate.qubit}.`,
           gateId: gate.id
         })
      }

      const involvedQubits = [gate.qubit]

      if (gate.targets) {
        gate.targets.forEach(t => {
          involvedQubits.push(t)
          if (!qubitExists(t)) {
            issues.push({
              id: `ghost-target-${gate.id}-${t}`,
              severity: 'error',
              title: 'Missing Target',
              desc: `Target qubit q${t} deleted.`,
              gateId: gate.id
            })
          }
        })
      }

      if (gate.controls) {
        gate.controls.forEach(c => {
          involvedQubits.push(c)
          if (!qubitExists(c)) {
            issues.push({
              id: `ghost-control-${gate.id}-${c}`,
              severity: 'error',
              title: 'Missing Control',
              desc: `Control qubit q${c} deleted.`,
              gateId: gate.id
            })
          }
        })
      }

      // CHECK 3: LOOPS
      const uniqueQubits = new Set(involvedQubits)
      if (uniqueQubits.size !== involvedQubits.length) {
        issues.push({
          id: `overlap-${gate.id}`,
          severity: 'error',
          title: 'Qubit Loop',
          desc: `${gate.type.toUpperCase()} uses the same qubit twice.`,
          gateId: gate.id
        })
      }
    })

    // --- CHECK 4: UNUSED QUBITS (Softer Tone) ---
    qubits.forEach(q => {
      const isUsed = gates.some(g => 
        g.qubit === q.id || 
        g.targets?.includes(q.id) || 
        g.controls?.includes(q.id)
      )
      
      if (!isUsed && gates.length > 0) {
        issues.push({
          id: `unused-q${q.id}`,
          severity: 'warning', // Orange (Advisory)
          title: `Idle Qubit (q${q.id})`,
          // Friendlier message
          desc: `This qubit has no gates. Consider removing it to improve simulation speed.`,
          gateId: undefined
        })
      }
    })

    return issues
  }, [gates, qubits])

  const handleFixClick = (gateId: string | undefined) => {
    if (gateId) dispatch(uiSelectGate(gateId))
  }

  return (
    <VStack align="stretch" spacing={3} maxH="300px" overflowY="auto">
      <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={1}>
        Circuit Validation
      </Text>
      
      {errors.length === 0 ? (
        <Box 
          p={4} 
          border="1px dashed" 
          borderColor="green.300" 
          bg={useColorModeValue('green.50', 'rgba(72, 187, 120, 0.1)')}
          borderRadius="md" 
          textAlign="center"
        >
          <Icon as={CheckCircleIcon} color="green.400" boxSize={6} mb={2} />
          <Text fontSize="sm" fontWeight="bold" color="green.600">All Systems Go</Text>
          <Text fontSize="xs" color="green.500">No logic errors detected.</Text>
        </Box>
      ) : (
        errors.map((err) => (
          <Alert 
            key={err.id} 
            status={err.severity} 
            variant="left-accent" 
            borderRadius="md"
            size="sm"
            py={2}
          >
            <AlertIcon boxSize={4} />
            <Box flex="1">
              <AlertTitle fontSize="xs">{err.title}</AlertTitle>
              <AlertDescription fontSize="xs" display="block">
                {err.desc}
              </AlertDescription>
            </Box>
            {err.gateId && (
              <Button 
                size="xs" 
                colorScheme="red"
                variant="ghost"
                onClick={() => handleFixClick(err.gateId)}
              >
                Locate
              </Button>
            )}
          </Alert>
        ))
      )}
    </VStack>
  )
}