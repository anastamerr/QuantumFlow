import React, { useEffect, useState, useRef } from "react";
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Heading,
  useColorModeValue,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Image,
  Stack,
  Tag,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux'
import { setActivePanel, selectActivePanel } from '../../store/slices/uiSlice'

interface ProjectIdea {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description?: string;
}

const PROJECT_IDEAS: ProjectIdea[] = [
  // Beginner
  { id: "quantum-randomness", title: "Quantum Random Number Generator", difficulty: "Beginner", description: "Use a single qubit to generate true quantum randomness!" },
  { id: "quantum-music", title: "Quantum Music Generator", difficulty: "Beginner", description: "Map random bits to a C major scale and plays music!." },
  // { id: "grover-visualizer", title: "Grover's Algorithm Visualizer", difficulty: "Beginner", description: "Visualize how Grover amplifies probability." },
  { id: "qft-educational-tool", title: "Quantum Fourier Transform Explorer", difficulty: "Beginner", description: "Step through QFT on few qubits." },
  { id: "quantum-gates-animator", title: "Interactive Quantum Gates Animator", difficulty: "Beginner", description: "See gate effects on qubit states." },
  
  // Intermediate
  { id: "qasm-to-visual", title: "QASM-to-Visualizer Converter", difficulty: "Intermediate", description: "Convert QASM text to a visual circuit." },
  { id: "quantum-teleportation-demo", title: "Quantum Teleportation Tutorial", difficulty: "Intermediate", description: "Interactive teleportation demo." },
 

  // Advanced
  { id: "vqe-molecule", title: "VQE for Small Molecules (H2)", difficulty: "Advanced", description: "Variational approach for H2 energy." },
  { id: "qaoa-optimizer", title: "QAOA for Max-Cut Problems", difficulty: "Advanced", description: "Apply QAOA to combinatorial problems." },
  { id: "error-mitigation-playground", title: "Noise Mitigation Playground", difficulty: "Advanced", description: "Tools to mitigate simulated noise." },
  { id: "quantum-chemistry-gui", title: "Quantum Chemistry Simulation App", difficulty: "Advanced", description: "Visualize simple molecular simulations." },
  { id: "quantum-ml-demos", title: "Quantum Machine Learning Demos", difficulty: "Advanced", description: "Small QML examples and experiments." },
  { id: "multi-backend-runner", title: "Multi-backend Experiment Runner", difficulty: "Advanced", description: "Run experiments across different backends." },
];

const ProjectPanel: React.FC = () => {
  const [selected, setSelected] = useState<ProjectIdea | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const activePanel = useSelector(selectActivePanel)

  const textColor = useColorModeValue("gray.700", "gray.300");

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "green";
      case "Intermediate":
        return "blue";
      case "Advanced":
        return "orange";
      default:
        return "gray";
    }
  };

  const groupedIdeas: Record<string, ProjectIdea[]> = {
    Beginner: PROJECT_IDEAS.filter((i) => i.difficulty === "Beginner"),
    Intermediate: PROJECT_IDEAS.filter((i) => i.difficulty === "Intermediate"),
    Advanced: PROJECT_IDEAS.filter((i) => i.difficulty === "Advanced"),
  };

  const gridCols = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  useEffect(() => {
    // open or close modal based on activePanel in the UI state
    setIsOpen(activePanel === 'projects')
    if (activePanel !== 'projects') {
      setSelected(null)
    }
  }, [activePanel]);

  const openGallery = (idea?: ProjectIdea) => {
    if (idea) setSelected(idea);
    setIsOpen(true);
  };

  const dispatch = useDispatch()
  const closeGallery = () => {
    // return to main circuit view when modal closes
    dispatch(setActivePanel('circuit'))
    setIsOpen(false);
    setSelected(null);
  };

  // Floating draggable panel state (flashcards / steps)
  const [floatingOpen, setFloatingOpen] = useState(false)
  const [floatingProject, setFloatingProject] = useState<ProjectIdea | null>(null)
  const [floatingStep, setFloatingStep] = useState(0)
  const [pos, setPos] = useState({ x: 120, y: 120 })

  const draggingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const openFloating = (idea: ProjectIdea) => {
    // close modal and open floating panel over main workspace
    dispatch(setActivePanel('circuit'))
    setFloatingProject(idea)
    setFloatingStep(0)
    setFloatingOpen(true)
  }

  const closeFloating = () => {
    setFloatingOpen(false)
    setFloatingProject(null)
    setFloatingStep(0)
  }

  // Music playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  // Simulation-provided bits (enabled after backend simulation)
  const [simulationBits, setSimulationBits] = useState<number[] | null>(null)

  const playNotes = async (notes: number[], tempo = 400) => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    const ctx = audioCtxRef.current!
    const now = ctx.currentTime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.value = 0
      osc.connect(gain)
      gain.connect(ctx.destination)
      const start = now + (i * tempo) / 1000
      const end = start + (tempo - 100) / 1000
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.2, start + 0.01)
      gain.gain.linearRampToValueAtTime(0, end)
      osc.start(start)
      osc.stop(end + 0.02)
    })

    // Return a promise that resolves when playback is complete
    const totalMs = notes.length * tempo
    return new Promise<void>((resolve) => setTimeout(() => resolve(), totalMs + 100))
  }

  const playMusic = async () => {
    if (!floatingProject) return
    // prevent concurrent playback
    if (isPlaying) return
    setIsPlaying(true)

    // Build a bitstream: prefer simulation-provided bits (already prepared), otherwise fall back to crypto
    let bits: number[] = []
    if (simulationBits && simulationBits.length > 0) {
      bits = simulationBits
    } else {
      const n = 16
      const bytes = new Uint8Array(Math.ceil(n / 8))
      crypto.getRandomValues(bytes)
      for (let i = 0; i < n; i++) {
        const b = (bytes[Math.floor(i / 8)] >> (i % 8)) & 1
        bits.push(b)
      }
    }

    // Map groups of 3 bits to notes and take first 16 notes
    const scaleFreqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25]
    const notes: number[] = []
    // Ensure we have enough bits for 16 notes (3 bits per note)
    const neededBits = 16 * 3
    while (bits.length < neededBits) {
      bits = bits.concat(bits) // repeat if necessary
    }
    for (let i = 0; i < neededBits; i += 3) {
      const group = (bits[i] || 0) | ((bits[i+1]||0) << 1) | ((bits[i+2]||0) << 2)
      const idx = group % scaleFreqs.length
      notes.push(scaleFreqs[idx])
    }

    await playNotes(notes, 300)
    setIsPlaying(false)
  }

  // Listen for simulation completion events from SimulationPanel
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent
        const mem = ce.detail?.memory

        // Prefer backend-provided per-shot memory (array of bitstrings)
        if (Array.isArray(mem) && mem.length > 0) {
          // Concatenate shot bitstrings into a flat bit array
          let bitsFromMem: number[] = []
          for (const s of mem) {
            if (typeof s !== 'string') continue
            for (let i = 0; i < s.length; i++) {
              bitsFromMem.push(s[i] === '1' ? 1 : 0)
            }
          }
          // Ensure we have enough bits for 16 notes (3 bits per note = 48 bits)
          const needed = 16 * 3
          if (bitsFromMem.length === 0) return
          while (bitsFromMem.length < needed) bitsFromMem = bitsFromMem.concat(bitsFromMem)
          setSimulationBits(bitsFromMem.slice(0, needed))
          return
        }

        // Fallback: sample a single state from probabilities (legacy behavior)
        const probs: Record<string, number> = ce.detail?.probabilities ?? {}
        const states = Object.keys(probs)
        const weights = states.map(s => probs[s] ?? 0)
        const total = weights.reduce((a,b) => a + b, 0)
        if (states.length === 0 || total === 0) return
        const r = Math.random() * total
        let acc = 0
        let chosen = states[0]
        for (let i=0;i<states.length;i++){
          acc += weights[i]
          if (r <= acc) { chosen = states[i]; break }
        }
        // chosen is a bitstring like '0101' (MSB..LSB) — convert to array of bits
        const bits = chosen.split('').map(ch => ch === '1' ? 1 : 0)
        // Expand to needed bits by repeating
        const targetBits = 16 * 3
        const out: number[] = []
        while (out.length < targetBits) out.push(...bits)
        setSimulationBits(out.slice(0, targetBits))
      } catch (err) {
        console.warn('Failed handling simulation complete event', err)
      }
    }

    window.addEventListener('qflow:simulation:complete', handler as EventListener)
    return () => window.removeEventListener('qflow:simulation:complete', handler as EventListener)
  }, [])

  const onDragStart = (e: React.MouseEvent) => {
    draggingRef.current = true
    dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    window.addEventListener('mousemove', onDragging)
    window.addEventListener('mouseup', onDragEnd)
  }

  const onDragging = (e: MouseEvent) => {
    if (!draggingRef.current) return
    setPos({ x: e.clientX - dragOffsetRef.current.x, y: e.clientY - dragOffsetRef.current.y })
  }

  const onDragEnd = () => {
    draggingRef.current = false
    window.removeEventListener('mousemove', onDragging)
    window.removeEventListener('mouseup', onDragEnd)
  }

  // Project-specific steps & code
  const getProjectSteps = (id: string) => {
    if (id === 'quantum-randomness') {
      const code = `# Quantum Random Number Generator (Qiskit)\n# Generates an N-bit random string by preparing N qubits in superposition and measuring them.\n\nfrom qiskit import QuantumCircuit, Aer, execute\n\ndef quantum_random_bits(n):\n    qc = QuantumCircuit(n, n)\n    qc.h(range(n))\n    qc.measure(range(n), range(n))\n    backend = Aer.get_backend('qasm_simulator')\n    job = execute(qc, backend=backend, shots=1)\n    result = job.result()\n    counts = result.get_counts(qc)\n    bitstr = list(counts.keys())[0]  # e.g. '0101'\n    return bitstr\n\n# Example: generate 8 random bits\nif __name__ == '__main__':\n    print(quantum_random_bits(8))\n`;

      return [
        {text: 'Start with a single qubit (Q0). \n Its initial state is |0⟩, meaning it is definitely 0!'},
        {text: 'Drag and drop an H gate (Hadamard) onto Q0.\n Now the qubit is 50% chance 0, 50% chance 1 and is in superposition!.'},
        {text: 'Add a Measure (M) gate to Q0, after the H gate.\n Measurement collapses the superposition randomly into 0 or 1!' },
        {text: 'Press Run!' },
        {text: 'Set Shots = 50 or 100 and run again to see true statistical randomness!' },
        {text: 'To create an n-bit random number, repeat for more qubits!' },
        {text: 'Congratulations! You created a true random number generator!' }


      ]
    }

    if (id === 'quantum-music') {
      const jsCode = `// Map random bits to C major scale and play using WebAudio\nconst scale = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];\n// bits is an array of 0/1 values\nfunction bitsToNotes(bits) {\n  const notes = []\n  for (let i=0;i<bits.length;i+=3) {\n    const g = (bits[i]||0) | ((bits[i+1]||0)<<1) | ((bits[i+2]||0)<<2)\n    notes.push(scale[g % scale.length])\n  }\n  return notes\n}\n`;

      return [
        { text: 'Overview: Generate random bits (quantum or crypto) and map groups to notes in the C major scale to create short musical phrases.' },
        { text: 'Setup: You can use the Quantum Randomness project to provide bits, or use local crypto.getRandomValues for demo.' },
        { text: 'Generate Bits: Prepare N qubits in |+> and measure; each measurement gives random bits. Collect enough bits for your phrase.' },
        { text: 'Map & Play: Group bits (e.g. 3 bits per note) and map to scale degrees. Use WebAudio to play frequencies.', code: jsCode },
        { text: 'Play: Click Play to generate a fresh random phrase and hear it mapped to C major.' },
      ]
    }

    // default placeholder
    return [
      { title: 'Overview', text: 'Step-by-step instructions placeholder.' },
    ]
  }

  return (
    <>
      {/* Modal Gallery only - no intermediate page content */}
      <Modal isOpen={isOpen} onClose={closeGallery} size={useBreakpointValue({ base: 'full', md: '6xl' })} scrollBehavior="inside" isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(3px)" />
        <ModalContent maxH="90vh">
          <ModalHeader bg={useColorModeValue('blue.50', 'blue.900')} borderTopRadius="md">
            <HStack justify="space-between" w="100%">
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold">Project Ideas</Text>
                <Text fontSize="sm" color={textColor}>Browse grouped project ideas and placeholders</Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={6}>
            <Stack spacing={6}>
              {Object.entries(groupedIdeas).map(([difficulty, ideas]) => (
                <Box key={difficulty}>
                  <HStack justify="space-between" mb={4}>
                    <HStack spacing={3}>
                      <Badge colorScheme={getDifficultyColor(difficulty)} fontSize="sm">{difficulty}</Badge>
                      <Text fontWeight="600">{ideas.length} ideas</Text>
                    </HStack>
                  </HStack>

                  <SimpleGrid columns={gridCols} spacing={4}>
                    {ideas.map((idea) => (
                      <Card key={idea.id} borderRadius="md" overflow="hidden" _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }} transition="all 0.15s">
                        <CardHeader p={0}>
                          <Image alt={`${idea.title} placeholder`} src={"/placeholder-image.png"} fallbackSrc={"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'>Image</text></svg>"} objectFit="cover" w="100%" h="120px" />
                        </CardHeader>
                        <CardBody>
                          <HStack justify="space-between" align="start">
                            <Box>
                              <Text fontWeight="600" mb={1}>{idea.title}</Text>
                              <Text fontSize="sm" color={textColor}>{idea.description ?? 'Short description placeholder.'}</Text>
                            </Box>
                            <Tag size="sm" colorScheme={getDifficultyColor(idea.difficulty)}>{idea.difficulty}</Tag>
                          </HStack>
                          <HStack mt={4} spacing={2} justify="flex-end">
                            <Button size="sm" colorScheme="blue" onClick={() => { openFloating(idea); }}>Select</Button>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* Floating draggable flashcard panel */}
      {floatingOpen && floatingProject && (
        <Box
          position="fixed"
          left={`${pos.x}px`}
          top={`${pos.y}px`}
          w={"360px"}
          bg={useColorModeValue('white', 'gray.800')}
          borderRadius="md"
          boxShadow="lg"
          zIndex={2000}
          borderWidth={1}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <HStack
            px={3}
            py={2}
            bg={useColorModeValue('gray.50', 'gray.900')}
            borderTopRadius="md"
            cursor="grab"
            onMouseDown={onDragStart}
          >
            <VStack align="start" spacing={0} flex={1}>
              <Text fontWeight="bold">{floatingProject.title}</Text>
              <Text fontSize="xs">Flashcards</Text>
            </VStack>
            <Button size="sm" onClick={closeFloating}>Close</Button>
          </HStack>

                <Box p={4}>
            {(() => {
              const steps = getProjectSteps(floatingProject.id)
              const step = steps[floatingStep] || { title: '', text: '' }
              return (
                <>
                {/* text settings */}
                  <Text fontSize="sm" mb={3}>{step.text}</Text>
                  {'code' in step && step.code && (
                  <Box as="pre" fontSize="xs" p={2} bg={useColorModeValue('gray.50','gray.900')} borderRadius="md" overflowX="auto" mb={3}>
                    {step.code}
                  </Box>
                )}

                  <HStack mt={3} justify="space-between">
                    <Button size="sm" variant="ghost" isDisabled={floatingStep === 0} onClick={() => setFloatingStep(Math.max(0, floatingStep - 1))}>Back</Button>
                    <Text fontSize="xs">{floatingStep + 1} / {steps.length}</Text>
                    <Button size="sm" colorScheme="blue" isDisabled={floatingStep >= getProjectSteps(floatingProject.id).length - 1} onClick={() => setFloatingStep(Math.min(getProjectSteps(floatingProject.id).length - 1, floatingStep + 1))}>Next</Button>
                  </HStack>
                  {floatingProject.id === 'quantum-music' && (
                    <HStack mt={3} justify="space-between">
                      <Button size="sm" colorScheme="purple" onClick={playMusic} isDisabled={!simulationBits || isPlaying}>
                        {isPlaying ? 'Playing…' : 'Play (after simulation)'}
                      </Button>
                      {!simulationBits && (
                        <Text fontSize="xs" color={useColorModeValue('gray.600','gray.400')}>Run a simulation to enable the Play button</Text>
                      )}
                    </HStack>
                  )}
                </>
              )
            })()}
          </Box>
        </Box>
      )}
</>
  )}
export default ProjectPanel;
