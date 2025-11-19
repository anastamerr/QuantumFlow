import React, { useState } from "react";
import {
  VStack,
  HStack,
  Box,
  Textarea,
  Button,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  IconButton,
} from "@chakra-ui/react";
import FullViewToggle from '../common/FullViewToggle'
import ModernCodeBlock from '../common/ModernCodeBlock'
import { CopyIcon, CheckIcon } from "@chakra-ui/icons";

const AIPanel: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  async function generateQiskit(promptText: string) {
    setLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(import.meta as any).env?.VITE_HF_API_KEY}`,
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct:novita",
          messages: [
            {
              role: "user",
              content: `You are a Qiskit code generator. Generate ONLY the Python code for Qiskit circuits. Do not include explanations, descriptions, or any text other than the code and comments. Generate code output that can all be copied and pasted to run immediately, without fixing anything. If the user asks for anything unrelated to Qiskit, respond with ONLY "Sorry, I am unfamiliar with your request."
              The user says: ${promptText}`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const content = data.choices[0].message.content;

      // Simple check — must mention "qiskit" or look like Python code
      if (!content.toLowerCase().includes("qiskit") && !content.includes("QuantumCircuit")) {
        setResponse("Sorry, I am unfamiliar with your request.");
      } else {
        setResponse(content);
      }
    } catch (err) {
      console.error(err);
      setError("Error generating code. Check your internet or API key.");
    }

    setLoading(false);
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      generateQiskit(prompt);
    }
  };

  return (
    <VStack
      spacing={2}
      align="stretch"
      h="100%"
      w="100%"
      overflowY="auto"
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
      {/* Header with Buttons on Top Right */}
      <HStack justify="space-between" align="flex-start" spacing={2} flexShrink={0}>
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={0}>
            Qiskit AI
          </Text>
          <Text fontSize="xs" color="gray.500">
            Generate qiskit code
          </Text>
        </Box>
        <HStack spacing={1} flexShrink={0}>
          <FullViewToggle />
          <Button
            onClick={() => generateQiskit(prompt)}
            isDisabled={loading || !prompt.trim()}
            isLoading={loading}
            colorScheme="blue"
            size="sm"
            fontWeight="600"
          >
            {loading ? "Generating" : "Generate"}
          </Button>
          <Tooltip label="Clear">
            <Button
              onClick={() => {
                setPrompt("");
                setResponse("");
                setError("");
              }}
              variant="outline"
              size="sm"
              isDisabled={loading}
            >
              ✕
            </Button>
          </Tooltip>
        </HStack>
      </HStack>

      {/* Compact Input */}
      <Box flexShrink={0}>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 250))}
          onKeyPress={handleKeyPress}
          placeholder="Describe the circuit you want!"
          bg={inputBg}
          borderColor={borderColor}
          borderWidth="1px"
          _focus={{
            borderColor: "blue.400",
            boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
          }}
          p={2}
          minH="50px"
          maxH="50px"
          fontSize="sm"
          resize="none"
          disabled={loading}
          maxLength={250}
        />
        <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
          {prompt.length}/250
        </Text>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert status="error" variant="subtle" borderRadius="md" py={2} px={3} flexShrink={0}>
          <AlertIcon fontSize="md" />
          <Text fontSize="xs">{error}</Text>
        </Alert>
      )}

      {/* Output Section - Grows to fill space */}
      {loading ? (
        <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
          <Spinner size="sm" color="blue.500" />
          <Text fontSize="xs" color="gray.500">
            Generating...
          </Text>
        </Box>
      ) : (
        response && (
          <ModernCodeBlock
            code={response}
            language="python"
            filename="qiskit_ai_generated"
            showLineNumbers={true}
            maxHeight="800px"
          />
        )
      )}

      {/* Tips when no output */}
      {!response && !loading && (
        <Alert status="info" variant="subtle" borderRadius="md" py={2} px={3}>
          <AlertIcon fontSize="md" />
          <Box fontSize="xs">
            <Text fontWeight="600">Examples:</Text>
            <Text>• "Bell state circuit"</Text>
            <Text>• "Grover's algorithm"</Text>
            <Text>• "Quantum Fourier transform"</Text>
          </Box>
        </Alert>
      )}
    </VStack>
  );
};

export default AIPanel;
