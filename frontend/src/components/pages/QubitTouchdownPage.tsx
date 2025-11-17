import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { CardType, QubitPosition,GameMode, QubitPlayer, QubitGameState} from '@/types/qubitTouchdown'
import { playCard, startNewGame,selectQubitTouchdown } from '@/store/slices/qubitTouchdownSlice'



const NODE_POSITIONS: Record<QubitPosition, { top: string; left: string }> = {
  '+': { top: '5%', left: '50%' },
  '0': { top: '30%', left: '25%' },
  '+i': { top: '30%', left: '75%' },
  '-i': { top: '60%', left: '25%' },
  '1': { top: '60%', left: '75%' },
  '-': { top: '85%', left: '50%' },
}

type Edge = {
  from: QubitPosition
  to: QubitPosition
  label: string
}

// very rough: not every single edge from the real board, but enough to show idea
const EDGES: Edge[] = [
  { from: '0', to: '+', label: 'H' },
  { from: '1', to: '-', label: 'H' },
  { from: '0', to: '1', label: 'X' },
  { from: '1', to: '0', label: 'X' },
  { from: '+', to: '+i', label: 'S' },
  { from: '-', to: '-i', label: 'S' },
  { from: '+i', to: '-i', label: 'X/Y' },
  { from: '-i', to: '+i', label: 'X/Y' },
  // add more if you like
]

function BoardNode({ pos }: { pos: QubitPosition }) {
  const { game } = useSelector(selectQubitTouchdown) // or pass game as prop if you prefer
  const isBallHere = game?.ball_position === pos
  const node = NODE_POSITIONS[pos]

  return (
    <Box
      position="absolute"
      top={node.top}
      left={node.left}
      transform="translate(-50%, -50%)"
    >
      <Box
        w="70px"
        h="70px"
        borderRadius="full"
        bg={isBallHere ? 'yellow.500' : 'yellow.300'}
        color="black"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderWidth={3}
        borderColor={isBallHere ? 'orange.500' : 'yellow.600'}
        fontWeight="bold"
        boxShadow={isBallHere ? '0 0 12px rgba(255, 255, 0, 0.8)' : 'none'}
      >
        {pos}
      </Box>
    </Box>
  )
}

function EdgeArrow({ edge }: { edge: Edge }) {
  const from = NODE_POSITIONS[edge.from]
  const to = NODE_POSITIONS[edge.to]

  // convert top/left percentages to approximate numbers [0,100]
  const fx = parseFloat(from.left)
  const fy = parseFloat(from.top)
  const tx = parseFloat(to.left)
  const ty = parseFloat(to.top)

  const dx = tx - fx
  const dy = ty - fy
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI

  const midTop = (fy + ty) / 2
  const midLeft = (fx + tx) / 2

  return (
    <Box
      position="absolute"
      top={`${midTop}%`}
      left={`${midLeft}%`}
      w={`${length}%`}
      h="2px"
      bg="whiteAlpha.700"
      transform={`translate(-50%, -50%) rotate(${angle}deg)`}
      transformOrigin="center"
    >
      <Text
        fontSize="xs"
        position="absolute"
        top="-14px"
        left="50%"
        transform="translateX(-50%)"
        color="white"
        fontWeight="bold"
      >
        {edge.label}
      </Text>
    </Box>
  )
}

    

interface QubitTouchdownPageProps {
  onBack: () => void
}

export default function QubitTouchdownPage({ onBack }: QubitTouchdownPageProps) {
const dispatch = useDispatch<AppDispatch>()
const { game, loading, error } = useSelector(selectQubitTouchdown)

const [mode, setMode] = useState<GameMode>('PVP')
const [isRulesOpen, setIsRulesOpen] = useState(true)

const bgBoard = useColorModeValue('green.700', 'green.900')
const circleBg = useColorModeValue('white', 'gray.800')
const circleActiveBg = useColorModeValue('blue.500', 'blue.300')
const circleActiveColor = useColorModeValue('white', 'gray.900')



// start a game
const startGame = useCallback(() => {
  dispatch(startNewGame({ mode }))
}, [dispatch, mode])

// play a card
const handlePlayCard = (cardId: string) => {
  if (!game || game.is_over) return
  dispatch(
    playCard({
      gameId: game.game_id,
      playerId: game.current_player_id,
      cardId,
    }),
  )
}

// Optionally auto-start a default game when page opens
useEffect(() => {
  if (!game) {
    startGame()
  }
}, [game, startGame])

const renderBoardCircle = (pos: QubitPosition) => {
  const isBallHere = game?.ball_position === pos
  return (
    <Box
      w="70px"
      h="70px"
      borderRadius="full"
      bg={isBallHere ? 'yellow.500' : 'yellow.300'}
      color="black"
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderWidth={3}
      borderColor={isBallHere ? 'orange.500' : 'yellow.600'}
      fontWeight="bold"
      boxShadow={isBallHere ? '0 0 12px rgba(255, 255, 0, 0.8)' : 'none'}
    >
      {pos}
    </Box>
  )
}


  
  const player1 = game?.players.find((p) => p.id === 1)
  const player2 = game?.players.find((p) => p.id === 2)

  return (
    <Box flex={1} p={4} overflow="hidden">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Qubit Touchdown</Heading>
        <HStack spacing={3}>
          <RadioGroup
            value={mode}
            onChange={(val) => setMode(val as GameMode)}
            isDisabled={!!game && !game.is_over}
          >
            <HStack spacing={3}>
              <Radio value="PVP">2 players</Radio>
              <Radio value="PVC">Vs computer</Radio>
            </HStack>
          </RadioGroup>
          <Button
            colorScheme="blue"
            onClick={startGame}
            isLoading={loading}
            variant="solid"
          >
            New game
          </Button>
          <Button variant="ghost" onClick={() => setIsRulesOpen(true)}>
        How to play
        </Button>
          <Button variant="outline" onClick={onBack}>
            Back to circuit builder
          </Button>
        </HStack>
      </Flex>

      <Flex gap={6} h="calc(100vh - 120px)">
        {/* Left: board + status */}
<VStack
  align="stretch"
  flex="1"
  spacing={4}
  bg={bgBoard}
  borderRadius="md"
  p={4}
>
  <Heading size="sm" mb={2}>
    Field
  </Heading>

  <Box
    flex="1"
    position="relative"
    borderRadius="md"
    borderWidth={1}
    borderColor="whiteAlpha.500"
    overflow="hidden"
  >
    {/* Edges layer */}
    {EDGES.map((edge, idx) => (
      <EdgeArrow key={idx} edge={edge} />
    ))}

    {/* Nodes layer */}
    {(Object.keys(NODE_POSITIONS) as QubitPosition[]).map((pos) => (
      <BoardNode key={pos} pos={pos} />
    ))}
  </Box>
  <Box>
    <Text fontSize="sm" fontWeight="bold">
      Cards remaining: {game?.remaining_cards ?? 52}
    </Text>

    {game && (
  <HStack mt={2} spacing={2}>
    <Text fontSize="sm" fontWeight="bold">
      Die:
    </Text>
    <Box
      w="32px"
      h="32px"
      borderRadius="md"
      borderWidth={2}
      borderColor="whiteAlpha.700"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontWeight="bold"
      bg="whiteAlpha.200"
    >
      {game.last_die_roll ?? '–'}
    </Box>
  </HStack>
)}

    {game?.last_action && (
      <Text fontSize="sm" mt={1}>
        {game.last_action}
      </Text>
    )}
    {game?.is_over && (
      <Text mt={2} fontWeight="bold" color="green.400">
        Game over - highest touchdowns wins!
      </Text>
    )}
    {error && (
      <Text mt={2} color="red.400">
        {error}
      </Text>
    )}
  </Box>
</VStack>


        {/* Middle: hands and scoreboard */}
        <VStack align="stretch" flex="1" spacing={4}>
          <Box>
            <Heading size="sm" mb={2}>
              Scoreboard
            </Heading>
            <VStack align="stretch" spacing={2}>
              {player1 && (
                <HStack justify="space-between">
                  <Text fontWeight="bold">
                    {player1.name} (endzone {player1.endzone})
                  </Text>
                  <Text>Touchdowns: {player1.touchdowns}</Text>
                </HStack>
              )}
              {player2 && (
                <HStack justify="space-between">
                  <Text fontWeight="bold">
                    {player2.name} (endzone {player2.endzone})
                  </Text>
                  <Text>Touchdowns: {player2.touchdowns}</Text>
                </HStack>
              )}
              {game && (
                <Text fontSize="sm" mt={2}>
                  Current turn: Player {game.current_player_id}
                </Text>
              )}
            </VStack>
          </Box>

          <Box>
            <Heading size="sm" mb={2}>
              Hands
            </Heading>
            <VStack align="stretch" spacing={4}>
              {player1 && (
                <Box>
                  <Text mb={1} fontWeight="bold">
                    {player1.name}
                  </Text>
                  <HStack spacing={2} wrap="wrap">
                    {player1.hand.map((card) => (
                     <Button
                    key={card.id}
                    size="sm"
                    variant={game?.current_player_id === 1 ? 'solid' : 'outline'}
                    colorScheme={game?.current_player_id === 1 ? 'blue' : 'gray'}
                    onClick={() => handlePlayCard(card.id)}
                    isDisabled={
                        !game ||
                        game.is_over ||
                        game.current_player_id !== 1 ||
                        loading
                    }
                    >
                    {card.type}
                    </Button>
                    ))}
                    {player1.hand.length === 0 && (
                      <Text fontSize="xs" color="gray.400">
                        No cards left
                      </Text>
                    )}
                  </HStack>
                </Box>
              )}

              {player2 && (
                <Box>
                  <Text mb={1} fontWeight="bold">
                    {player2.name}
                    {game?.mode === 'PVC' ? ' (computer)' : ''}
                  </Text>
                  <HStack spacing={2} wrap="wrap">
                    {player2.hand.map((card) => (
                      <Button
                    key={card.id}
                    size="sm"
                    variant={game?.current_player_id === 2 ? 'solid' : 'outline'}
                    colorScheme={game?.current_player_id === 2 ? 'purple' : 'gray'}
                    onClick={() => handlePlayCard(card.id)}
                    isDisabled={
                        !game ||
                        game.is_over ||
                        game.current_player_id !== 2 ||
                        loading ||
                        game.mode === 'PVC' // human cannot play computer's cards
                    }
                    >
                    {card.type}
                    </Button>
                    ))}
                    {player2.hand.length === 0 && (
                      <Text fontSize="xs" color="gray.400">
                        No cards left
                      </Text>
                    )}
                  </HStack>
                </Box>
              )}
            </VStack>
          </Box>
        </VStack>
      </Flex>
      <Modal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} size="xl">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>How to play Qubit Touchdown</ModalHeader>
    <ModalCloseButton />
    <ModalBody pb={6}>
      <VStack align="stretch" spacing={3}>
        <Text fontSize="sm">
          Qubit Touchdown is a 2-player, football-themed game where each move
          is a quantum gate on a single qubit.
        </Text>
        <Text fontSize="sm" fontWeight="bold">
          Goal
        </Text>
        <Text fontSize="sm">
          Player 1 scores by bringing the ball to +, Player 2 by bringing it to
          −. Each arrival is a touchdown. After a touchdown, the scorer kicks
          off by sending the ball randomly to 0 or 1.
        </Text>
        <Text fontSize="sm" fontWeight="bold">
          Turn
        </Text>
        <Text fontSize="sm">
          On your turn, play one card, move the ball according to that gate,
          draw a new card, then check for a touchdown. The game ends after all
          52 cards have been used.
        </Text>
        <Text fontSize="sm" fontWeight="bold">
          Measurement
        </Text>
        <Text fontSize="sm">
          If the ball is at 0 or 1, measurement does nothing. Otherwise, it
          sends the ball to 0 or 1 with a 50–50 chance (binary die).
        </Text>
      </VStack>
    </ModalBody>
  </ModalContent>
</Modal>

    </Box>
  )
}
