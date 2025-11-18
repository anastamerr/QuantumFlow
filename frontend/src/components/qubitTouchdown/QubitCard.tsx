// // src/components/qubitTouchdown/QubitCard.tsx
// import React from 'react'
// import { Box, Image } from '@chakra-ui/react'
// import type { QubitCard, CardType } from '@/types/qubitTouchdown'

// const CARD_IMAGES: Record<CardType, string> = {
//   H: '/assets/cards/H.png',
//   X: '/assets/cards/PauliX.png',
//   Y: '/assets/cards/PauliY.png',
//   Z: '/assets/cards/PauliZ.png',
//   S: '/assets/cards/S.png',
//   I: '/assets/cards/I.png',
//   MEASURE: '/assets/cards/Measurement.png',
//   SQRT_X: '/assets/cards/SqrtX.png',
// }

// const BackCard = '/assets/cards/Back.png'


// interface QubitCardProps {
//   card: QubitCard
//   canPlay: boolean
//   isFaceUp: boolean
//   onPlay: () => void
// }

// export default function QubitCardButton({
//   card,
//   canPlay,
//   isFaceUp,
//   onPlay,
// }: QubitCardProps) {
//   const src = isFaceUp
//     ? CARD_IMAGES[card.type]
//     : BackCard

//   return (
//     <Box
//       as="button"
//       onClick={onPlay}
//       disabled={!canPlay}
//       w="120px"
//       h="168px"
//       borderRadius="md"
//       boxShadow="md"
//       flexShrink={0}
//       position="relative"
//       overflow="hidden"
//       transition="all 0.2s ease-out"
//       cursor={canPlay ? 'pointer' : 'default'}
//       opacity={canPlay ? 1 : 0.7}
//       _hover={
//         canPlay
//           ? {
//               transform: 'translateY(-8px) scale(1.03)',
//               zIndex: 10,
//               boxShadow: '0 12px 25px rgba(0,0,0,0.5)',
//             }
//           : undefined
//       }
//     >
//       <Image
//         src={src}
//         alt={card.type}
//         w="100%"
//         h="100%"
//         objectFit="cover"
//         draggable={false}
//       />
//     </Box>
//   )
// }
