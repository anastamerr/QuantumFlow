import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Heading,
  Card,
  CardHeader,
  CardBody,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Code,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  List,
  ListItem,
  ListIcon,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Tooltip,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  CheckCircleIcon,
  TimeIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  lessonsData,
  getLessonsByCategory,
  type Lesson,
  type LessonChallenge,
} from "../../data/lessonsData";
import {
  selectQubits,
  selectGates,
  addGates,
  clearCircuit,
  addQubit,
} from "../../store/slices/circuitSlice";
import CircuitCanvas from "../canvas/CircuitCanvas";
import GatePickerDrawer from "../common/GatePickerDrawer";
import FullViewToggle from "../common/FullViewToggle";

type LessonProgressSerialized = {
  lessonId: string;
  completedChallenges: string[];
  theoryRead?: boolean;
  lastAccessedIso?: string;
  totalTimeSpent?: number;
};

const PROGRESS_KEY = "quantumflow-lesson-progress-v2";

const safeJSONParse = <T,>(s: string | null, fallback: T) => {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch (e) {
    console.error("localStorage parse error", e);
    return fallback;
  }
};

const difficultyColor = (d: "easy" | "medium" | "hard" | string) =>
  d === "easy"
    ? "green"
    : d === "medium"
    ? "yellow"
    : d === "hard"
    ? "red"
    : "gray";

// Component to render formatted text with bold (**text**) and inline LaTeX ($...$)
const FormattedText = ({ text }: { text: string }) => {
  const bg = useColorModeValue("gray.100", "gray.700");

  const parseAndRender = (content: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    const regex = /(\*\*(.+?)\*\*)|(\$(.+?)\$)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(content.slice(currentIndex, match.index));
      }

      if (match[1]) {
        // Bold text match (**text**)
        parts.push(
          <Text as="span" fontWeight="bold" key={match.index}>
            {match[2]}
          </Text>
        );
      } else if (match[3]) {
        // LaTeX match ($...$)
        parts.push(
          <Box
            as="span"
            display="inline-block"
            px={1}
            maxW="100%"
            overflowX="auto"
            css={{
              "& .katex": {
                maxWidth: "100%",
                overflowX: "auto",
                overflowY: "hidden",
              },
            }}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(match[4], {
                displayMode: false,
                throwOnError: false,
              }),
            }}
            key={match.index}
          />
        );
      }

      currentIndex = match.index + match[0].length;
    }

    if (currentIndex < content.length) {
      parts.push(content.slice(currentIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <Text
          key={index}
          mb={line.trim() === "" ? 2 : 0}
          wordBreak="break-word"
          overflowWrap="anywhere"
        >
          {parseAndRender(line)}
        </Text>
      ))}
    </>
  );
};

const LessonCard = React.memo(function LessonCard({
  lesson,
  isAccessible,
  progress,
  onSelect,
}: {
  lesson: Lesson;
  isAccessible: boolean;
  progress?: LessonProgressSerialized;
  onSelect: (l: Lesson) => void;
}) {
  const completedCount = progress?.completedChallenges.length || 0;
  const totalChallenges = lesson.challenges.length;
  const progressPercent = totalChallenges
    ? (completedCount / totalChallenges) * 100
    : 0;

  return (
    <Card
      opacity={isAccessible ? 1 : 0.6}
      cursor={isAccessible ? "pointer" : "not-allowed"}
      onClick={() => isAccessible && onSelect(lesson)}
      _hover={
        isAccessible ? { transform: "translateY(-2px)", shadow: "md" } : {}
      }
      transition="all 0.15s"
    >
      <CardHeader p={{ base: 3, md: 6 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          gap={3}
        >
          <Box flex={1} minW={0}>
            <Heading size="sm" mb={1} as="h3" noOfLines={2}>
              {lesson.title}
            </Heading>
            <Text
              fontSize="sm"
              color="gray.500"
              noOfLines={2}
              wordBreak="break-word"
            >
              {lesson.description}
            </Text>
          </Box>

          <VStack
            spacing={1}
            align={{ base: "start", md: "end" }}
            minW={{ base: "auto", md: "120px" }}
          >
            <Badge
              colorScheme={difficultyColor(lesson.challenges[0]?.difficulty)}
            >
              {lesson.category}
            </Badge>
            <HStack fontSize="xs" color="gray.500">
              <Icon as={TimeIcon} />
              <Text>{lesson.estimatedTime}m</Text>
            </HStack>
          </VStack>
        </Flex>
      </CardHeader>

      <CardBody pt={0} px={{ base: 3, md: 6 }} pb={{ base: 3, md: 6 }}>
        <VStack align="stretch" spacing={3}>
          {progress && (
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" fontWeight="medium">
                  Progress
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {completedCount}/{totalChallenges}
                </Text>
              </HStack>
              <Progress value={progressPercent} size="sm" borderRadius="full" />
            </Box>
          )}

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              What you'll learn
            </Text>
            <List spacing={1} ml={0}>
              {lesson.learningObjectives.slice(0, 2).map((obj, i) => (
                <ListItem
                  key={i}
                  fontSize="sm"
                  display="flex"
                  alignItems="center"
                >
                  <ListIcon as={CheckCircleIcon} />
                  <Text noOfLines={1} wordBreak="break-word">
                    {obj}
                  </Text>
                </ListItem>
              ))}
              {lesson.learningObjectives.length > 2 && (
                <Text fontSize="xs" color="gray.500" ml={6}>
                  +{lesson.learningObjectives.length - 2} more...
                </Text>
              )}
            </List>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
});

export default function LessonsPanel() {
  const dispatch = useDispatch();
  const qubits = useSelector(selectQubits, shallowEqual);
  const gates = useSelector(selectGates, shallowEqual);

  const [selectedCategory, setSelectedCategory] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentChallenge, setCurrentChallenge] =
    useState<LessonChallenge | null>(null);

  const [progressMap, setProgressMap] = useState<
    Record<string, LessonProgressSerialized>
  >(() =>
    safeJSONParse<Record<string, LessonProgressSerialized>>(
      localStorage.getItem(PROGRESS_KEY),
      {}
    )
  );

  const {
    isOpen: isCircuitOpen,
    onOpen: onCircuitOpen,
    onClose: onCircuitClose,
  } = useDisclosure();
  const {
    isOpen: isGatePickerOpen,
    onOpen: onGatePickerOpen,
    onClose: onGatePickerClose,
  } = useDisclosure();

  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.600");
  const accent = useColorModeValue("blue.600", "blue.300");

  // Treat tablets (example: iPad) like mobile
  const isCompactLayout = useBreakpointValue({
    base: true,
    md: true,
    lg: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [progressMap]);

  const lessonsInCategory = useMemo(
    () => getLessonsByCategory(selectedCategory),
    [selectedCategory]
  );

  const totalChallenges = useMemo(
    () => lessonsData.reduce((acc, l) => acc + l.challenges.length, 0),
    []
  );

  const overallProgress = useMemo(() => {
    const completed = Object.values(progressMap).reduce(
      (acc, p) => acc + (p.completedChallenges?.length || 0),
      0
    );
    return totalChallenges ? (completed / totalChallenges) * 100 : 0;
  }, [progressMap, totalChallenges]);

  const canAccessLesson = useCallback(
    (lesson: Lesson) => {
      if (!lesson.prerequisites?.length) return true;
      return lesson.prerequisites.every(
        (id) => (progressMap[id]?.completedChallenges?.length || 0) > 0
      );
    },
    [progressMap]
  );

  const isChallengeCompleted = useCallback(
    (lessonId: string, challengeId: string) => {
      return (progressMap[lessonId]?.completedChallenges || []).includes(
        challengeId
      );
    },
    [progressMap]
  );

  const markChallengeCompleted = useCallback(
    (lessonId: string, challengeId: string) => {
      setProgressMap((prev) => {
        const prevEntry =
          prev[lessonId] ||
          ({
            lessonId,
            completedChallenges: [],
            lastAccessedIso: new Date().toISOString(),
          } as LessonProgressSerialized);
        const updated: LessonProgressSerialized = {
          ...prevEntry,
          lessonId,
          completedChallenges: Array.from(
            new Set([...(prevEntry.completedChallenges || []), challengeId])
          ),
          lastAccessedIso: new Date().toISOString(),
        };
        return { ...prev, [lessonId]: updated };
      });
    },
    []
  );

  const validateCurrentChallenge = useCallback(() => {
    if (!currentChallenge) return false;
    try {
      const fn = currentChallenge.expectedResult?.validation;
      if (typeof fn === "function") {
        return !!fn(gates, qubits.length);
      }
      return false;
    } catch (e) {
      console.error("validation error", e);
      return false;
    }
  }, [currentChallenge, gates, qubits.length]);

  const handleCheckSolution = useCallback(() => {
    if (!currentChallenge || !selectedLesson) return;
    const ok = validateCurrentChallenge();
    if (ok) {
      markChallengeCompleted(selectedLesson.id, currentChallenge.id);
      onCircuitClose();
    }
  }, [
    currentChallenge,
    selectedLesson,
    validateCurrentChallenge,
    markChallengeCompleted,
    onCircuitClose,
  ]);

  const loadChallengeCircuit = useCallback(
    (circuit: any[]) => {
      dispatch(clearCircuit());
      const maxQubit = circuit.reduce(
        (m, g) =>
          Math.max(
            m,
            g.qubit ?? -1,
            ...(g.targets ?? []),
            ...(g.controls ?? [])
          ),
        0
      );
      for (let i = 0; i <= Math.max(1, maxQubit); i++) dispatch(addQubit());
      dispatch(addGates(circuit));
    },
    [dispatch]
  );

  const startChallenge = useCallback(
    (lesson: Lesson, challenge: LessonChallenge) => {
      setSelectedLesson(lesson);
      setCurrentChallenge(challenge);
      dispatch(clearCircuit());
      for (let i = 0; i < 2; i++) dispatch(addQubit());
      onCircuitOpen();
    },
    [dispatch, onCircuitOpen]
  );

  const CategorySelector = useMemo(() => {
    return (
      <HStack spacing={3} mb={4} wrap="wrap">
        {(["beginner", "intermediate", "advanced"] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            colorScheme={selectedCategory === c ? "blue" : "gray"}
            variant={selectedCategory === c ? "solid" : "outline"}
            onClick={() => setSelectedCategory(c)}
            minW="90px"
          >
            {c}
          </Button>
        ))}
      </HStack>
    );
  }, [selectedCategory]);

  const ChallengeModal = useMemo(() => {
    const modalSize = "full";
    const headerHeight = isCompactLayout ? 80 : 120;

    return (
      <Modal
        isOpen={isCircuitOpen}
        onClose={onCircuitClose}
        size={modalSize}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <ModalContent
          display="flex"
          flexDirection="column"
          maxH={isCompactLayout ? "100vh" : "90vh"}
          height={isCompactLayout ? "100vh" : undefined}
          overflow="hidden"
          borderRadius={isCompactLayout ? 0 : "md"}
        >
          <ModalHeader
            pb={isCompactLayout ? 1 : 2}
            pt={isCompactLayout ? 3 : 4}
          >
            <VStack align="start" spacing={isCompactLayout ? 0.5 : 1}>
              <Text
                fontSize={{ base: "sm", md: "lg" }}
                fontWeight="bold"
                noOfLines={1}
              >
                {currentChallenge?.title}
              </Text>
              <HStack spacing={2} wrap="wrap">
                <Badge
                  fontSize="xs"
                  colorScheme={difficultyColor(
                    currentChallenge?.difficulty || "easy"
                  )}
                >
                  {currentChallenge?.difficulty}
                </Badge>
                {selectedLesson && !isCompactLayout && (
                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                    Lesson: {selectedLesson.title}
                  </Text>
                )}
              </HStack>
            </VStack>
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody flex="1" p={0} overflow="hidden">
            <Flex
              direction={isCompactLayout ? "column" : "row"}
              h="100%"
              minH={0}
            >
              {/* LEFT pane */}
              <Box
                flex={isCompactLayout ? 0 : 1}
                flexBasis={isCompactLayout ? "auto" : undefined}
                p={{ base: 3, md: 6 }}
                overflowY="auto"
                minH={0}
                maxH={
                  isCompactLayout ? "30vh" : `calc(90vh - ${headerHeight}px)`
                }
                borderRight={
                  !isCompactLayout ? `1px solid ${border}` : undefined
                }
                style={{
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-y",
                  overscrollBehavior: "contain",
                }}
              >
                <VStack align="stretch" spacing={isCompactLayout ? 3 : 6}>
                  <Box>
                    <Text
                      fontWeight="bold"
                      mb={1}
                      fontSize={{ base: "sm", md: "md" }}
                    >
                      Challenge Description
                    </Text>
                    <Box fontSize={{ base: "sm", md: "md" }}>
                      <FormattedText
                        text={currentChallenge?.description || ""}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Text
                      fontWeight="bold"
                      mb={1}
                      fontSize={{ base: "sm", md: "md" }}
                    >
                      Expected Result
                    </Text>
                    <Alert
                      status="info"
                      borderRadius="md"
                      py={isCompactLayout ? 2 : 3}
                    >
                      <AlertIcon />
                      <AlertDescription fontSize={{ base: "sm", md: "md" }}>
                        {currentChallenge?.expectedResult?.description}
                      </AlertDescription>
                    </Alert>
                  </Box>

                  {!isCompactLayout && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Available Gates
                      </Text>
                      <Button
                        leftIcon={<Icon as={SettingsIcon} />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={onGatePickerOpen}
                        w="100%"
                      >
                        Open Picker
                      </Button>
                    </Box>
                  )}

                  {currentChallenge?.hints?.length > 0 && (
                    <Accordion allowToggle>
                      <AccordionItem>
                        <AccordionButton py={isCompactLayout ? 2 : 3}>
                          <Box
                            flex="1"
                            textAlign="left"
                            fontWeight="bold"
                            fontSize={{ base: "sm", md: "md" }}
                          >
                            Hints
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={isCompactLayout ? 2 : 4}>
                          <VStack
                            align="stretch"
                            spacing={isCompactLayout ? 2 : 3}
                          >
                            {currentChallenge.hints.map((h, i) => (
                              <Alert
                                key={i}
                                status="warning"
                                borderRadius="md"
                                py={isCompactLayout ? 2 : 3}
                              >
                                <AlertIcon />
                                <AlertDescription
                                  fontSize={{ base: "sm", md: "md" }}
                                >
                                  <FormattedText text={h} />
                                </AlertDescription>
                              </Alert>
                            ))}
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {currentChallenge?.solution && (
                    <Accordion allowToggle>
                      <AccordionItem>
                        <AccordionButton py={isCompactLayout ? 2 : 3}>
                          <Box
                            flex="1"
                            textAlign="left"
                            fontWeight="bold"
                            fontSize={{ base: "sm", md: "md" }}
                          >
                            Solution
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={isCompactLayout ? 2 : 4}>
                          <VStack
                            align="stretch"
                            spacing={isCompactLayout ? 2 : 3}
                          >
                            <Box fontSize={{ base: "sm", md: "md" }}>
                              <FormattedText
                                text={currentChallenge.solution.description}
                              />
                            </Box>
                            <Code
                              whiteSpace="pre-wrap"
                              p={isCompactLayout ? 2 : 3}
                              borderRadius="md"
                              display="block"
                              overflowX="auto"
                              fontSize={{ base: "xs", md: "sm" }}
                            >
                              {JSON.stringify(
                                currentChallenge.solution.circuit,
                                null,
                                2
                              )}
                            </Code>
                            <Button
                              size="sm"
                              onClick={() =>
                                loadChallengeCircuit(
                                  currentChallenge.solution.circuit
                                )
                              }
                            >
                              Load Solution Circuit
                            </Button>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  )}
                </VStack>
              </Box>

              {/* RIGHT pane: circuit builder */}
              <Box
                flex={isCompactLayout ? 1 : 1}
                bg={bg}
                minH={0}
                display="flex"
                flexDirection="column"
                borderTop={isCompactLayout ? `1px solid ${border}` : undefined}
              >
                <Flex direction="column" h="100%" minH={0}>
                  <Box
                    p={isCompactLayout ? 3 : 4}
                    borderBottom={`1px solid ${border}`}
                  >
                    <Stack
                      direction={{ base: "column", md: "row" }}
                      justify="space-between"
                      spacing={3}
                    >
                      <Text fontWeight="bold">Circuit Builder</Text>
                      <Stack
                        direction={{ base: "column", sm: "row" }}
                        spacing={2}
                        w={{ base: "100%", md: "auto" }}
                      >
                        <Tooltip label="Reset to challenge circuit">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              currentChallenge &&
                              loadChallengeCircuit(currentChallenge.circuit)
                            }
                            w={{ base: "100%", sm: "auto" }}
                          >
                            Reset Challenge
                          </Button>
                        </Tooltip>
                        <Tooltip label="Load the solution onto the circuit">
                          <Button
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            onClick={() =>
                              currentChallenge?.solution?.circuit &&
                              loadChallengeCircuit(
                                currentChallenge.solution.circuit
                              )
                            }
                            isDisabled={!currentChallenge?.solution?.circuit}
                            w={{ base: "100%", sm: "auto" }}
                          >
                            Show Solution
                          </Button>
                        </Tooltip>
                        <Button
                          size="sm"
                          colorScheme={
                            validateCurrentChallenge() ? "blue" : "gray"
                          }
                          onClick={handleCheckSolution}
                          isDisabled={!validateCurrentChallenge()}
                          w={{ base: "100%", sm: "auto" }}
                        >
                          Check Solution
                        </Button>
                      </Stack>
                    </Stack>

                    {isCompactLayout && (
                      <Box mt={3}>
                        <Button
                          leftIcon={<Icon as={SettingsIcon} />}
                          colorScheme="blue"
                          variant="outline"
                          onClick={onGatePickerOpen}
                          w="100%"
                          size="sm"
                        >
                          Open Gate Picker
                        </Button>
                      </Box>
                    )}

                    <Box mt={2}>
                      {(() => {
                        if (!currentChallenge) return null;
                        const ok = validateCurrentChallenge();
                        if (!gates.length && !qubits.length) {
                          return (
                            <Alert
                              status="warning"
                              size="sm"
                              borderRadius="md"
                              py={isCompactLayout ? 1.5 : 3}
                            >
                              <AlertIcon boxSize={isCompactLayout ? 4 : 5} />
                              <AlertDescription
                                fontSize={{ base: "xs", md: "sm" }}
                              >
                                Build your circuit to meet the challenge
                                requirements
                              </AlertDescription>
                            </Alert>
                          );
                        }
                        if (ok) {
                          return (
                            <Alert
                              status="success"
                              size="sm"
                              borderRadius="md"
                              py={isCompactLayout ? 1.5 : 3}
                            >
                              <AlertIcon boxSize={isCompactLayout ? 4 : 5} />
                              <AlertDescription
                                fontSize={{ base: "xs", md: "sm" }}
                              >
                                Requirements met — click Check to finish
                              </AlertDescription>
                            </Alert>
                          );
                        }
                        return (
                          <Alert
                            status="info"
                            size="sm"
                            borderRadius="md"
                            py={isCompactLayout ? 1.5 : 3}
                          >
                            <AlertIcon boxSize={isCompactLayout ? 4 : 5} />
                            <AlertDescription
                              fontSize={{ base: "xs", md: "sm" }}
                            >
                              Keep building your circuit
                            </AlertDescription>
                          </Alert>
                        );
                      })()}
                    </Box>
                  </Box>

                  <Box
                    flex={1}
                    p={isCompactLayout ? 2 : 4}
                    minH={0}
                    overflowY="auto"
                    overflowX="auto"
                    maxH={
                      isCompactLayout
                        ? "calc(70vh - 160px)"
                        : `calc(90vh - ${headerHeight}px)`
                    }
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehavior: "contain",
                    }}
                  >
                    <CircuitCanvas />
                  </Box>
                </Flex>
              </Box>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }, [
    isCircuitOpen,
    onCircuitClose,
    currentChallenge,
    selectedLesson,
    isCompactLayout,
    border,
    bg,
    loadChallengeCircuit,
    validateCurrentChallenge,
    handleCheckSolution,
    gates.length,
    qubits.length,
    onGatePickerOpen,
  ]);

  const LessonDetailView = useMemo(() => {
    if (!selectedLesson) return null;
    return (
      <VStack align="stretch" spacing={6}>
        <Box>
          <Button
            variant="ghost"
            mb={4}
            onClick={() => setSelectedLesson(null)}
          >
            ← Back to Lessons
          </Button>

          <VStack align="start" spacing={2}>
            <HStack spacing={3} wrap="wrap" align="center">
              <Heading size="lg" mr={2} noOfLines={1}>
                {selectedLesson.title}
              </Heading>
              <Badge
                colorScheme={
                  selectedLesson.category === "beginner"
                    ? "green"
                    : selectedLesson.category === "intermediate"
                    ? "yellow"
                    : "red"
                }
              >
                {selectedLesson.category}
              </Badge>
            </HStack>
            <Text color="gray.500" noOfLines={2} wordBreak="break-word">
              {selectedLesson.description}
            </Text>
            <HStack fontSize="sm" color="gray.500">
              <Icon as={TimeIcon} />
              <Text>{selectedLesson.estimatedTime} minutes</Text>
            </HStack>
          </VStack>
        </Box>

        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList
            overflowX="auto"
            whiteSpace="nowrap"
            px={{ base: 1, md: 2 }}
            gap={2}
          >
            <Tab flexShrink={0}>Theory</Tab>
            <Tab flexShrink={0}>Examples</Tab>
            <Tab flexShrink={0}>
              Challenges ({selectedLesson.challenges.length})
            </Tab>
          </TabList>

          <TabPanels p={{ base: 0, md: 4 }}>
            <TabPanel p={{ base: 2, md: 4 }}>
              <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
                <Card>
                  <CardBody overflowX="auto" p={{ base: 3, md: 4 }}>
                    <Box maxW="100%">
                      <FormattedText text={selectedLesson.theory.content} />
                    </Box>
                  </CardBody>
                </Card>

                {selectedLesson.theory.equations?.length > 0 && (
                  <Card>
                    <CardHeader p={{ base: 3, md: 4 }}>
                      <Text fontWeight="bold">Key Equations</Text>
                    </CardHeader>
                    <CardBody p={{ base: 3, md: 4 }}>
                      <VStack align="stretch" spacing={4}>
                        {selectedLesson.theory.equations.map((eq, i) => (
                          <Box
                            key={i}
                            p={4}
                            borderRadius="md"
                            bg={useColorModeValue("gray.50", "gray.700")}
                            overflowX="auto"
                            display="flex"
                            justifyContent="center"
                            dangerouslySetInnerHTML={{
                              __html: katex.renderToString(eq, {
                                displayMode: true,
                                throwOnError: false,
                              }),
                            }}
                          />
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                <Card>
                  <CardHeader p={{ base: 3, md: 4 }}>
                    <Text fontWeight="bold">Learning Objectives</Text>
                  </CardHeader>
                  <CardBody p={{ base: 3, md: 4 }}>
                    <List spacing={2}>
                      {selectedLesson.learningObjectives.map((o, i) => (
                        <ListItem key={i}>
                          <ListIcon as={CheckCircleIcon} />
                          <Text wordBreak="break-word">{o}</Text>
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            <TabPanel p={{ base: 2, md: 4 }}>
              <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
                {selectedLesson.examples.map((example, i) => (
                  <Card key={i}>
                    <CardHeader p={{ base: 3, md: 4 }}>
                      <Text fontWeight="bold" noOfLines={1}>
                        {example.title}
                      </Text>
                    </CardHeader>
                    <CardBody p={{ base: 3, md: 4 }}>
                      <VStack align="stretch">
                        <FormattedText text={example.explanation} />
                        <Code
                          whiteSpace="pre-wrap"
                          p={3}
                          borderRadius="md"
                          display="block"
                          overflowX="auto"
                        >
                          {JSON.stringify(example.circuit, null, 2)}
                        </Code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadChallengeCircuit(example.circuit)}
                        >
                          Load in Circuit Builder
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>

            <TabPanel p={{ base: 2, md: 4 }}>
              <VStack align="stretch" spacing={3}>
                {selectedLesson.challenges.map((ch) => {
                  const completed = isChallengeCompleted(
                    selectedLesson.id,
                    ch.id
                  );
                  return (
                    <Card key={ch.id} opacity={completed ? 0.85 : 1}>
                      <CardBody p={{ base: 3, md: 4 }}>
                        <Stack
                          direction={{ base: "column", md: "row" }}
                          spacing={4}
                          align="center"
                          justify="space-between"
                        >
                          <Box flex={1} minW={0}>
                            <HStack spacing={3} align="start" wrap="wrap">
                              <Text
                                fontWeight="bold"
                                wordBreak="break-word"
                                noOfLines={2}
                              >
                                {ch.title}
                              </Text>
                              <Badge
                                colorScheme={difficultyColor(ch.difficulty)}
                              >
                                {ch.difficulty}
                              </Badge>
                              {completed && (
                                <Badge colorScheme="green">
                                  <Text display="inline" mr={1}>
                                    ✓
                                  </Text>
                                  Completed
                                </Badge>
                              )}
                            </HStack>
                            <Box fontSize="sm" color="gray.500" mt={2}>
                              <FormattedText text={ch.description} />
                            </Box>
                          </Box>

                          <Box width={{ base: "100%", md: "auto" }}>
                            <Button
                              size="sm"
                              colorScheme={completed ? "green" : "blue"}
                              onClick={() => startChallenge(selectedLesson, ch)}
                              rightIcon={<ChevronRightIcon />}
                              w={{ base: "100%", md: "auto" }}
                            >
                              {completed ? "Review" : "Start"}
                            </Button>
                          </Box>
                        </Stack>
                      </CardBody>
                    </Card>
                  );
                })}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    );
  }, [
    selectedLesson,
    loadChallengeCircuit,
    isChallengeCompleted,
    startChallenge,
  ]);

  return (
    <Box h="100%" overflowY="auto" bg={bg}>
      <Box p={{ base: 2, md: 6 }}>
        <Box mb={6}>
          <VStack align="start" spacing={4}>
            <HStack justify="space-between" w="100%" wrap="wrap" align="center">
              <VStack align="start" spacing={1}>
                <HStack spacing={3} wrap="wrap">
                  <Heading size="lg">Quantum Circuit Lessons</Heading>
                  <FullViewToggle />
                </HStack>
                <Text color="gray.500">
                  Master quantum computing through hands-on challenges
                </Text>
              </VStack>

              <VStack align="end" spacing={1}>
                <Text fontSize="sm" color="gray.500">
                  Overall Progress
                </Text>
                <Text fontWeight="bold" color={accent}>
                  {Math.round(overallProgress)}%
                </Text>
              </VStack>
            </HStack>

            <Progress
              value={overallProgress}
              size="lg"
              borderRadius="full"
              w="100%"
            />
          </VStack>
        </Box>

        {selectedLesson ? (
          <Box>{LessonDetailView}</Box>
        ) : (
          <VStack align="stretch" spacing={6}>
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                Choose Your Level
              </Text>
              {CategorySelector}
            </Box>

            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                {selectedCategory.charAt(0).toUpperCase() +
                  selectedCategory.slice(1)}{" "}
                Lessons
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {lessonsInCategory.map((l) => (
                  <LessonCard
                    key={l.id}
                    lesson={l}
                    isAccessible={canAccessLesson(l)}
                    progress={progressMap[l.id]}
                    onSelect={(lesson) => setSelectedLesson(lesson)}
                  />
                ))}
                {lessonsInCategory.length === 0 && (
                  <Text color="gray.500" textAlign="center">
                    No lessons available in this category yet.
                  </Text>
                )}
              </SimpleGrid>
            </Box>
          </VStack>
        )}

        {ChallengeModal}

        <GatePickerDrawer
          isOpen={isGatePickerOpen}
          onClose={onGatePickerClose}
        />
      </Box>
    </Box>
  );
}
