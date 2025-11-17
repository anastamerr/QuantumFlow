import React, { useState, useRef } from 'react'
import { Box, Button, VStack, HStack, Textarea, Tag, Avatar, Text, Collapse, IconButton, useToast } from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { aiChat } from '../../lib/aiClient'
import { useDispatch, useSelector } from 'react-redux'
import { addGate, removeGate, updateGate, addQubit, removeQubit, importCircuit, addGates, selectQubits, selectGates, selectMaxPosition } from '../../store/slices/circuitSlice'

interface Message { role: 'user' | 'assistant' | 'system'; content: string }

const AiChatPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingActions, setPendingActions] = useState<any[] | null>(null)
  const [pendingCircuit, setPendingCircuit] = useState<any | null>(null)
  const toast = useToast()
  const dispatch = useDispatch()
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  // grab current circuit state for AI context
  const qubits = useSelector(selectQubits)
  const gates = useSelector(selectGates)
  const maxPosition = useSelector(selectMaxPosition)

  const send = async () => {
    if (!input.trim()) return
    const userMsg: Message = { role: 'user', content: input }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)
    try {
      const resp = await aiChat({
        history: newHistory.map(m => ({ role: m.role, content: m.content })),
        message: input,
        circuit: { qubits, gates, maxPosition }
      })
  // resp expected to include assistant_text and optionally validated actions/qubits/gates
  let assistantText = ''
  if (typeof resp?.assistant_text === 'string') assistantText = resp.assistant_text
  else if (resp?.output?.text) assistantText = Array.isArray(resp.output.text) ? resp.output.text.join('\n') : String(resp.output.text)
  else if (resp?.choices && resp.choices[0]?.message?.content) assistantText = resp.choices[0].message.content
  else assistantText = JSON.stringify(resp)

      const assistantMsg: Message = { role: 'assistant', content: assistantText }
      setMessages(prev => [...prev, assistantMsg])

      // If backend returned validated actions, apply them
      if (Array.isArray(resp?.actions) && resp.actions.length > 0) {
        // don't apply automatically — show a preview and wait for user confirmation
        setPendingActions(resp.actions)
      } else {
        // Fallback: try to extract JSON block from assistantText (legacy)
        const json = extractJsonBlock(assistantText)
        if (json) {
          try {
            const parsed = JSON.parse(json)
            setPendingActions(Array.isArray(parsed.actions) ? parsed.actions : [])
          } catch (e: any) {
            console.error('Failed to parse AI JSON actions', e)
            toast({ title: 'AI action parse failed', description: String(e), status: 'error', duration: 5000, isClosable: true })
          }
        }
      }

      // If backend returned a suggested circuit (qubits + gates), import it
      if (Array.isArray(resp?.qubits) && Array.isArray(resp?.gates)) {
        try {
          const circuit = {
            qubits: resp.qubits,
            gates: resp.gates,
            maxPosition: resp.maxPosition ?? maxPosition,
            name: resp.name ?? 'AI Suggested Circuit',
            description: resp.description ?? ''
          }
          // preview suggested circuit rather than auto-import
          setPendingCircuit(circuit)
        } catch (e: any) {
          console.error('Failed to prepare AI suggested circuit', e)
        }
      }
    } catch (err: any) {
      console.error('AI chat error', err)
      toast({ title: 'AI Error', description: err?.message ?? 'AI request failed', status: 'error', duration: 5000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  const extractJsonBlock = (text: string): string | null => {
    // look for ```json ... ``` or standalone {...}
    const jsonFence = /```json\s*([\s\S]*?)\s*```/i.exec(text)
    if (jsonFence) return jsonFence[1]
    const braceMatch = /({[\s\S]*})/.exec(text)
    return braceMatch ? braceMatch[1] : null
  }

  const applyActions = async (payload: any) => {
    // accept { actions: [ { type: 'add_gate', gate: {...} }, ... ] }
    if (!payload) return
    const actions = Array.isArray(payload.actions) ? payload.actions : []
    const mapGateAlias = (name: string | undefined | null) => {
      if (!name) return name
      const s = String(name).toLowerCase()
      const mapping: Record<string, string> = {
        cx: 'cnot',
        'c-x': 'cnot',
        cnot: 'cnot',
        ccx: 'toffoli',
        ccz: 'toffoli',
        cz: 'cz',
        hadamard: 'h',
        h: 'h',
        x: 'x',
        y: 'y',
        z: 'z',
        rx: 'rx',
        ry: 'ry',
        rz: 'rz',
        measure: 'measure',
        m: 'measure'
      }
      return mapping[s] || s
    }

    const normalizeGate = (g: any) => {
      if (!g || typeof g !== 'object') return g
      const out = { ...g }
      // normalize type alias
      if (out.type) out.type = mapGateAlias(out.type)
      if (out.gate_type) out.type = mapGateAlias(out.gate_type)
      if (!out.type && out.name) out.type = mapGateAlias(out.name)

      // ensure numeric arrays
      if (Array.isArray(out.targets)) out.targets = out.targets.map((x: any) => Number(String(x).replace(/[^0-9]/g, '')))
      if (Array.isArray(out.controls)) out.controls = out.controls.map((x: any) => Number(String(x).replace(/[^0-9]/g, '')))

      // single qubit
      if (out.qubit === undefined || out.qubit === null) {
        if (Array.isArray(out.controls) && out.controls.length > 0) out.qubit = out.controls[0]
        else if (Array.isArray(out.targets) && out.targets.length > 0) out.qubit = out.targets[0]
        else if (out.qubits && Array.isArray(out.qubits) && out.qubits.length > 0) out.qubit = Number(String(out.qubits[0]).replace(/[^0-9]/g, ''))
      }

      // ensure position
      if (out.position === undefined || out.position === null) {
        out.position = typeof out.position === 'number' ? out.position : 0
      } else {
        out.position = Number(out.position)
      }

      // if controls exist but no targets for multi-control gates, try to pick a target from available qubits
      try {
        if ((!out.targets || out.targets.length === 0) && Array.isArray(out.controls) && out.controls.length > 0) {
          const allQubitIds = qubits.map((q: any) => q.id)
          const candidate = allQubitIds.find((id: number) => !out.controls.includes(id))
          if (candidate !== undefined) {
            // set targets to the first non-control qubit so multi-control gates render correctly
            out.targets = [candidate]
            if (out.qubit === undefined || out.qubit === null) out.qubit = out.controls[0]
          }
        }
      } catch (e) {
        // ignore
      }

      // ensure params object
      if (!out.params) out.params = {}

      return out
    }
    for (const a of actions) {
      switch (a.type) {
        case 'add_gate':
          // gate should be Omit<Gate,'id'> - normalize before dispatch
          try {
            const g = normalizeGate(a.gate)
            dispatch(addGate(g))
          } catch (e) {
            console.warn('Failed to normalize/add gate from AI action', e)
          }
          break
        case 'remove_gate':
          if (a.id) dispatch(removeGate(a.id))
          break
        case 'update_gate':
          if (a.id && a.updates) dispatch(updateGate({ id: a.id, updates: a.updates }))
          break
        case 'add_qubit':
          dispatch(addQubit())
          break
        case 'remove_qubit':
          if (typeof a.id === 'number') dispatch(removeQubit(a.id))
          break
        case 'import_circuit':
          if (a.circuit) dispatch(importCircuit(a.circuit))
          break
        case 'add_gates':
          if (Array.isArray(a.gates)) {
            const norm = a.gates.map((gg: any) => normalizeGate(gg))
            dispatch(addGates(norm))
          }
          break
        default:
          console.warn('Unknown AI action', a)
      }
    }
  }

  const confirmApply = async () => {
    if (pendingActions) {
      try {
        await applyActions({ actions: pendingActions })
        toast({ title: 'AI actions applied', status: 'success', duration: 3000, isClosable: true })
      } catch (e: any) {
        toast({ title: 'AI action failed', description: String(e), status: 'error', duration: 5000, isClosable: true })
      } finally {
        setPendingActions(null)
      }
    }
    if (pendingCircuit) {
      try {
        dispatch(importCircuit(pendingCircuit))
        toast({ title: 'AI suggested circuit imported', status: 'info', duration: 3000, isClosable: true })
      } catch (e: any) {
        console.error('Failed to import AI suggested circuit', e)
      } finally {
        setPendingCircuit(null)
      }
    }
  }

  const discardPending = () => {
    setPendingActions(null)
    setPendingCircuit(null)
  }


  return (
    <Box borderWidth={1} borderRadius="md" p={3} mt={4}>
      <HStack justify="space-between">
        <HStack>
          <Avatar name="AI" size="sm" />
          <Text fontWeight="bold">AI Assistant</Text>
          <Tag size="sm" colorScheme="cyan">Beta</Tag>
        </HStack>
        <IconButton aria-label={open ? 'Collapse' : 'Expand'} icon={open ? <ChevronUpIcon /> : <ChevronDownIcon />} size="sm" onClick={() => setOpen(!open)} />
      </HStack>
      <Collapse in={open} animateOpacity>
        <VStack spacing={3} align="stretch" mt={3}>
          <Box maxH="200px" overflowY="auto" p={2} borderWidth={1} borderRadius="md">
            {messages.length === 0 && <Text color="gray.500">Ask the AI to modify the circuit. Example: "Add a Hadamard on qubit 0 and a CNOT between qubit 0 and 1"</Text>}
            {messages.map((m, i) => (
              <Box key={i} mb={2}>
                <Text fontSize="sm" fontWeight={m.role === 'user' ? 'semibold' : 'normal'}>{m.role === 'user' ? 'You' : 'AI'}</Text>
                <Text whiteSpace="pre-wrap">{m.content}</Text>
              </Box>
            ))}
          </Box>

          <HStack>
            <Textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Tell the AI what to do (e.g. add a CNOT between q0 and q1)" size="sm" />
            <Button colorScheme="cyan" onClick={send} isLoading={loading}>Send</Button>
          </HStack>
          {pendingActions && (
            <Box p={2} borderWidth={1} borderRadius="md">
              <Text fontWeight="bold">AI-suggested actions (preview)</Text>
              {pendingActions.map((a, i) => (
                <Box key={i} mt={2}>
                  <Text fontSize="sm">{JSON.stringify(a)}</Text>
                </Box>
              ))}
              <HStack mt={2}>
                <Button colorScheme="green" size="sm" onClick={confirmApply}>Apply</Button>
                <Button size="sm" onClick={discardPending}>Discard</Button>
              </HStack>
            </Box>
          )}
          {pendingCircuit && (
            <Box p={2} borderWidth={1} borderRadius="md" mt={2}>
              <Text fontWeight="bold">AI-suggested circuit (preview)</Text>
              <Text fontSize="sm">Qubits: {JSON.stringify(pendingCircuit.qubits)}</Text>
              <Text fontSize="sm">Gates: {JSON.stringify(pendingCircuit.gates)}</Text>
              <HStack mt={2}>
                <Button colorScheme="green" size="sm" onClick={confirmApply}>Import</Button>
                <Button size="sm" onClick={discardPending}>Discard</Button>
              </HStack>
            </Box>
          )}
        </VStack>
      </Collapse>
    </Box>
  )
}

export default AiChatPanel
