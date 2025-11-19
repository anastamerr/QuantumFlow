import React, { useEffect, useState } from 'react'
import { Box, HStack, Text, VStack, Heading, Badge, Image } from '@chakra-ui/react'
import { Player } from '@/types/qubitTouchdown'

import HCard from '../../../public/../public/assets/cards/H.png'
import XCard from '../../../public/assets/cards/PauliX.png'
import YCard from '../../../public/assets/cards/PauliY.png'
import ZCard from '../../../public/assets/cards/PauliZ.png'
import SCard from '../../../public/assets/cards/S.png'
import MeasCard from '../../../public/assets/cards/Measurement.png'
import SqrtXCard from '../../../public/assets/cards/SqrtX.png'
import ICard from '../../../public/assets/cards/I.png'
import BackCard from '../../../public/assets/cards/Back.png'

const CARD_IMAGES: Record<string, string> = {
  H: HCard,
  X: XCard,
  Y: YCard,
  Z: ZCard,
  S: SCard,
  I: ICard,
  Meas: MeasCard,
  Measurement: MeasCard,
  '√X': SqrtXCard,
  rootx: SqrtXCard,
  SQRT_X: SqrtXCard,
}

const DiceComponent = ({ value, rollTrigger, isRolling, onAnimationEnd }: any) => {
  const [display, setDisplay] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!isRolling || rollTrigger === 0 || value === null) {
      setIsAnimating(false)
      return
    }

    setIsAnimating(true)
    let count = 0
    const maxCount = 12
    let delay = 50
    let timeoutId: any

    const animate = () => {
      if (count >= maxCount) {
        setDisplay(value)
        setIsAnimating(false)
        setTimeout(onAnimationEnd, 300)
        return
      }
      setDisplay(Math.random() > 0.5 ? 1 : 0)
      count++
      delay = Math.floor(delay * 1.25)
      timeoutId = setTimeout(animate, delay)
    }
    timeoutId = setTimeout(animate, delay)
    return () => clearTimeout(timeoutId)
  }, [rollTrigger, value])

  useEffect(() => {
    if (!isAnimating) setDisplay(value)
  }, [value, isAnimating])

  if (value === null)
    return <Box w="40px" h="40px" bg="gray.600" borderRadius="md" />

  return (
    <Box
      w="40px"
      h="40px"
      bg="white"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
      border="2px solid #333"
      transform={isAnimating ? 'scale(1.1) rotate(6deg)' : 'none'}
      transition="all 0.3s"
    >
      <Text fontSize="xl" fontWeight="black" color={isAnimating ? 'yellow.600' : 'black'}>
        {display}
      </Text>
    </Box>
  )
}

const CardButton = ({ card, canPlay, isFaceUp, onClick }: any) => {
  const mappedImage = CARD_IMAGES[card.type]
  const imageSrc = isFaceUp ? mappedImage || BackCard : BackCard

  return (
    <Box
      as="button"
      onClick={onClick}
      disabled={!canPlay}
      position="relative"
      width="120px"
      height="168px"
      transition="all 0.2s"
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
        w="100%"
        h="100%"
        objectFit="contain"
        draggable={false}
        fallbackSrc="https://via.placeholder.com/120x168?text=Card"
      />
    </Box>
  )
}

export const QubitGameControls = ({
  player1,
  player2,
  currentPlayerId,
  isGameOver,
  remainingCards,
  lastDieRoll,
  rollTrigger,
  isDiceRolling,
  onPlayCard,
  onRollAnimationEnd,
  gameMode,
}: any) => {
  const isP1Turn = currentPlayerId === 1
  const isPvc = gameMode === 'PVC'

  // lock interaction when: game over, dice rolling, or CPU's turn in PVC
  const gameLocked = isGameOver || isDiceRolling || (isPvc && !isP1Turn)

  // === NEW: control card faces ===
  // Active player's cards face up, other player's cards back.
  // After game over, both hands are face up so players can review.
  const p1FaceUp = (!isGameOver && isP1Turn) || isGameOver
  const p2FaceUp = (!isGameOver && !isP1Turn) || isGameOver

  return (
    <VStack align="stretch" flex="1" spacing={4} p={4} bg="gray.800" borderRadius="md" h="100%">
      {/* SCOREBOARD */}
      <Box bg="gray.700" p={3} borderRadius="md" boxShadow="inner">
        <Heading size="xs" color="gray.400" mb={2}>
          TOUCHDOWNS
        </Heading>
        <HStack justify="space-between" mb={1}>
          <Text fontSize="sm" fontWeight="bold" color="blue.300">
            {player1?.name} (Goal: {player1?.endzone})
          </Text>
          <Text fontSize="xl" fontWeight="black" color="white">
            {player1?.touchdowns ?? 0}
          </Text>
        </HStack>
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" fontWeight="bold" color="purple.300">
            {player2?.name} (Goal: {player2?.endzone})
          </Text>
          <Text fontSize="xl" fontWeight="black" color="white">
            {player2?.touchdowns ?? 0}
          </Text>
        </HStack>
        <HStack
          pt={3}
          borderTopWidth={1}
          borderColor="gray.600"
          justify="space-between"
        >
          <Text fontSize="xs" color="gray.400">
            CARDS: <Text as="span" color="white">{remainingCards}</Text>
          </Text>
          {lastDieRoll !== null && (
            <HStack spacing={1}>
              <Text fontSize="xs" color="gray.400">
                ROLL:
              </Text>
              <DiceComponent
                value={lastDieRoll}
                rollTrigger={rollTrigger}
                isRolling={isDiceRolling}
                onAnimationEnd={onRollAnimationEnd}
              />
            </HStack>
          )}
        </HStack>
      </Box>

      {/* HANDS */}
      <VStack
        flex="1"
        overflowY="auto"
        className="custom-scrollbar"
        pr={2}
        align="stretch"
        spacing={4}
      >
        <Heading size="xs" color="gray.400">
          Player Hands
        </Heading>

        {/* Player 1 */}
        {player1 && (
          <Box
            p={2}
            borderRadius="md"
            bg={isP1Turn ? 'whiteAlpha.100' : 'transparent'}
          >
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" fontWeight="bold" color="blue.200">
                {player1.name}
              </Text>
              {isP1Turn && !isGameOver && !isDiceRolling && (
                <Badge colorScheme="blue">YOUR TURN</Badge>
              )}
              {isDiceRolling && <Badge colorScheme="yellow">ROLLING...</Badge>}
            </HStack>
            <HStack wrap="wrap" spacing={3} align="start">
              {player1.hand.map((c: any) => (
                <CardButton
                  key={c.id}
                  card={c}
                  isFaceUp={p1FaceUp} // <-- use computed visibility
                  canPlay={!gameLocked && isP1Turn}
                  onClick={() => onPlayCard(c.id)}
                />
              ))}
            </HStack>
          </Box>
        )}

        {/* Player 2 */}
        {player2 && (
          <Box
            p={2}
            borderRadius="md"
            bg={!isP1Turn ? 'whiteAlpha.100' : 'transparent'}
          >
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" fontWeight="bold" color="purple.200">
                {player2.name}
              </Text>
              {!isP1Turn && !isGameOver && !isDiceRolling && (
                <Badge colorScheme="purple">
                  {isPvc ? 'THINKING...' : 'YOUR TURN'}
                </Badge>
              )}
              {isDiceRolling && <Badge colorScheme="yellow">ROLLING...</Badge>}
            </HStack>
            <HStack wrap="wrap" spacing={3} align="start">
              {player2.hand.map((c: any) => (
                <CardButton
                  key={c.id}
                  card={c}
                  isFaceUp={p2FaceUp} // <-- use computed visibility
                  canPlay={!gameLocked && !isP1Turn && !isPvc}
                  onClick={() => onPlayCard(c.id)}
                />
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    </VStack>
  )
}
