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
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { CardType, QubitPosition,GameMode, QubitPlayer, QubitGameState} from '@/types/qubitTouchdown'
import { playCard, startNewGame,selectQubitTouchdown } from '@/store/slices/qubitTouchdownSlice'



    

interface QubitTouchdownPageProps {
  onBack: () => void
}

export default function QubitTouchdownPage({ onBack }: QubitTouchdownPageProps) {
const dispatch = useDispatch<AppDispatch>()
const { game, loading, error } = useSelector(selectQubitTouchdown)

const [mode, setMode] = useState<GameMode>('PVP')

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

  <Box flex="1" display="flex" alignItems="center" justifyContent="center">
    <VStack spacing={8}>
      {/* Top endzone: + */}
      <Box display="flex" justifyContent="center">
        {renderBoardCircle('+')}
      </Box>

      {/* Mid row: 0 and +i */}
      <HStack spacing={10}>
        {renderBoardCircle('0')}
        {renderBoardCircle('+i')}
      </HStack>

      {/* Lower mid row: -i and 1 */}
      <HStack spacing={10}>
        {renderBoardCircle('-i')}
        {renderBoardCircle('1')}
      </HStack>

      {/* Bottom endzone: - */}
      <Box display="flex" justifyContent="center">
        {renderBoardCircle('-')}
      </Box>
    </VStack>
  </Box>

  <Box>
    <Text fontSize="sm" fontWeight="bold">
      Cards remaining: {game?.remaining_cards ?? 52}
    </Text>
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

        {/* Right: quick rules summary (shortened version of your text) */}
        <Box flex="0 0 320px" maxH="100%" overflowY="auto">
          <Heading size="sm" mb={2}>
            How to play
          </Heading>
          <Text fontSize="sm" mb={2}>
            Qubit Touchdown is a 2-player, football themed game where each move
            is a quantum gate on a single qubit.
          </Text>
          <Text fontSize="sm" mb={1} fontWeight="bold">
            Goal
          </Text>
          <Text fontSize="sm" mb={2}>
            Player 1 tries to bring the ball to +, Player 2 to -. Each arrival
            is a touchdown. After a touchdown, the scorer kicks off by sending
            the ball to 0 or 1 at random.
          </Text>
          <Text fontSize="sm" mb={1} fontWeight="bold">
            Turn
          </Text>
          <Text fontSize="sm" mb={2}>
            On your turn, play one card, move the ball according to that gate,
            draw a new card, then check for a touchdown. The game ends after all
            52 cards have been used.
          </Text>
          <Text fontSize="sm" mb={1} fontWeight="bold">
            Measurement
          </Text>
          <Text fontSize="sm" mb={2}>
            If the ball is at 0 or 1, measurement does nothing. Otherwise, it
            sends the ball to 0 or 1 with a 50-50 chance (binary die).
          </Text>
          <Text fontSize="sm">
            Under the hood, the 6 positions correspond to 6 points on the Bloch
            sphere, and the cards are gates (X, Y, Z, H, S, sqrt(X), I) acting
            on a single qubit.
          </Text>
        </Box>
      </Flex>
    </Box>
  )
}
