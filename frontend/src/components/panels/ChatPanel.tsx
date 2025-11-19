import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Spinner,
  useColorModeValue,
  Heading,
  Divider,
  useToast,
  Text,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
} from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { useDispatch } from "react-redux"
import {
  addQubit,
  removeQubit,
  addGate,
  updateGate,
  removeGate,
  addGates,
} from "@/store/slices/circuitSlice"

interface Message {
  sender: "user" | "bot"
  text: string
  actions?: any[] // optional parsed actions suggested by bot
}

interface ApiResponse {
  answer: string
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bgUser = useColorModeValue("blue.100", "blue.900")
  const bgBot = useColorModeValue("gray.100", "gray.700")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const toast = useToast()

  // Confirmation dialog state for destructive actions
  const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement | null>(null)
  const [pendingActions, setPendingActions] = useState<any[] | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Try to extract JSON actions from bot response.
  const extractActions = (text: string): any[] | undefined => {
    try {
      // First look for a ```json ... ``` block
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonSource = codeBlockMatch ? codeBlockMatch[1] : null
      if (jsonSource) {
        const parsed = JSON.parse(jsonSource)
        if (Array.isArray(parsed)) return parsed
        if (parsed && typeof parsed === "object") return [parsed]
      }

      // Otherwise try to find the first {...} or [...] substring and parse it
      const braceMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
      if (braceMatch) {
        const parsed = JSON.parse(braceMatch[0])
        return Array.isArray(parsed) ? parsed : [parsed]
      }
    } catch (err) {
      // ignore parse errors
      return undefined
    }
    return undefined
  }

  // Determine if actions include destructive operations that should be confirmed
  const isDestructive = (actions: any[]) => {
    const destructiveTypes = new Set(["removeQubit", "removeGate", "clearCircuit"])
    return actions.some((a) => a && a.type && destructiveTypes.has(a.type))
  }

  // Apply parsed actions safely by mapping them to Redux actions
  const applyActions = (actions: any[]) => {
    for (const a of actions) {
      if (!a || typeof a !== "object" || !a.type) continue
      const type = a.type
      const payload = a.payload ?? {}

      try {
        switch (type) {
          case "addQubit":
            dispatch(addQubit())
            break
          case "removeQubit":
            if (typeof payload.index === "number") {
              dispatch(removeQubit(payload.index))
            } else if (typeof payload.id === "number") {
              dispatch(removeQubit(payload.id))
            }
            break
          case "addGate":
            // Expect payload to be gate object without id
            dispatch(addGate(payload))
            break
          case "addGates":
            if (Array.isArray(payload)) {
              dispatch(addGates(payload))
            }
            break
          case "updateGate":
            if (payload.id) {
              dispatch(updateGate({ id: payload.id, updates: payload.updates || {} }))
            }
            break
          case "removeGate":
            if (payload.id) {
              dispatch(removeGate(payload.id))
            }
            break
          case "clearCircuit":
            // map to remove all gates + reset qubits: reuse available action by dispatching clearCircuit via window event or custom action if available
            // If you have clearCircuit action in slice, you can import and dispatch it here.
            // For now, show a toast (frontend state must include clearCircuit action to actually do it).
            // dispatch(clearCircuit()) // uncomment if clearCircuit is exported
            break
          default:
            toast({
              title: "Unknown action",
              description: `Bot suggested unknown action: ${type}`,
              status: "warning",
              duration: 3000,
            })
        }
      } catch (err) {
        console.error("Failed applying action", a, err)
        toast({
          title: "Action failed",
          description: `Failed to apply action ${type}: ${(err as Error).message}`,
          status: "error",
          duration: 3000,
        })
      }
    }

    toast({
      title: "Actions applied",
      description: "Suggested actions were applied to the circuit.",
      status: "success",
      duration: 2500,
    })
  }

  // Called when user confirms applying pendingActions
  const confirmAndApplyPending = () => {
    if (!pendingActions) {
      closeConfirm()
      return
    }
    applyActions(pendingActions)
    setPendingActions(null)
    closeConfirm()
  }

  // Support simple slash commands locally for quick edits
  const handleSlashCommand = (cmd: string): boolean => {
    const parts = cmd.trim().split(/\s+/)
    const base = parts[0].toLowerCase()

    try {
      if (base === "/addq" || base === "/addqubit") {
        dispatch(addQubit())
        setMessages((m) => [...m, { sender: "bot", text: "Added a qubit." }])
        return true
      }

      if (base === "/removeq" || base === "/removequbit") {
        const idx = parts[1] ? Number(parts[1]) : undefined
        if (typeof idx === "number" && !Number.isNaN(idx)) {
          dispatch(removeQubit(idx))
          setMessages((m) => [...m, { sender: "bot", text: `Removed qubit ${idx}.` }])
          return true
        } else {
          setMessages((m) => [...m, { sender: "bot", text: "Usage: /removeq <index>" }])
          return true
        }
      }

      if (base === "/addgate") {
        // Format: /addgate type qubit position key=val,...
        const type = parts[1]
        const qubit = parts[2] ? Number(parts[2]) : 0
        const position = parts[3] ? Number(parts[3]) : 0
        const paramsParts = parts.slice(4)
        const params: any = {}
        paramsParts.forEach((p) => {
          const [k, v] = p.split("=")
          if (!k) return
          const num = Number(v)
          params[k] = Number.isNaN(num) ? v : num
        })
        dispatch(
          addGate({
            type,
            qubit,
            position,
            params,
          })
        )
        setMessages((m) => [...m, { sender: "bot", text: `Added gate ${type} @ q${qubit} pos ${position}` }])
        return true
      }

      if (base === "/removegate") {
        const id = parts[1]
        if (id) {
          dispatch(removeGate(id))
          setMessages((m) => [...m, { sender: "bot", text: `Removed gate ${id}` }])
        } else {
          setMessages((m) => [...m, { sender: "bot", text: "Usage: /removegate <gate-id>" }])
        }
        return true
      }

      if (base === "/updategate") {
        // /updategate <id> key=val ...
        const id = parts[1]
        if (!id) {
          setMessages((m) => [...m, { sender: "bot", text: "Usage: /updategate <id> key=val ..." }])
          return true
        }
        const updates: any = {}
        parts.slice(2).forEach((p) => {
          const [k, v] = p.split("=")
          if (!k) return
          const num = Number(v)
          updates[k] = Number.isNaN(num) ? v : num
        })
        dispatch(updateGate({ id, updates }))
        setMessages((m) => [...m, { sender: "bot", text: `Updated gate ${id}` }])
        return true
      }
    } catch (err) {
      console.error("Slash command error", err)
      setMessages((m) => [...m, { sender: "bot", text: `Command failed: ${(err as Error).message}` }])
      return true
    }

    return false
  }

  // Send to the backend LLM ask endpoint for conversational answer
  const sendMessage = async () => {
    if (!input.trim()) return

    // If user typed a slash-command, handle locally and don't call AI
    if (input.trim().startsWith("/")) {
      const cmd = input.trim()
      setMessages((prev) => [...prev, { sender: "user", text: cmd }])
      setInput("")
      const handled = handleSlashCommand(cmd)
      if (!handled) {
        setMessages((prev) => [...prev, { sender: "bot", text: "Unknown command." }])
      }
      return
    }

    setIsLoading(true)

    // Add user message
    const userMsg: Message = { sender: "user", text: input }
    setMessages((prev) => [...prev, userMsg])
    const question = input
    setInput("")

    try {
      // Send to backend AI chat endpoint for textual answer
      const response = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/ask`,
        { question }
      )

      const answerText = response.data.answer ?? "No response."

      // Try to extract suggested actions (JSON) from the textual answer
      const actions = extractActions(answerText)

      const botMsg: Message = { sender: "bot", text: answerText, actions }
      setMessages((prev) => [...prev, botMsg])
    } catch (error) {
      console.error("Error:", error)
      const errorMsg: Message = {
        sender: "bot",
        text: "Error connecting to AI. Make sure backend is running and GEMINI_API_KEY is set.",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Call backend interpret endpoint to get a reliable structured action list
  const interpretActions = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    setMessages((prev) => [...prev, { sender: "user", text: input }])
    const question = input
    setInput("")

    try {
      const resp = await axios.post<{ actions: any[] }>(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/v1/interpret-actions`,
        { question }
      )

      const actions = resp.data.actions ?? []
      const pretty = JSON.stringify(actions, null, 2)
      const botMsg: Message = {
        sender: "bot",
        text: `Interpreted actions:\n\n${pretty}`,
        actions,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error("Interpret error", err)
      setMessages((prev) => [...prev, { sender: "bot", text: "Failed to interpret actions. See console." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage()
    }
  }

  // Called when user clicks Apply Suggested Actions for bot message
  const handleApplyActionsClick = (actions: any[]) => {
    if (!actions || actions.length === 0) return
    if (isDestructive(actions)) {
      setPendingActions(actions)
      openConfirm()
    } else {
      applyActions(actions)
    }
  }

  return (
    <VStack spacing={4} h="100%" align="stretch">
      <Box>
        <Heading size="md" mb={2}>
          Quantum AI Assistant
        </Heading>
        <Divider />
      </Box>

      <Box
        flex={1}
        overflowY="auto"
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="md"
        p={4}
        css={{
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            width: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        {messages.length === 0 ? (
          <Box textAlign="center" opacity={0.6} py={8}>
            <Heading size="sm" mb={2}>
              Welcome to Quantum AI Chat
            </Heading>
            <Box fontSize="sm">
              Ask questions about quantum computing, gates, algorithms, and more!
              <Text mt={2} fontSize="sm">
                Tip: Use slash commands for quick edits: <code>/addq</code>, <code>/removeq &lt;index&gt;</code>, <code>/addgate type qubit position key=val</code>, <code>/updategate &lt;id&gt; key=val</code>.
              </Text>
            </Box>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                bg={msg.sender === "user" ? bgUser : bgBot}
                p={3}
                borderRadius="md"
                maxW="90%"
                alignSelf={msg.sender === "user" ? "flex-end" : "flex-start"}
                wordBreak="break-word"
                whiteSpace="pre-wrap"
              >
                {msg.text}
                {/* If bot included parsed actions, show Apply button */}
                {msg.sender === "bot" && msg.actions && msg.actions.length > 0 && (
                  <HStack spacing={2} mt={3}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => handleApplyActionsClick(msg.actions!)}
                    >
                      Apply Suggested Actions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(JSON.stringify(msg.actions, null, 2))
                          .then(() =>
                            toast({
                              title: "Copied",
                              description: "Suggested actions copied to clipboard.",
                              status: "success",
                              duration: 2000,
                            })
                          )}
                      >
                        Copy Actions
                      </Button>
                  </HStack>
                )}
              </Box>
            ))}
            {isLoading && (
              <HStack align="flex-start">
                <Spinner size="sm" />
                <Box fontSize="sm" opacity={0.6}>
                  AI is thinking...
                </Box>
              </HStack>
            )}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      <HStack spacing={2}>
        <Input
          placeholder="Ask a quantum computing question... (or use /commands)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          isDisabled={isLoading}
          borderRadius="md"
        />
        <Button
          onClick={sendMessage}
          isLoading={isLoading}
          isDisabled={!input.trim() || isLoading}
          colorScheme="orange"
        >
          Send
        </Button>
        <Button
          onClick={interpretActions}
          isLoading={isLoading}
          isDisabled={!input.trim() || isLoading}
          colorScheme="teal"
          variant="outline"
        >
          Interpret
        </Button>
      </HStack>

      {/* Confirmation dialog for destructive actions */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setPendingActions(null)
          closeConfirm()
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm actions
            </AlertDialogHeader>

            <AlertDialogBody>
              The suggested actions include destructive changes (remove qubits or gates or clearing the circuit).
              Are you sure you want to proceed?
              <Box mt={3} whiteSpace="pre-wrap" fontSize="sm" color="gray.600">
                {pendingActions ? JSON.stringify(pendingActions, null, 2) : ""}
              </Box>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => {
                  setPendingActions(null)
                  closeConfirm()
                }}
              >
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmAndApplyPending} ml={3}>
                Confirm & Apply
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  )
}
