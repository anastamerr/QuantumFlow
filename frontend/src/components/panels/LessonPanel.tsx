import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  useToast,
  Icon,
  List,
  ListItem,
  ListIcon,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FaGraduationCap,
  FaCheckCircle,
  FaLightbulb,
  FaArrowRight,
  FaTrophy,
  FaClock,
  FaBook,
  FaChevronDown,
  FaChevronUp,
  FaPlay,
  FaRedo,
} from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { selectGates, selectQubits } from '../../store/slices/circuitSlice';
import { QML_LESSONS, getLessonById, getNextLesson, LessonCircuit, LessonStep as LessonStepType } from '../../utils/qmlLessons';
import { quantumApi } from '../../lib/quantumApi';

interface LessonState {
  active: boolean;
  lessonId: string | null;
  currentStep: number;
  completedSteps: number[];
  lessonData: LessonCircuit | null;
}

// Helper function to convert gate parameters from degrees to radians
const convertParamsToRadians = (params: Record<string, any>) => {
  const convertedParams: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'number') {
      // Convert degrees to radians if the value is greater than 2*PI (6.28)
      // This matches the logic in qiskitGenerator.ts
      const numValue = value as number;
      convertedParams[key] = Math.abs(numValue) <= 2 * Math.PI 
        ? numValue 
        : numValue * Math.PI / 180;
    } else {
      convertedParams[key] = value;
    }
  }
  
  return convertedParams;
};

export const LessonPanel: React.FC = () => {
  const [lessonState, setLessonState] = useState<LessonState>({
    active: false,
    lessonId: null,
    currentStep: 1,
    completedSteps: [],
    lessonData: null,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [stepGuidance, setStepGuidance] = useState<any>(null);

  const gates = useSelector(selectGates);
  const qubits = useSelector(selectQubits);
  const toast = useToast();

  // Filter lessons by difficulty
  const filteredLessons = selectedDifficulty
    ? QML_LESSONS.filter((l) => l.difficulty === selectedDifficulty)
    : QML_LESSONS;

  const startLesson = async (lessonId: string) => {
    const lesson = getLessonById(lessonId);
    if (!lesson) {
      toast({
        title: 'Lesson not found',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await quantumApi.startLesson(lessonId);
      setLessonState({
        active: true,
        lessonId,
        currentStep: 1,
        completedSteps: [],
        lessonData: lesson,
      });

      // Get initial step guidance
      const guidance = await quantumApi.getLessonStepGuidance(lessonId, 1, lesson);
      setStepGuidance(guidance);

      toast({
        title: `Started: ${lesson.title}`,
        description: lesson.description,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to start lesson:', error);
      toast({
        title: 'Error starting lesson',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const validateCurrentStep = async () => {
    if (!lessonState.active || !lessonState.lessonData) return;

    setIsValidating(true);

    try {
      // Convert gates to the format expected by backend
      const userCircuit = gates.map((gate) => ({
        id: gate.id,
        gateType: gate.type.toUpperCase(), // Normalize to uppercase
        targets: gate.targets || (gate.qubit !== undefined ? [gate.qubit] : []),
        controls: gate.controls || [],
        params: convertParamsToRadians(gate.params || {}), // Convert degrees to radians
        column: gate.position || 0,
      }));

      console.log('Validating circuit:', JSON.stringify(userCircuit, null, 2));
      console.log('Expected gate:', lessonState.lessonData.steps[lessonState.currentStep - 1].expectedGate);

      const response = await quantumApi.validateLessonStep(
        lessonState.lessonId!,
        lessonState.currentStep,
        userCircuit,
        lessonState.lessonData
      );

      if (response.correct) {
        // Step completed!
        const newCompletedSteps = [...lessonState.completedSteps, lessonState.currentStep];
        setLessonState((prev) => ({
          ...prev,
          completedSteps: newCompletedSteps,
          currentStep: response.next_step || prev.currentStep,
        }));

        toast({
          title: response.praise || '🎉 Perfect!',
          description: response.feedback,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Check if lesson is complete
        if (response.lesson_complete) {
          toast({
            title: response.celebration || '🏆 Lesson Complete!',
            description: 'Amazing work! Ready for the next challenge?',
            status: 'success',
            duration: 8000,
            isClosable: true,
          });
        } else if (response.next_step) {
          // Load next step guidance
          const guidance = await quantumApi.getLessonStepGuidance(
            lessonState.lessonId!,
            response.next_step,
            lessonState.lessonData
          );
          setStepGuidance(guidance);
        }
      } else {
        // Step incomplete
        toast({
          title: '📚 Not quite right',
          description: response.feedback,
          status: 'warning',
          duration: 6000,
          isClosable: true,
        });

        // Show specific issues
        if (response.specific_issues && response.specific_issues.length > 0) {
          response.specific_issues.forEach((issue: string) => {
            setTimeout(() => {
              toast({
                title: 'Issue detected',
                description: `Problem: ${issue}`,
                status: 'info',
                duration: 4000,
              });
            }, 500);
          });
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation error',
        description: 'Could not validate your circuit',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const requestHint = async () => {
    if (!lessonState.active || !lessonState.lessonData) return;

    try {
      const userCircuit = gates.map((gate) => ({
        id: gate.id,
        gateType: gate.type.toUpperCase(), // Normalize to uppercase
        targets: gate.targets || (gate.qubit !== undefined ? [gate.qubit] : []),
        controls: gate.controls || [],
        params: gate.params || {},
        column: gate.position || 0,
      }));

      const hintResponse = await quantumApi.getLessonHint(
        lessonState.lessonId!,
        lessonState.currentStep,
        lessonState.lessonData,
        userCircuit
      );

      setShowHint(true);

      toast({
        title: '💡 Hint',
        description: hintResponse.hint,
        status: 'info',
        duration: 8000,
        isClosable: true,
      });

      if (hintResponse.additional_guidance) {
        setTimeout(() => {
          toast({
            title: 'Additional Guidance',
            description: hintResponse.additional_guidance,
            status: 'info',
            duration: 6000,
            isClosable: true,
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting hint:', error);
    }
  };

  const resetLesson = () => {
    setLessonState({
      active: false,
      lessonId: null,
      currentStep: 1,
      completedSteps: [],
      lessonData: null,
    });
    setStepGuidance(null);
    setShowHint(false);
  };

  // Render lesson selection screen
  if (!lessonState.active) {
    return (
      <Box h="100%" overflowY="auto" p={4}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>
              <Icon as={FaGraduationCap} mr={2} />
              Quantum Circuit Lessons
            </Heading>
            <Text color="gray.600">
              Learn quantum computing step-by-step with guided lessons
            </Text>
          </Box>

          {/* Difficulty filter */}
          <HStack spacing={3}>
            <Text fontWeight="bold">Filter by difficulty:</Text>
            <Button
              size="sm"
              variant={selectedDifficulty === null ? 'solid' : 'outline'}
              onClick={() => setSelectedDifficulty(null)}
            >
              All
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              variant={selectedDifficulty === 'beginner' ? 'solid' : 'outline'}
              onClick={() => setSelectedDifficulty('beginner')}
            >
              Beginner
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              variant={selectedDifficulty === 'intermediate' ? 'solid' : 'outline'}
              onClick={() => setSelectedDifficulty('intermediate')}
            >
              Intermediate
            </Button>
            <Button
              size="sm"
              colorScheme="purple"
              variant={selectedDifficulty === 'advanced' ? 'solid' : 'outline'}
              onClick={() => setSelectedDifficulty('advanced')}
            >
              Advanced
            </Button>
          </HStack>

          {/* Lesson cards */}
          <VStack spacing={4} align="stretch">
            {filteredLessons.map((lesson) => (
              <Card key={lesson.id} variant="outline" _hover={{ shadow: 'md' }}>
                <CardHeader pb={2}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Heading size="md">{lesson.title}</Heading>
                      <HStack spacing={2}>
                        <Badge
                          colorScheme={
                            lesson.difficulty === 'beginner'
                              ? 'green'
                              : lesson.difficulty === 'intermediate'
                              ? 'blue'
                              : 'purple'
                          }
                        >
                          {lesson.difficulty}
                        </Badge>
                        <HStack fontSize="sm" color="gray.600">
                          <Icon as={FaClock} />
                          <Text>{lesson.estimatedTime}</Text>
                        </HStack>
                        <HStack fontSize="sm" color="gray.600">
                          <Icon as={FaBook} />
                          <Text>{lesson.steps.length} steps</Text>
                        </HStack>
                      </HStack>
                    </VStack>
                    <Button
                      leftIcon={<FaPlay />}
                      colorScheme="blue"
                      onClick={() => startLesson(lesson.id)}
                    >
                      Start
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody pt={2}>
                  <Text mb={3}>{lesson.description}</Text>
                  <Divider my={2} />
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    Learning Objectives:
                  </Text>
                  <List spacing={1} fontSize="sm">
                    {lesson.learningObjectives.map((obj, idx) => (
                      <ListItem key={idx}>
                        <ListIcon as={FaCheckCircle} color="green.500" />
                        {obj}
                      </ListItem>
                    ))}
                  </List>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </VStack>
      </Box>
    );
  }

  // Render active lesson
  const currentStepData: LessonStepType | undefined =
    lessonState.lessonData?.steps[lessonState.currentStep - 1];
  const isLessonComplete = lessonState.currentStep > (lessonState.lessonData?.steps.length || 0);

  return (
    <Box h="100%" overflowY="auto" p={4}>
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Heading size="md">{lessonState.lessonData?.title}</Heading>
            <Text fontSize="sm" color="gray.600">
              Step {lessonState.currentStep} of {lessonState.lessonData?.steps.length}
            </Text>
          </VStack>
          <HStack>
            <Tooltip label="Reset lesson">
              <IconButton
                aria-label="Reset lesson"
                icon={<FaRedo />}
                size="sm"
                variant="ghost"
                onClick={resetLesson}
              />
            </Tooltip>
            <Button size="sm" variant="outline" onClick={resetLesson}>
              Exit Lesson
            </Button>
          </HStack>
        </HStack>

        {/* Progress */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm" fontWeight="bold">
              Progress
            </Text>
            <Text fontSize="sm" color="gray.600">
              {lessonState.completedSteps.length} / {lessonState.lessonData?.steps.length} completed
            </Text>
          </HStack>
          <Progress
            value={(lessonState.completedSteps.length / (lessonState.lessonData?.steps.length || 1)) * 100}
            colorScheme="green"
            borderRadius="md"
            size="sm"
          />
        </Box>

        {/* Lesson complete celebration */}
        {isLessonComplete && (
          <Alert status="success" variant="subtle" borderRadius="md">
            <AlertIcon as={FaTrophy} boxSize={8} />
            <Box flex="1">
              <AlertTitle fontSize="lg">🎉 Lesson Complete!</AlertTitle>
              <AlertDescription>
                Congratulations! You've mastered {lessonState.lessonData?.title}!
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Current step guidance */}
        {!isLessonComplete && currentStepData && (
          <>
            <Card variant="filled" bg="blue.50" borderColor="blue.200" borderWidth={2}>
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={FaGraduationCap} color="blue.600" boxSize={5} />
                  <Heading size="sm" color="blue.900">
                    {currentStepData.title}
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <VStack align="stretch" spacing={3}>
                  <Text fontWeight="bold" color="blue.900">
                    📋 Instruction:
                  </Text>
                  <Text>{currentStepData.instruction}</Text>

                  {/* Educational note */}
                  <Collapse in={true} animateOpacity>
                    <Box
                      bg="white"
                      p={3}
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderColor="blue.400"
                    >
                      <Text fontSize="sm" fontWeight="bold" mb={1}>
                        {currentStepData.educationalNote}
                      </Text>
                      <Text fontSize="sm" color="gray.700">
                        {currentStepData.whyItMatters}
                      </Text>
                    </Box>
                  </Collapse>

                  {/* Hint toggle */}
                  <Button
                    leftIcon={<FaLightbulb />}
                    size="sm"
                    variant="outline"
                    colorScheme="yellow"
                    onClick={requestHint}
                  >
                    Need a Hint?
                  </Button>

                  {showHint && (
                    <Box bg="yellow.50" p={3} borderRadius="md" borderWidth={1} borderColor="yellow.300">
                      <Text fontSize="sm" fontWeight="bold" mb={1}>
                        💡 Hint:
                      </Text>
                      <Text fontSize="sm">{currentStepData.hint}</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Action buttons */}
            <HStack spacing={3}>
              <Button
                leftIcon={<FaCheckCircle />}
                colorScheme="green"
                isLoading={isValidating}
                onClick={validateCurrentStep}
                flex={1}
              >
                Check My Work
              </Button>
              <Tooltip label="Get a hint to help you">
                <IconButton
                  aria-label="Get hint"
                  icon={<FaLightbulb />}
                  colorScheme="yellow"
                  variant="outline"
                  onClick={requestHint}
                />
              </Tooltip>
            </HStack>
          </>
        )}

        {/* Next lesson suggestion */}
        {isLessonComplete && lessonState.lessonData && (
          <Card variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold">What's Next?</Text>
                {(() => {
                  const nextLesson = getNextLesson(lessonState.lessonData.id);
                  if (nextLesson) {
                    return (
                      <>
                        <Text>Continue your learning journey with:</Text>
                        <Button
                          rightIcon={<FaArrowRight />}
                          colorScheme="blue"
                          onClick={() => {
                            resetLesson();
                            setTimeout(() => startLesson(nextLesson.id), 100);
                          }}
                        >
                          {nextLesson.title}
                        </Button>
                      </>
                    );
                  } else {
                    return (
                      <Text>
                        🌟 You've completed all lessons! Try building your own circuits or explore the
                        QML toolkit!
                      </Text>
                    );
                  }
                })()}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};
