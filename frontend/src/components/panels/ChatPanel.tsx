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
} from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import axios from "axios"

interface Message {
  sender: "user" | "bot"
  text: string
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    setIsLoading(true)

    // Add user message
    const userMsg: Message = { sender: "user", text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    try {
      // Send to backend
      const response = await axios.post<ApiResponse>(
        "http://localhost:8000/ask",
        {
          question: input,
        }
      )

      // Add bot response
      const botMsg: Message = { sender: "bot", text: response.data.answer }
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage()
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
                maxW="70%"
                alignSelf={msg.sender === "user" ? "flex-end" : "flex-start"}
                wordBreak="break-word"
                whiteSpace="pre-wrap"
              >
                {msg.text}
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
          placeholder="Ask a quantum computing question..."
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
      </HStack>
    </VStack>
  )
}
