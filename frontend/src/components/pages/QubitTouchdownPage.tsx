import React, { useCallback, useEffect, useState, useRef } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Radio,
  RadioGroup,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/store'
import {
  playCard,
  startNewGame,
  selectQubitTouchdown,
  resolveRoll,
  clearError,
} from '@/store/slices/qubitTouchdownSlice'
import { QubitBoard } from './QubitBoard'
import { QubitGameControls } from './QubitGameControls'
import { getCpuMoveCardId, CPU_DELAY } from '../../logic/qubit_logic'

export default function QubitTouchdownPage({ onBack }: { onBack: () => void }) {
  const dispatch = useDispatch<AppDispatch>()
  const { game, loading, error } = useSelector(selectQubitTouchdown)
  const toast = useToast()
  const cpuTimerRef = useRef<any>(null)

  const [mode, setMode] = useState<'PVP' | 'PVC'>('PVC')
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [isEndModalOpen, setIsEndModalOpen] = useState(false)

  const bgPage = useColorModeValue('gray.900', 'gray.900')
  const bgPanel = 'gray.800'

  const handleStartGame = (newMode: 'PVP' | 'PVC') => {
    setIsEndModalOpen(false)
    dispatch(startNewGame({ mode: newMode }))
  }

  const handlePlayCard = (cardId: string) => {
    if (!game || game.is_over || game.isDiceRolling) return
    dispatch(
      playCard({
        gameId: game.game_id,
        playerId: game.current_player_id,
        cardId,
      }),
    )
  }

  const handleRollEnd = () => {
    if (!game) return
    dispatch(resolveRoll({ gameId: game.game_id }))
  }

  // CPU Logic
  useEffect(() => {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current)
    if (
      !game ||
      game.is_over ||
      game.mode !== 'PVC' ||
      game.current_player_id !== 2 ||
      game.isDiceRolling
    )
      return

    cpuTimerRef.current = setTimeout(() => {
      // re-check current player when timer fires
      if (game && game.current_player_id === 2) {
        const cardId = getCpuMoveCardId(game)
        if (cardId) {
          dispatch(
            playCard({
              gameId: game.game_id,
              playerId: 2,
              cardId,
            }),
          )
        }
      }
    }, CPU_DELAY)

    return () => {
      if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current)
    }
  }, [
    game?.current_player_id,
    game?.game_id,
    game?.mode,
    game?.ballPosition,
    game?.isDiceRolling,
    game?.is_over,
    dispatch,
  ])

  // Start initial game when component mounts / mode changes
  useEffect(() => {
    if (!game) handleStartGame(mode)
  }, [game, mode])

  // Error toast
  useEffect(() => {
    if (error) {
      toast({ title: 'Error', description: error, status: 'error' })
      dispatch(clearError())
    }
  }, [error, toast, dispatch])

  // Open winning / end-of-game popup when game finishes
  useEffect(() => {
    if (game?.is_over) {
      setIsEndModalOpen(true)
    }
  }, [game?.is_over])

  const player1 = game?.players[1]
  const player2 = game?.players[2]
  const playersArray = game?.players ? [null, player1, player2] : []

  const p1Score = player1?.touchdowns ?? 0
  const p2Score = player2?.touchdowns ?? 0

  let winnerTitle = ''
  let winnerSubtitle = ''

  if (game?.is_over) {
    if (p1Score > p2Score) {
      winnerTitle = `${player1?.name ?? 'Player 1'} Wins!`
      winnerSubtitle = `${p1Score} – ${p2Score}`
    } else if (p2Score > p1Score) {
      winnerTitle = `${player2?.name ?? 'Player 2'} Wins!`
      winnerSubtitle = `${p2Score} – ${p1Score}`
    } else {
      winnerTitle = 'It’s a Tie!'
      winnerSubtitle = `${p1Score} – ${p2Score}`
    }
  }

  return (
    <Box h="100vh" w="100vw" overflow="hidden" bg={bgPage} color="white" p={2}>
      {/* HEADER */}
      <Flex
        h="60px"
        align="center"
        justify="space-between"
        px={4}
        bg={bgPanel}
        borderRadius="md"
        mb={2}
      >
        <Heading size="sm">QUBIT TOUCHDOWN</Heading>

        <Text fontSize="sm" color="yellow.300" fontWeight="bold" noOfLines={1} maxW="40%">
          {game?.lastAction || 'Initializing...'}
        </Text>

        <HStack spacing={3}>
          <RadioGroup
            onChange={(val) => setMode(val as 'PVP' | 'PVC')}
            value={mode}
          >
            <HStack spacing={3} bg="blackAlpha.400" p={1} borderRadius="md">
              <Radio value="PVP" size="sm" onClick={() => handleStartGame('PVP')}>
                2P
              </Radio>
              <Radio value="PVC" size="sm" onClick={() => handleStartGame('PVC')}>
                CPU
              </Radio>
            </HStack>
          </RadioGroup>

          <Button size="xs" colorScheme="green" onClick={() => handleStartGame(mode)}>
            New Game
          </Button>
          <Button size="xs" variant="outline" onClick={() => setIsRulesOpen(true)}>
            Rules
          </Button>
          <Button size="xs" variant="ghost" onClick={onBack}>
            Exit
          </Button>
        </HStack>
      </Flex>

      {/* MAIN LAYOUT */}
      <Flex h="calc(100vh - 80px)" gap={2} direction={{ base: 'column', lg: 'row' }}>
        <Box flex={2} bg={bgPanel} borderRadius="md" position="relative" p={2}>
          <QubitBoard ballPosition={game?.ballPosition} players={playersArray as any} />
        </Box>

        <Box flex={3} minW="450px">
          <QubitGameControls
            player1={player1}
            player2={player2}
            currentPlayerId={game?.current_player_id ?? 1}
            isGameOver={!!game?.is_over}
            remainingCards={game?.deck?.length ?? 52}
            lastDieRoll={game?.lastDieRoll ?? null}
            rollTrigger={game?.rollTrigger ?? 0}
            isDiceRolling={game?.isDiceRolling ?? false}
            onPlayCard={handlePlayCard}
            onRollAnimationEnd={handleRollEnd}
            gameMode={game?.mode || mode}
          />
        </Box>
      </Flex>

      {/* RULES MODAL */}
      <Modal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.700" color="white">
          <ModalHeader>Rules</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm">
                <strong>Start:</strong> Roll die (0/1). Player 1&apos;s goal is the opposite pole.
              </Text>
              <Text fontSize="sm">
                <strong>Score:</strong> Move the ball into the OPPONENT&apos;S endzone to score.
                Moving it into your own endzone is a Safety (opponent scores).
              </Text>
              <Text fontSize="sm">
                <strong>Measurement card:</strong> If the ball is on +, −, +i, or −i, it collapses
                it to 0 or 1 (with a die roll). On 0 or 1, it does nothing.
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* WINNING / END-OF-GAME MODAL */}
      <Modal
        isOpen={!!game && game.is_over && isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        isCentered
      >
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg="gray.900" color="white" borderWidth="1px" borderColor="yellow.400">
          <ModalHeader textAlign="center" pb={1}>
            {winnerTitle || 'Game Over'}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text textAlign="center" fontSize="lg" fontWeight="bold" color="yellow.300">
                {winnerSubtitle}
              </Text>

              <Flex justify="space-between" fontSize="sm">
                <Box>
                  <Text fontWeight="bold" color="blue.300">
                    {player1?.name ?? 'Player 1'}
                  </Text>
                  <Text>Touchdowns: {p1Score}</Text>
                  <Text fontSize="xs" color="gray.400">
                    Goal: {player1?.endzone ?? '-'}
                  </Text>
                </Box>

                <Box textAlign="right">
                  <Text fontWeight="bold" color="purple.300">
                    {player2?.name ?? 'Player 2'}
                  </Text>
                  <Text>Touchdowns: {p2Score}</Text>
                  <Text fontSize="xs" color="gray.400">
                    Goal: {player2?.endzone ?? '-'}
                  </Text>
                </Box>
              </Flex>

              <Text fontSize="xs" color="gray.400">
                You can start a new game in the same mode, or switch between 2P and CPU using the
                controls in the top bar.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEndModalOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                onClick={() => handleStartGame(mode)}
              >
                Play Again ({mode === 'PVC' ? 'vs CPU' : '2P'})
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
