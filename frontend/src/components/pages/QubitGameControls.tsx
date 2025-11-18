import React, { useEffect, useState } from 'react'
import { Box, HStack, Text, VStack, Heading, Badge, Image, keyframes } from '@chakra-ui/react'
import { QubitPlayer } from '@/types/qubitTouchdown'

// --- 1. Import Images (Assuming these paths are correct in your src) ---
import HCard from 'public/assets/cards/H'
import XCard from '/assets/cards/PauliX.png'
import YCard from '../assets/cards/PauliY.png'
import ZCard from '../assets/cards/PauliZ.png'
import SCard from '../assets/cards/S.png'
import MeasCard from '../assets/cards/Measurement.png'
import SqrtXCard from '../assets/cards/SqrtX.png'
import ICard from '../assets/cards/I.png' 
import BackCard from '../assets/cards/Back.png'

// --- 2. Map Logic ---
const CARD_IMAGES: Record<string, string> = {
  'H': HCard, 'X': XCard, 'Y': YCard, 'Z': ZCard, 'S': SCard,
  'I': ICard, 'Meas': MeasCard, 'Measurement': MeasCard,
  '√X': SqrtXCard, 'rootx': SqrtXCard, 'SQRT_X': SqrtXCard,
  'H Gate': HCard, 'S Gate': SCard, 'Pauli X': XCard, 'Pauli Y': YCard, 'Pauli Z': ZCard,
  'Sqrt_X Gate': SqrtXCard, 'Sqrt_X': SqrtXCard,
}

// --- Animations ---
const rollAnimation = keyframes`
  0% { transform: rotateX(0deg) rotateY(0deg); }
  25% { transform: rotateX(180deg) rotateY(90deg); }
  50% { transform: rotateX(360deg) rotateY(180deg); }
  75% { transform: rotateX(540deg) rotateY(270deg); }
  100% { transform: rotateX(720deg) rotateY(360deg); }
`

// --- Sub-Component: Dice ---
const DiceComponent = ({ value, rolling }: { value: number | null; rolling: boolean }) => {
  if (value === null) return <Box w="40px" h="40px" opacity={0.2} bg="gray.600" borderRadius="md" />;

  return (
    <Box
      w="40px" h="40px"
      bg="white"
      borderRadius="md"
      display="flex" alignItems="center" justifyContent="center"
      boxShadow="0 4px 8px rgba(0,0,0,0.3)"
      border="2px solid #333"
      animation={rolling ? `${rollAnimation} 0.5s ease-in-out` : 'none'}
    >
      <Text fontSize="xl" fontWeight="black" color="black">
        {value}
      </Text>
    </Box>
  )
}

// --- Sub-Component: Card ---
const CardButton = ({ 
    card, canPlay, isFaceUp, onClick 
}: { 
    card: { id: string; type: string }; 
    canPlay: boolean; 
    isFaceUp: boolean;
    onClick: () => void 
}) => {
  const mappedImage = CARD_IMAGES[card.type];
  const imageSrc = isFaceUp ? (mappedImage || BackCard) : BackCard;

  return (
    <Box
      as="button"
      onClick={onClick}
      disabled={!canPlay}
      position="relative"
      width="120px"  
      height="168px" 
      transition="all 0.2s ease-in-out"
      cursor={canPlay ? 'pointer' : 'default'}
      opacity={canPlay || (!canPlay && isFaceUp) ? 1 : 0.8}
      filter={!canPlay && isFaceUp ? 'grayscale(0.6)' : 'none'}
      _hover={{
        transform: canPlay ? 'translateY(-10px) scale(1.05)' : 'none',
        zIndex: 10, 
        boxShadow: canPlay ? '0 0 15px rgba(66, 153, 225, 0.6)' : 'none',
      }}
    >
      <Image 
        src={imageSrc} 
        alt={card.type} 
        w="100%" h="100%" 
        objectFit="contain" 
        draggable={false}
        fallbackSrc="https://via.placeholder.com/120x168?text=Card"
      />
    </Box>
  )
}

// --- Main Component ---

interface QubitGameControlsProps {
  player1: Player | undefined
  player2: Player | undefined
  currentPlayerId: number
  isGameOver: boolean
  remainingCards: number
  lastDieRoll: number | null
  onPlayCard: (cardId: string) => void
  gameMode: 'PVP' | 'PVC'
}

export const QubitGameControls = ({
  player1, player2, currentPlayerId, isGameOver,
  remainingCards, lastDieRoll, onPlayCard, gameMode
}: QubitGameControlsProps) => {
  
  const [isRolling, setIsRolling] = useState(false)
  const [displayRoll, setDisplayRoll] = useState<number | null>(null)

  // Handle Dice Animation
  useEffect(() => {
    if (lastDieRoll !== null) {
      setIsRolling(true)
      setTimeout(() => {
        setDisplayRoll(lastDieRoll)
        setIsRolling(false)
      }, 500) 
    }
  }, [lastDieRoll])

  return (
    <VStack align="stretch" flex="1" spacing={4} p={4} bg="gray.800" borderRadius="md" h="100%">
      
      {/* --- Scoreboard Section --- */}
      <HStack bg="gray.700" p={3} borderRadius="md" boxShadow="inner" justify="space-between" align="center">
        
        {/* P1 Score */}
        <VStack align="start" spacing={0}>
            <Text fontSize="xs" color="blue.300" fontWeight="bold">PLAYER 1 (+)</Text>
            <Text fontSize="3xl" fontWeight="black" color="white">{player1?.touchdowns ?? 0}</Text>
        </VStack>

        {/* Center Info */}
        <VStack spacing={1}>
            <Text fontSize="xs" color="gray.400" fontWeight="bold">DECK LEFT: {remainingCards}</Text>
            <HStack>
                <Text fontSize="xs" color="gray.500">LAST ROLL:</Text>
                <DiceComponent value={displayRoll} rolling={isRolling} />
            </HStack>
        </VStack>

        {/* P2 Score */}
        <VStack align="end" spacing={0}>
            <Text fontSize="xs" color="purple.300" fontWeight="bold">PLAYER 2 (-)</Text>
            <Text fontSize="3xl" fontWeight="black" color="white">{player2?.touchdowns ?? 0}</Text>
        </VStack>
      </HStack>

      {/* --- Hands Section --- */}
      <Box flex="1" overflowY="auto" className="custom-scrollbar" pr={2}>
        
        {/* Player 1 Hand */}
        <Box mb={6} p={2} bg={currentPlayerId === 1 ? 'whiteAlpha.100' : 'transparent'} borderRadius="md">
             <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color="blue.200">{player1?.name}</Text>
                {currentPlayerId === 1 && !isGameOver && <Badge colorScheme="blue">YOUR TURN</Badge>}
             </HStack>
             <HStack wrap="wrap" spacing={3} align="start">
                {player1?.hand.map(card => (
                    <CardButton 
                        key={card.id} 
                        card={card}
                        isFaceUp={true} 
                        canPlay={currentPlayerId === 1 && !isGameOver}
                        onClick={() => onPlayCard(card.id)}
                    />
                ))}
                {player1?.hand.length === 0 && <Text fontSize="xs" color="gray.500">No Cards</Text>}
             </HStack>
        </Box>

        {/* Player 2 Hand */}
        <Box p={2} bg={currentPlayerId === 2 ? 'whiteAlpha.100' : 'transparent'} borderRadius="md">
             <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color="purple.200">{player2?.name}</Text>
                {currentPlayerId === 2 && !isGameOver && (
                    <Badge colorScheme="purple">{gameMode === 'PVC' ? 'CPU THINKING...' : 'YOUR TURN'}</Badge>
                )}
             </HStack>
             <HStack wrap="wrap" spacing={3} align="start">
                {player2?.hand.map(card => (
                    <CardButton 
                        key={card.id} 
                        card={card}
                        // Show cards if it's P2 turn, OR game over, OR if it's a CPU game (optional visibility)
                        // Standard rule: Hide opponent cards if PVP.
                        isFaceUp={currentPlayerId === 2 || isGameOver || gameMode === 'PVC'}
                        canPlay={currentPlayerId === 2 && !isGameOver && gameMode !== 'PVC'}
                        onClick={() => onPlayCard(card.id)}
                    />
                ))}
                {player2?.hand.length === 0 && <Text fontSize="xs" color="gray.500">No Cards</Text>}
             </HStack>
        </Box>

      </Box>
    </VStack>
  )
}