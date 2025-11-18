import React from 'react'
import { Box, HStack, Text, VStack, Heading, Badge, Image } from '@chakra-ui/react'
import { Player } from '@/types/qubitTouchdown'

// --- 1. Import Images ---
import HCard from '../assets/cards/H.png'
import XCard from '../assets/cards/PauliX.png'
import YCard from '../assets/cards/PauliY.png'
import ZCard from '../assets/cards/PauliZ.png'
import SCard from '../assets/cards/S.png'
import MeasCard from '../assets/cards/Measurement.png'
import SqrtXCard from '../assets/cards/SqrtX.png'
import ICard from '../assets/cards/I.png' 
import BackCard from '../assets/cards/Back.png'

// --- 2. Map Logic to Imported Images ---
const CARD_IMAGES: Record<string, string> = {
  // Short Names
  'H': HCard,
  'X': XCard,
  'Y': YCard,
  'Z': ZCard,
  'S': SCard,
  'I': ICard,
  'Meas': MeasCard,
  'Measurement': MeasCard,
  '√X': SqrtXCard,
  'rootx': SqrtXCard,
  
  // Long Names
  'H Gate': HCard,
  'S Gate': SCard,
  'Pauli X Gate': XCard,
  'Pauli X': XCard,
  'Pauli Y Gate': YCard,
  'Pauli Y': YCard,
  'Pauli Z Gate': ZCard,
  'Pauli Z': ZCard,
  'I Gate': ICard,
  'Identity Gate': ICard,
  'Measurement Gate': MeasCard,
  'Sqrt_X Gate': SqrtXCard,
  'Sqrt_X': SqrtXCard,
  'SqrtX Gate': SqrtXCard,
}

// --- Sub-Component: Card Image Button ---
const CardButton = ({ 
    card, 
    canPlay, 
    isFaceUp, 
    onClick 
}: { 
    card: { id: string; type: string }; 
    canPlay: boolean; 
    isFaceUp: boolean;
    onClick: () => void 
}) => {
  const mappedImage = CARD_IMAGES[card.type];
  const imageSrc = isFaceUp ? (mappedImage || BackCard) : BackCard;
  const isMissingImage = isFaceUp && !mappedImage;

  return (
    <Box
      as="button"
      onClick={onClick}
      disabled={!canPlay}
      // --- Styling ---
      position="relative"
      width="120px"        // CHANGED: Bigger width (was 80px)
      height="168px"       // CHANGED: Bigger height (was 112px)
      transition="all 0.2s ease-in-out"
      cursor={canPlay ? 'pointer' : 'default'}
      opacity={canPlay || !isFaceUp ? 1 : 0.7}
      filter={canPlay || !isFaceUp ? 'none' : 'grayscale(100%) contrast(80%)'}
      _hover={{
        transform: canPlay ? 'scale(1.05) translateY(-10px)' : 'none',
        zIndex: 10, 
        boxShadow: canPlay ? '0 0 25px rgba(66, 153, 225, 0.6)' : 'none',
      }}
      _active={{
        transform: canPlay ? 'scale(0.98)' : 'none',
      }}
    >
      <Image 
        src={imageSrc} 
        alt={isFaceUp ? `${card.type}` : "Card Back"} 
        w="100%"
        h="100%"
        objectFit="contain"
        draggable={false}
        fallbackSrc="https://via.placeholder.com/120x168?text=?" 
      />
      
      {isMissingImage && (
        <Box 
            position="absolute" 
            top="50%" left="50%" transform="translate(-50%, -50%)"
            bg="rgba(255,0,0,0.8)" color="white" p={1} borderRadius="sm"
            fontSize="10px" fontWeight="bold" textAlign="center" width="90%"
            zIndex={20} pointerEvents="none"
        >
            MISSING: {card.type}
        </Box>
      )}
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
  player1,
  player2,
  currentPlayerId,
  isGameOver,
  remainingCards,
  lastDieRoll,
  onPlayCard,
  gameMode
}: QubitGameControlsProps) => {

  return (
    <VStack align="stretch" flex="1" spacing={4} p={4} bg="gray.800" borderRadius="md" h="100%">
      
      {/* --- Scoreboard Section --- */}
      <Box bg="gray.700" p={3} borderRadius="md" boxShadow="inner">
        <Heading size="xs" color="gray.400" mb={2} textTransform="uppercase" letterSpacing="wide">Scoreboard</Heading>
        
        <HStack justify="space-between" mb={1}>
            <Text fontWeight="bold" color="blue.300" fontSize="sm">{player1?.name} (Endzone +)</Text>
            <Text fontWeight="black" fontSize="xl" color="white">{player1?.touchdowns}</Text>
        </HStack>
        
        <HStack justify="space-between">
            <Text fontWeight="bold" color="purple.300" fontSize="sm">{player2?.name} (Endzone -)</Text>
            <Text fontWeight="black" fontSize="xl" color="white">{player2?.touchdowns}</Text>
        </HStack>

        <HStack mt={3} pt={3} borderTopWidth={1} borderColor="gray.600" justify="space-between">
            <Text fontSize="xs" color="gray.400" fontWeight="bold">CARDS LEFT: <Text as="span" color="white">{remainingCards}</Text></Text>
            {lastDieRoll !== null && (
                 <HStack spacing={1}>
                    <Text fontSize="xs" color="gray.400" fontWeight="bold">LAST ROLL:</Text>
                    <Badge colorScheme="yellow" variant="solid" fontSize="md" px={2} borderRadius="full">
                        {lastDieRoll}
                    </Badge>
                 </HStack>
            )}
        </HStack>
      </Box>

      {/* --- Hands Section --- */}
      <Box flex="1" overflowY="auto" pr={1} className="custom-scrollbar">
        <Heading size="xs" color="gray.400" mb={3} textTransform="uppercase" letterSpacing="wide">Player Hands</Heading>
        
        {/* Player 1 Hand */}
        {player1 && (
            <Box mb={6} p={2} borderRadius="md" bg={currentPlayerId === 1 ? 'whiteAlpha.100' : 'transparent'} transition="background 0.3s">
                <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="bold" color="blue.200">
                        {player1.name}
                    </Text>
                    {currentPlayerId === 1 && !isGameOver && (
                        <Badge colorScheme="blue" variant="subtle" size="sm" fontSize="0.6em">YOUR TURN</Badge>
                    )}
                </HStack>
                
                <HStack wrap="wrap" spacing={4} minH="180px" align="start"> {/* Increased spacing & minH */}
                    {player1.hand.map(card => (
                        <CardButton 
                            key={card.id} 
                            card={card} 
                            isFaceUp={currentPlayerId === 1 || isGameOver}
                            canPlay={currentPlayerId === 1 && !isGameOver} 
                            onClick={() => onPlayCard(card.id)} 
                        />
                    ))}
                    {player1.hand.length === 0 && <Text fontSize="xs" color="whiteAlpha.400">No cards</Text>}
                </HStack>
            </Box>
        )}

        {/* Player 2 Hand */}
        {player2 && (
            <Box p={2} borderRadius="md" bg={currentPlayerId === 2 ? 'whiteAlpha.100' : 'transparent'} transition="background 0.3s">
                <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="bold" color="purple.200">
                        {player2.name}
                    </Text>
                    {currentPlayerId === 2 && !isGameOver && (
                         <Badge colorScheme="purple" variant="subtle" size="sm" fontSize="0.6em">
                            {gameMode === 'PVC' ? 'CPU THINKING...' : 'YOUR TURN'}
                         </Badge>
                    )}
                </HStack>

                <HStack wrap="wrap" spacing={4} minH="180px" align="start"> {/* Increased spacing & minH */}
                    {player2.hand.map(card => (
                        <CardButton 
                            key={card.id} 
                            card={card} 
                            isFaceUp={currentPlayerId === 2 || isGameOver}
                            canPlay={currentPlayerId === 2 && !isGameOver && gameMode !== 'PVC'} 
                            onClick={() => onPlayCard(card.id)} 
                        />
                    ))}
                    {player2.hand.length === 0 && <Text fontSize="xs" color="whiteAlpha.400">No cards</Text>}
                </HStack>
            </Box>
        )}
      </Box>
    </VStack>
  )
}