import React, { useCallback, useEffect, useState } from 'react'
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
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'

// --- Project Imports ---
import type { AppDispatch } from '@/store'
import { GameMode } from '@/types/qubitTouchdown'
import { playCard, startNewGame, selectQubitTouchdown } from '@/store/slices/qubitTouchdownSlice'

// --- Modular Components Imports ---
import { QubitBoard } from './QubitBoard'
import { QubitGameControls } from './QubitGameControls'

interface QubitTouchdownPageProps {
  onBack: () => void
}

export default function QubitTouchdownPage({ onBack }: QubitTouchdownPageProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { game, loading, error } = useSelector(selectQubitTouchdown)

  const [mode, setMode] = useState<GameMode>('PVP')
  const [isRulesOpen, setIsRulesOpen] = useState(false)

  const bgPage = useColorModeValue('gray.50', 'gray.900')
  const bgBoardContainer = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'white')

  const startGame = useCallback(() => {
    dispatch(startNewGame({ mode }))
  }, [dispatch, mode])

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

  useEffect(() => {
    if (!game) {
      startGame()
    }
  }, [game, startGame])

  const player1 = game?.players.find((p) => p.id === 1)
  const player2 = game?.players.find((p) => p.id === 2)

  return (
    <Box flex={1} p={4} h="100vh" overflow="hidden" bg={bgPage} color={textColor}>
      
      {/* --- Header Section --- */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Qubit Touchdown</Heading>
        <HStack spacing={3}>
          <RadioGroup
            value={mode}
            onChange={(val) => setMode(val as GameMode)}
            isDisabled={!!game && !game.is_over}
          >
            <HStack spacing={3}>
              <Radio value="PVP">2 Players</Radio>
              <Radio value="PVC">Vs Computer</Radio>
            </HStack>
          </RadioGroup>

          <Button
            colorScheme="blue"
            onClick={startGame}
            isLoading={loading}
            size="sm"
          >
            New Game
          </Button>
          
          <Button variant="ghost" onClick={() => setIsRulesOpen(true)} size="sm">
            How to Play
          </Button>
          <Button variant="outline" onClick={onBack} size="sm">
            Exit
          </Button>
        </HStack>
      </Flex>

      {/* --- Main Game Layout --- */}
      <Flex gap={6} h="calc(100vh - 100px)" direction={{ base: 'column', lg: 'row' }}>
        
        {/* Left Column: The Field 
           flex={3} makes it smaller than Controls
        */}
        <VStack 
            flex={{ base: 1, lg: 3 }} 
            spacing={4} 
            bg={bgBoardContainer} 
            p={4} 
            borderRadius="md" 
            boxShadow="sm"
            borderWidth={1}
            borderColor="whiteAlpha.200"
        >
            <Flex w="full" justify="space-between" align="center">
                <Heading size="sm">Field</Heading>
                <Text fontSize="sm" fontStyle="italic" color="yellow.500">
                    {game?.last_action || "Game Ready"}
                </Text>
            </Flex>

            <QubitBoard ballPosition={game?.ball_position} />
            
            {error && (
                <Text fontSize="sm" color="red.500" w="full" textAlign="center">
                    Error: {error}
                </Text>
            )}
        </VStack>

        {/* Right Column: Controls & Stats 
           flex={5} makes it wider (takes 5/8ths of space)
        */}
        <Box 
            flex={{ base: 1, lg: 5 }} 
            minW={{ lg: "500px" }}
        >
            <QubitGameControls 
                player1={player1}
                player2={player2}
                currentPlayerId={game?.current_player_id ?? 1}
                isGameOver={!!game?.is_over}
                remainingCards={game?.remaining_cards ?? 52}
                lastDieRoll={game?.last_die_roll ?? null}
                onPlayCard={handlePlayCard}
                gameMode={mode}
            />
        </Box>

      </Flex>

      {/* --- Rules Modal --- */}
      <Modal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How to Play</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm">
                <strong>Goal:</strong> Move the ball to your endzone. Player 1 targets <strong>(+)</strong>, Player 2 targets <strong>(-)</strong>.
              </Text>
              <Text fontSize="sm">
                <strong>Turns:</strong> Play a card (Quantum Gate) to move the ball along the paths.
              </Text>
              <Box bg="gray.100" p={3} borderRadius="md" color="black">
                 <Text fontSize="xs" fontWeight="bold">Cards:</Text>
                 <Text fontSize="xs">• <strong>H (Hadamard):</strong> Swaps Basis (0/1) ↔ Superposition (+/-)</Text>
                 <Text fontSize="xs">• <strong>X, Y, Z:</strong> Standard rotations.</Text>
                 <Text fontSize="xs">• <strong>Meas (Measurement):</strong> If ball is in superposition, it collapses to 0 or 1 randomly.</Text>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  )
}