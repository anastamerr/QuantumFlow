import {
  Box,
  VStack,
  HStack,
  Input,
  IconButton,
  Text,
  useColorModeValue,
  Heading,
  Flex,
  Badge,
  Tooltip,
  Button,
  useToast,
  Spinner,
  Code,
  Avatar,
  Divider,
  ScaleFade,
} from '@chakra-ui/react';
import {
  CloseIcon,
  MinusIcon,
  DragHandleIcon,
  ChatIcon,
  ArrowForwardIcon,
  DeleteIcon,
  CopyIcon,
} from '@chakra-ui/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectChatVisible,
  selectChatMinimized,
  selectChatPosition,
  selectChatMessages,
  selectChatLoading,
  selectChatError,
  selectChatNumQubits,
  toggleMinimize,
  setPosition,
  addMessage,
  setLoading,
  setError,
  clearMessages,
  setNumQubits,
  toggleChatVisibility,
} from '../../store/slices/aiChatSlice';
import { addGates, selectQubits, selectGates, addGate } from '../../store/slices/circuitSlice';
import { selectActivePanel, selectCurrentLessonId, selectCurrentLessonStep } from '../../store/slices/uiSlice';
import { generateCircuitFromChat } from '../../lib/quantumApi';
import { QML_LESSONS, getLessonById } from '../../utils/qmlLessons';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModernCodeBlock from '../common/ModernCodeBlock';
import { generateQiskitCode } from '../../utils/codeGenerator';

const MotionBox = motion(Box);

const AIChatbot = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  
  const isVisible = useSelector(selectChatVisible);
  const isMinimized = useSelector(selectChatMinimized);
  const position = useSelector(selectChatPosition);
  const messages = useSelector(selectChatMessages);
  const isLoading = useSelector(selectChatLoading);
  const error = useSelector(selectChatError);
  const numQubits = useSelector(selectChatNumQubits);
  const currentQubits = useSelector(selectQubits);
  const currentGates = useSelector(selectGates);
  const activePanel = useSelector(selectActivePanel);
  const currentLessonId = useSelector(selectCurrentLessonId);
  const currentLessonStep = useSelector(selectCurrentLessonStep);
  
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  
  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('blue.500', 'blue.600');
  const userMsgBg = useColorModeValue('blue.50', 'blue.900');
  const aiMsgBg = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const shadowColor = useColorModeValue('lg', 'dark-lg');
  
  // Helper function to detect current lesson context
  const detectLessonContext = () => {
    // Check if we're in lesson mode by looking at Redux state first, then localStorage as fallback
    const isLessonActive = activePanel === 'lessons' || currentLessonId || localStorage.getItem('currentLessonId');
    if (!isLessonActive) return null;
    
    const lessonId = currentLessonId || localStorage.getItem('currentLessonId');
    const step = currentLessonStep || parseInt(localStorage.getItem('currentLessonStep') || '1');
    
    if (lessonId) {
      const lesson = getLessonById(lessonId);
      return {
        lesson,
        currentStep: step,
        isActive: true
      };
    }
    return null;
  };
  
  // Helper function to append gates instead of replacing
  const appendGatesToCircuit = (newGates: any[]) => {
    newGates.forEach(gate => {
      // Generate proper gate structure for circuit
      const gateToAdd = {
        name: gate.name || gate.type || gate.gateType,
        symbol: (gate.type || gate.gateType).toUpperCase(),
        description: `${gate.type || gate.gateType} gate`,
        category: 'AI Generated',
        color: '#3182ce',
        type: gate.type || gate.gateType,
        qubit: gate.qubit !== undefined ? gate.qubit : (gate.targets?.[0] ?? 0),
        position: gate.position !== undefined ? gate.position : currentGates.length,
        params: gate.params || {},
        targets: gate.targets,
        controls: gate.controls,
      };
      
      dispatch(addGate(gateToAdd));
    });
  };
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 400));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 600));
        dispatch(setPosition({ x: newX, y: newY }));
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, dispatch, position]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    dispatch(addMessage({ role: 'user', content: userMessage }));
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      // Detect lesson context
      const lessonContext = detectLessonContext();
      
      // Prepare enhanced circuit context with lesson information
      const circuitContext = {
        qubits: currentQubits.length,
        gates: currentGates.map(g => ({
          type: g.type,
          gateType: g.type, // Add both for backend compatibility
          qubit: g.qubit,
          position: g.position,
          params: g.params,
          targets: g.targets,
          controls: g.controls,
        })),
        lessonContext: lessonContext ? {
          isInLesson: true,
          lessonId: lessonContext.lesson?.id,
          lessonTitle: lessonContext.lesson?.title,
          currentStep: lessonContext.currentStep,
          totalSteps: lessonContext.lesson?.steps.length || 0,
          difficulty: lessonContext.lesson?.difficulty,
          currentStepData: lessonContext.lesson?.steps[lessonContext.currentStep - 1],
          expectedNextGate: lessonContext.lesson?.steps[lessonContext.currentStep - 1]?.expectedGate,
        } : {
          isInLesson: false
        }
      };
      
      // Prepare conversation history (last 5 messages for context)
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Call backend API with full context including lesson information
      const response = await generateCircuitFromChat(
        userMessage, 
        numQubits,
        circuitContext,
        conversationHistory
      );
      
      // Build rich AI response with educational content and lesson awareness
      let aiResponse = response.response || response.explanation;
      
      // Add lesson-specific context if in a lesson
      if (lessonContext) {
        const stepInfo = lessonContext.lesson?.steps[lessonContext.currentStep - 1];
        if (stepInfo) {
          aiResponse = `📚 **Lesson Context:** ${lessonContext.lesson?.title} - Step ${lessonContext.currentStep}\n\n${aiResponse}`;
          
          // Add step-specific guidance
          if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('stuck')) {
            aiResponse += `\n\n💡 **Step Guidance:** ${stepInfo.instruction}\n\n🔍 **Hint:** ${stepInfo.hint}`;
          }
          
          if (stepInfo.educationalNote) {
            aiResponse += `\n\n${stepInfo.educationalNote}`;
          }
        }
      }
      
      // Add action indicator
      if (response.action_taken) {
        const actionEmojis: Record<string, string> = {
          'add_gates': '➕ Added gates',
          'remove_gates': '➖ Removed gates', 
          'analyze': '🔍 Analyzed circuit',
          'explain': '💭 Explained'
        };
        const actionText = actionEmojis[response.action_taken] || '✅ Action completed';
        aiResponse = `**${actionText}**\n\n${aiResponse}`;
      }
      
      if (response.teaching_note) {
        aiResponse += `\n\n📚 ${response.teaching_note}`;
      }
      
      if (response.praise) {
        aiResponse += `\n\n✨ ${response.praise}`;
      }
      
      // Add AI response with all context
      dispatch(addMessage({
        role: 'assistant',
        content: aiResponse,
        gates: response.gates,
        explanation: response.explanation,
      }));
      
      // Show warnings if any
      if (response.warnings && response.warnings.length > 0) {
        response.warnings.forEach((warning: string) => {
          toast({
            title: '💡 Heads up!',
            description: warning,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        });
      }
      
      // Add gates to circuit if generated - APPEND, don't replace!
      if (response.gates && response.gates.length > 0) {
        console.log('🔍 Backend returned gates:', response.gates);
        
        // Filter out invalid gates and fix CNOT gates
        const validGates = response.gates.filter((gate: any) => {
          if (!gate.type && !gate.gateType) {
            console.warn('Skipping gate without type:', gate);
            return false;
          }
          return true;
        }).map((gate: any, index: number) => {
          const gateType = gate.type || gate.gateType;
          console.log(`🔧 Processing gate: ${gateType}`, gate);
          
          // Fix CNOT gate structure - map both cx and cnot
          if (gateType.toUpperCase() === 'CNOT' || gateType.toUpperCase() === 'CX') {
            // Extract control and target from gate data
            const controlQubit = gate.controls?.[0] ?? 0;
            const targetQubit = gate.targets?.[0] ?? 1;
            
            const cnotGate = {
              name: 'CNOT',
              symbol: 'CX',
              description: 'CNOT gate',
              category: 'AI Generated',
              color: '#3182ce',
              type: 'cnot', // Use 'cnot' to match gate library
              qubit: controlQubit, // Control qubit goes in main qubit field
              position: gate.position !== undefined ? gate.position : (currentGates.length + index),
              params: gate.params || {},
              targets: [targetQubit], // Target qubit(s)
              controls: [controlQubit], // Control qubit(s)
            };
            console.log('✅ Created CNOT gate:', cnotGate);
            return cnotGate;
          }
          
          // Handle other gates normally
          const normalGate = {
            name: gate.name || gateType,
            symbol: gateType.toUpperCase(),
            description: `${gateType} gate`,
            category: 'AI Generated',
            color: '#3182ce',
            type: gateType.toLowerCase(), // Ensure lowercase for consistency
            qubit: gate.qubit !== undefined ? gate.qubit : (gate.targets?.[0] ?? 0),
            position: gate.position !== undefined ? gate.position : (currentGates.length + index),
            params: gate.params || {},
            targets: gate.targets,
            controls: gate.controls,
          };
          console.log(`✅ Created ${gateType} gate:`, normalGate);
          return normalGate;
        });
        
        console.log('🎯 Final processed gates:', validGates);
        
        // Append gates one by one to preserve existing circuit
        validGates.forEach(gate => {
          console.log('🚀 Adding gate to circuit:', gate);
          dispatch(addGate(gate));
        });
        
        toast({
          title: '🎉 Gates Added!',
          description: `Added ${validGates.length} gate${validGates.length > 1 ? 's' : ''} to your circuit`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Show next suggestions if available
      if (response.next_suggestions && response.next_suggestions.length > 0) {
        const suggestionsText = response.next_suggestions.join('\n• ');
        toast({
          title: '💡 What\'s Next?',
          description: `• ${suggestionsText}`,
          status: 'info',
          duration: 7000,
          isClosable: true,
          position: 'bottom-right',
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate circuit';
      dispatch(setError(errorMsg));
      dispatch(addMessage({
        role: 'assistant',
        content: `❌ Oops! ${errorMsg}. ${errorMsg.includes('503') || errorMsg.includes('not available') ? '🔑 Please check that the Gemini API key is configured in the backend .env file.' : 'Let\'s try that again!'}`,
      }));
      
      toast({
        title: 'Error',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      dispatch(setLoading(false));
    }
  };
  
  const handleClearChat = () => {
    dispatch(clearMessages());
    toast({
      title: 'Chat Cleared',
      status: 'info',
      duration: 2000,
    });
  };
  
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <MotionBox
        ref={chatBoxRef}
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        position="fixed"
        left={`${position.x}px`}
        top={`${position.y}px`}
        width="400px"
        height={isMinimized ? 'auto' : '600px'}
        bg={bgColor}
        borderRadius="xl"
        boxShadow={shadowColor}
        border="1px solid"
        borderColor={borderColor}
        zIndex={9999}
        overflow="hidden"
        onMouseDown={handleMouseDown}
        cursor={isDragging ? 'grabbing' : 'default'}
      >
        {/* Header */}
        <Flex
          className="drag-handle"
          bg={headerBg}
          color="white"
          p={3}
          alignItems="center"
          justifyContent="space-between"
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
        >
          <HStack spacing={2}>
            <DragHandleIcon />
            <ChatIcon />
            <Heading size="sm">AI Circuit Assistant</Heading>
            <Badge colorScheme="green" fontSize="xs">Beta</Badge>
          </HStack>
          
          <HStack spacing={1}>
            <Tooltip label="Clear chat">
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                aria-label="Clear chat"
                onClick={handleClearChat}
              />
            </Tooltip>
            <Tooltip label={isMinimized ? 'Expand' : 'Minimize'}>
              <IconButton
                icon={<MinusIcon />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                aria-label="Minimize"
                onClick={() => dispatch(toggleMinimize())}
              />
            </Tooltip>
            <Tooltip label="Close">
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                aria-label="Close"
                onClick={() => dispatch(toggleChatVisibility())}
              />
            </Tooltip>
          </HStack>
        </Flex>
        
        {/* Chat content - hidden when minimized */}
        {!isMinimized && (
          <VStack spacing={0} height="calc(100% - 60px)" align="stretch">
            {/* Messages area */}
            <Box
              flex={1}
              overflowY="auto"
              p={4}
              css={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  background: useColorModeValue('#CBD5E0', '#4A5568'),
                  borderRadius: '3px',
                },
              }}
            >
              <VStack spacing={3} align="stretch">
                {messages.length === 0 && (
                  <ScaleFade in={true} initialScale={0.9}>
                    <Box textAlign="center" py={8} color="gray.500">
                      <ChatIcon boxSize={12} mb={3} />
                      <Text fontSize="lg" fontWeight="medium">
                        AI Circuit Assistant 🤖
                      </Text>
                      <Text fontSize="sm" mt={2} mb={4}>
                        I can help you build quantum circuits! I'll add gates to your existing circuit and provide lesson-specific guidance when you're in a lesson.
                      </Text>
                      <Divider my={4} />
                      <VStack align="start" spacing={2} fontSize="xs" color="gray.400">
                        <Text fontWeight="bold" fontSize="sm" color="gray.500">✨ Try asking me to:</Text>
                        <Text>• "Add a Hadamard gate"</Text>
                        <Text>• "Create a Bell state"</Text>
                        <Text>• "Help with current lesson step"</Text>
                        <Text>• "What's the next gate I need?"</Text>
                        <Text>• "Analyze my circuit"</Text>
                        <Text>• "Explain the X gate"</Text>
                        <Text>• "Add a CNOT gate from qubit 0 to 1"</Text>
                      </VStack>
                    </Box>
                  </ScaleFade>
                )}
                
                {messages.map((msg, idx) => (
                  <ScaleFade key={msg.id} in={true} initialScale={0.9}>
                    <HStack
                      align="start"
                      spacing={2}
                      justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                    >
                      {msg.role === 'assistant' && (
                        <Avatar size="sm" name="AI" bg="blue.500" color="white" />
                      )}
                      
                      <Box maxW="80%">
                        <Box
                          bg={msg.role === 'user' ? userMsgBg : aiMsgBg}
                          px={3}
                          py={2}
                          borderRadius="lg"
                          position="relative"
                          _hover={{ '& .copy-btn': { opacity: 1 } }}
                        >
                          <Text fontSize="sm" whiteSpace="pre-wrap">
                            {msg.content}
                          </Text>
                          
                          {msg.gates && msg.gates.length > 0 && (
                            <Badge colorScheme="green" mt={2} fontSize="xs">
                              {msg.gates.length} gates generated
                            </Badge>
                          )}
                          
                          <IconButton
                            className="copy-btn"
                            icon={<CopyIcon />}
                            size="xs"
                            position="absolute"
                            top={1}
                            right={1}
                            opacity={0}
                            transition="opacity 0.2s"
                            aria-label="Copy message"
                            onClick={() => handleCopyMessage(msg.content)}
                          />
                        </Box>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Text>
                      </Box>
                      
                      {msg.role === 'user' && (
                        <Avatar size="sm" name="You" bg="gray.500" />
                      )}
                    </HStack>
                  </ScaleFade>
                ))}
                
                {isLoading && (
                  <HStack spacing={2}>
                    <Avatar size="sm" name="AI" bg="blue.500" color="white" />
                    <Box bg={aiMsgBg} px={3} py={2} borderRadius="lg">
                      <HStack>
                        <Spinner size="sm" />
                        <Text fontSize="sm">Generating circuit...</Text>
                      </HStack>
                    </Box>
                  </HStack>
                )}
                
                <div ref={messagesEndRef} />
              </VStack>
            </Box>
            
            {/* Input area */}
            <Box p={3} borderTop="1px solid" borderColor={borderColor}>
              <VStack spacing={2}>
                
                
                <HStack spacing={2} width="100%">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask me to build something..."
                    size="sm"
                    bg={inputBg}
                    disabled={isLoading}
                  />
                  <Tooltip label="Send message">
                    <IconButton
                      icon={<ArrowForwardIcon />}
                      colorScheme="blue"
                      size="sm"
                      aria-label="Send"
                      onClick={handleSendMessage}
                      isLoading={isLoading}
                      isDisabled={!inputValue.trim()}
                    />
                  </Tooltip>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        )}
      </MotionBox>
    </AnimatePresence>
  );
};

export default AIChatbot;
