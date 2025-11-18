import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Box, Button, Flex, Heading, HStack, Radio, RadioGroup, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, useColorModeValue, useToast } from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/store' 
import { playCard, startNewGame, selectQubitTouchdown, resolveRoll, clearError } from '@/store/slices/qubitTouchdownSlice'
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
  const bgPage = useColorModeValue('gray.900', 'gray.900')
  const bgPanel = 'gray.800'

  const handleStartGame = (newMode: 'PVP' | 'PVC') => dispatch(startNewGame({ mode: newMode }));
  
  const handlePlayCard = (cardId: string) => {
    if (!game || game.is_over || game.isDiceRolling) return;
    dispatch(playCard({ gameId: game.game_id, playerId: game.current_player_id, cardId }));
  };

  const handleRollEnd = () => dispatch(resolveRoll({ gameId: game?.game_id }));

  // CPU Logic
  useEffect(() => {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    if (!game || game.is_over || game.mode !== 'PVC' || game.current_player_id !== 2 || game.isDiceRolling) return;
    
    cpuTimerRef.current = setTimeout(() => {
      if (game.current_player_id === 2) {
        const cardId = getCpuMoveCardId(game);
        if (cardId) dispatch(playCard({ gameId: game.game_id, playerId: 2, cardId }));
      }
    }, CPU_DELAY);
    
    return () => { if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current); };
  }, [game?.current_player_id, game?.game_id, game?.mode, game?.ballPosition, game?.isDiceRolling, dispatch]);

  useEffect(() => { if (!game) handleStartGame(mode); }, [game, mode]);

  useEffect(() => { 
      if (error) { 
          toast({ title: 'Error', description: error, status: 'error' }); 
          dispatch(clearError()); 
      } 
  }, [error, toast, dispatch]);

  const player1 = game?.players[1];
  const player2 = game?.players[2];
  const playersArray = game?.players ? [null, player1, player2] : [];

  return (
    <Box h="100vh" w="100vw" overflow="hidden" bg={bgPage} color="white" p={2}>
      <Flex h="60px" align="center" justify="space-between" px={4} bg={bgPanel} borderRadius="md" mb={2}>
        <Heading size="sm">QUBIT TOUCHDOWN</Heading>
        <Text fontSize="sm" color="yellow.300" fontWeight="bold">{game?.lastAction || "Initializing..."}</Text>
        <HStack spacing={3}>
           <RadioGroup onChange={(val) => setMode(val as any)} value={mode}>
              <HStack spacing={3} bg="blackAlpha.400" p={1} borderRadius="md">
                <Radio value="PVP" size="sm" onClick={() => handleStartGame('PVP')}>2P</Radio>
                <Radio value="PVC" size="sm" onClick={() => handleStartGame('PVC')}>CPU</Radio>
              </HStack>
           </RadioGroup>
           <Button size="xs" colorScheme="green" onClick={() => handleStartGame(mode)}>New Game</Button>
           <Button size="xs" variant="outline" onClick={() => setIsRulesOpen(true)}>Rules</Button>
           <Button size="xs" variant="ghost" onClick={onBack}>Exit</Button>
        </HStack>
      </Flex>

      <Flex h="calc(100vh - 80px)" gap={2} direction={{ base: 'column', lg: 'row' }}>
        <Box flex={2} bg={bgPanel} borderRadius="md" position="relative" p={2}>
            <QubitBoard ballPosition={game?.ballPosition} players={playersArray} />
        </Box>
        <Box flex={3} minW="450px">
            <QubitGameControls 
                player1={player1} player2={player2} currentPlayerId={game?.current_player_id ?? 1}
                isGameOver={!!game?.is_over} remainingCards={game?.deck?.length ?? 52}
                lastDieRoll={game?.lastDieRoll ?? null} rollTrigger={game?.rollTrigger ?? 0}
                isDiceRolling={game?.isDiceRolling ?? false} onPlayCard={handlePlayCard}
                onRollAnimationEnd={handleRollEnd} gameMode={game?.mode || mode}
            />
        </Box>
      </Flex>
      
      <Modal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.700" color="white">
          <ModalHeader>Rules</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
             <VStack align="stretch" spacing={3}>
               <Text fontSize="sm"><strong>Start:</strong> Roll die (0/1). P1 Goal is opposite pole.</Text>
               <Text fontSize="sm"><strong>Score:</strong> Reach OPPONENT'S endzone to score. Own endzone = Safety (Opponent scores).</Text>
             </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}