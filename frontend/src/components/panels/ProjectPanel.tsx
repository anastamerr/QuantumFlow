import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { text } from "d3";

interface ProjectIdea {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description?: string;
  image?: string;
}

const PROJECT_IDEAS: ProjectIdea[] = [
  // Beginner
  { id: "quantum-randomness", title: "Quantum Random Number Generator", difficulty: "Beginner", description: "Use a single qubit to generate true quantum randomness!", image: "/images/project images/dice.png" },
  { id: "quantum-music", title: "Quantum Music Generator", difficulty: "Beginner", description: "Maps random qubits to a C major scale and plays music! (Preferably 2 qubits)", image: "/images/project images/music.png" },
  { id: "quantum-classic-gates", title: "Classical Gates in the Quantum World", difficulty: "Beginner", description: "Discover how to build classical gates using quantum gates!", image: "/images/project images/gates.png" },
  
  // Intermediate
  { id: "quantum-half-adder", title: "Quantum Half Adder", difficulty: "Intermediate", description: "Simulate half adders using quantum gates!", image: "/images/project images/adder.png" },
  { id: "quantum-teleportation-demo", title: "Quantum Teleportation Tutorial", difficulty: "Intermediate", description: "Interactive teleportation demo.", image: "/images/project images/teleport.png" },
  { id: "quantum-comparator", title: "Quantum Comparator", difficulty: "Intermediate", description: "Implement a classical comparator using quantum gates!", image: "/images/project images/scale.png" },

  // Advanced
  { id: "grover-oracle", title: "Grover Oracle Builder", difficulty: "Advanced", description: "Design a marked item oracle with MCX and run Grover.", image: "/images/project images/oracle.png" },
  { id: "phase-kickback-lab", title: "Phase Kickback Lab", difficulty: "Advanced", description: "Explore phase kickback using CZ and superposition states.", image: "/images/project images/quantum.png" },
  { id: "subtractor-2bit", title: "2-bit Subtractor (a−b)", difficulty: "Advanced", description: "Compute difference and borrow using CX/CCX with clean ancillas.", image: "/images/project images/subtract.png" },
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

  const closeFloating = useCallback(() => {
    setFloatingOpen(false)
    setFloatingProject(null)
    setFloatingStep(0)
  }, [])

  useEffect(() => {
    if (activePanel === 'projects' && floatingOpen) {
      closeFloating()
    }
  }, [activePanel, floatingOpen, closeFloating])

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
      return [
        { text: 'Goal: Create a true random number generator using quantum superposition and measurement!' },
        {text: 'Start with a single qubit (Q0). Its initial state is |0⟩, meaning it is definitely 0!'},
        {text: 'Drag and drop an H gate (Hadamard) onto Q0. Now the qubit is 50% chance 0, 50% chance 1 and is in superposition!.'},
        {text: 'Add a Measure (M) gate to Q0, after the H gate.Measurement collapses the superposition randomly into 0 or 1!' },
        {text: 'Press Run!' },
        {text: 'Set Shots = 50 or 100 and run again to see true statistical randomness!' },
        {text: 'To create an n-bit random number, repeat for more qubits!' },
        {text: 'Congratulations! You created a true random number generator!' }
      ]
    }

    if (id === 'quantum-music') {
      return [
        { text: 'Goal: Build a quantum music generator using 2 qubits!' },
        { text: 'Start by adding Hadamard (H) gates to 2 qubits!' },
        { text: 'Add a Measure (M) after the H gates!' },
        { text: 'Click on Simulation from the top bar!' },
        { text: 'Click Run Simulation!' },
        { text: 'Click Play (after simulation) and hear the first few notes!'},
        { text: 'Whenever you want to hear new notes, rerun the simulation and play the first few notes again!' },
        { text: 'Congratulations! You have built a quantum music generator!' }
      ]
    }

    if (id === 'quantum-classic-gates') {
      return [
        { text: 'Goal: Build classical AND, OR, NOT, NAND, NOR, XOR, XNOR gates using quantum gates!' },
        {text: 'Let\'s build an AND gate first! Start by adding 3 qubits to the circuit, A, B and C respectively!' },
        { text: 'To build a classical AND gate, add a Toffoli (CCNOT) gate with A and B as controls and a new qubit C as target!' },
        { text: 'Add Measure (M) gates to all qubits!' },
        { text: 'Click on Simulation from the top bar!' },
        { text: 'Click Run Simulation!' },
        { text: 'Check the states of the measured qubits and verify the AND gate output!' },

        { text: 'To build a classical OR gate, add CNOT gates from A to C and B to C!' },
        { text: 'Rerun the simulation and verify the OR gate output!' },

        { text: 'The easiest of them all: NOT gate! Just add a X gate to a qubit and measure it!' },
        { text: 'Rerun the simulation and verify the NOT gate output!' },

        { text: 'To build XOR gates, start by adding 3 gates, A and B as inputs and C as output!'},
        { text: 'Add CNOT gates from A as control to C and B as control to C!' },
        { text: 'Rerun the simulation and verify the XOR gate output!' },

        { text: 'To build NAND, NOR, or XNOR gates, add an X gate after your previous circuits!' },

        { text: 'Congratulations! You have built classical gates using quantum gates!' }
      ]
    }

    if (id === 'quantum-half-adder') {
      return [
        { text: 'Goal: Add two 1-bit numbers A and B, output Carry and Sum.' },
        { text: 'Start by adding 4 qubits to the circuit, Carry, Sum, A and B respectively (the order matters) !' },
        { text: 'Add Hadamard (H) gates to q2 and q3, A and B respectively!' },
        { text: 'Apply a CNOT gate between q2 (A) and Sum, with A as control!' },
        { text: 'Apply a CNOT gate between q3 (B) and Sum, with B as control!' },
        { text: 'Place a Toffoli CCNOT on q1, which will reflect on the other qubits!' },
        { text: 'Set the control as q2 and q3 (A and B) and the target as q0 (Carry)!' },
        { text: 'Add Measure (M) to all qubits!' },
        { text: 'Click on Simulation from the top bar!' },
        { text: 'Click Run Simulation!' },
        { text: 'Check the states of the measured first qubits and verify the output!' },
        { text: 'Congratulations! You have built a quantum half-adder!' }
      ]
    }

    if (id === 'quantum-comparator') {
      return [
        {text: 'Goal: Compare two 2-bit numbers A1A0 and B1B0, output 1 if A>B else 0.'},
        { text: 'Start by adding 5 qubits to the circuit, A1, A0, B1 and B0, and OUT! Rename the qubits for an easier implementation!' },
        { text: 'Add Hadamard (H) gates to all qubits to create superposition!' },
        { text: 'First, add CNOT gates from A0 to OUT and B0 to OUT!' },
        { text: 'Next, add a Toffoli gate with A1 and B1 as controls and OUT as target!' },
        { text: 'Add Measure (M) gates to all qubits!' },
        { text: 'Click on Simulation from the top bar!' },
        { text: 'Click Run Simulation!' },
        { text: 'Check the states of the measured qubits and verify the comparator output!' },
        { text: 'Congratulations! You have built a quantum comparator!' }

      ]
    }

    if (id === 'grover-oracle') {
      return [
        { text: 'Goal: mark one 3-qubit basis state and amplify it via Grover.' },
        { text: 'Add 3 qubits q2,q1,q0 as the search register and 1 ancilla qA (init 1) for phase kickback.' },
        { text: 'Prepare uniform superposition: apply H to q2,q1,q0. Set ancilla to |-> by applying X then H on qA.' },
        { text: 'Choose the marked state (e.g., 101). Add X to any register qubit that should be 0 in the marked pattern (for 101, add X to q1 only).' },
        { text: 'Implement the phase oracle: apply multi-controlled Z using H on qA, then MCX with controls q2,q1,q0 targeting qA, then H on qA.' },
        { text: 'Unflip the pattern prep X on any qubits you toggled in step 4 (undo the X on q1 for 101).' },
        { text: 'Diffusion operator: apply H to q2,q1,q0; then X to q2,q1,q0; then H on q0, CCX(q2,q1->q0) or MCX for 3 controls; then H on q0; finally X to q2,q1,q0 and H to q2,q1,q0.' },
        { text: 'Measure q2,q1,q0. The marked bitstring should dominate in the Output tab. Increase shots to see amplification clearly.' },
      ]
    }

    if (id === 'phase-kickback-lab') {
      return [
        { text: 'Goal: observe phase kickback using CZ and superposition states.' },
        { text: 'Add two qubits qC (control) and qT (target).' },
        { text: 'Apply H to qC to prepare superposition.' },
        { text: 'Apply X to qT to prepare |1⟩.' },
        { text: 'Apply H to qT to prepare |−⟩.' },
        { text: 'Apply CZ between qC and qT.' },
        { text: 'Apply H to qT to return to Z-basis.' },
        { text: 'Apply H to qC to interfere the kicked phase.' },
        { text: 'Measure qC and qT and inspect outcomes.' },
        { text: 'Replace CZ with H on qT, then CX qC→qT, then H on qT.' },
        { text: 'Insert Z or P(φ) on qT before CZ and observe qC distribution changes.' },
      ]
    }

    if (id === 'subtractor-2bit') {
      return [
        { text: 'Add seven qubits: b2, d1, d0, a1, a0, b1, b0 (top→bottom).' },
        { text: 'Set input bits by applying X to a1,a0,b1,b0 as needed.' },
        { text: 'Ensure ancillas b2,d1,d0 are initialized to |0⟩.' },
        { text: 'Apply CX a0→d0.' },
        { text: 'Apply CX b0→d0.' },
        { text: 'Apply X to a0.' },
        { text: 'Apply CCX a0,b0→d1.' },
        { text: 'Apply X to a0.' },
        { text: 'Apply CX a1→d1.' },
        { text: 'Apply CX b1→d1.' },
        { text: 'Apply X to a1.' },
        { text: 'Apply CCX a1,b1→b2.' },
        { text: 'Apply X to a1.' },
        { text: 'Apply CCX d1,a1→b2.' },
        { text: 'Measure b2,d1,d0,a1,a0,b1,b0.' },
        { text: 'Verify 01−00=01 (b2=0).' },
        { text: 'Verify 10−01=01 (b2=0).' },
        { text: 'Verify 00−01=11 (b2=1).' },
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
                          <Box w="100%" h="120px" p={3} boxSizing="border-box">
                            <Image
                              alt={`${idea.title} image`}
                              src={idea.image || "/images/project images/<add-filename-here>.png"}
                              fallbackSrc={"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'>Image</text></svg>"}
                              objectFit="contain"
                              w="100%"
                              h="100%"
                            />
                          </Box>
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
