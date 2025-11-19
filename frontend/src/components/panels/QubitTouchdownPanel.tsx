// import React from 'react'
// import {
//   Box,
//   Heading,
//   Button,
//   HStack,
//   VStack,
//   Text,
//   Spinner,
//   useToast,
//   RadioGroup,
//   Radio,
// } from '@chakra-ui/react'
// import { useSelector, useDispatch } from 'react-redux'
// import type { RootState, AppDispatch } from '@/store'
// import { startNewGame, makeMove, resetGame, selectQubitTouchdown } from '@/store/slices/qubitTouchdownSlice'
// import type { GameMode } from '@/types/qubitTouchdown'
// import { and } from 'three/tsl'

// export default function QubitTouchdownPanel() {
//   const dispatch = useDispatch<AppDispatch>()
//   const toast = useToast()
//     const { game, loading, error } = useSelector(selectQubitTouchdown)

//   const [selectedMode, setSelectedMode] = React.useState<GameMode>('PVP')

//   React.useEffect(() => {
//     if (error) {
//       toast({
//         title: 'Qubit Touchdown',
//         description: error,
//         status: 'error',
//         duration: 4000,
//         isClosable: true,
//       })
//     }
//   }, [error, toast])

//   const handleStart = () => {
//     dispatch(startNewGame({ mode: selectedMode }))
//   }

//   const handleReset = () => {
//     dispatch(resetGame())
//   }

//   const handleCellClick = (index: number) => {
//     if (!game || game.isOver || loading) return
//     dispatch(
//       makeMove({
//         gameId: game.gameId,
//         targetIndex: index,
//       }),
//     )
//   }

//   return (
//     <Box p={4}>
//       <Heading size="md" mb={4}>
//         Qubit Touchdown
//       </Heading>

//       {!game && (
//         <VStack align="flex-start" spacing={4}>
//           <Box>
//             <Text fontWeight="bold" mb={2}>
//               Select mode
//             </Text>
//             <RadioGroup
//               value={selectedMode}
//               onChange={(value) => setSelectedMode(value as GameMode)}
//             >
//               <HStack spacing={4}>
//                 <Radio value="PVP">2 Players (local)</Radio>
//                 <Radio value="PVC">Player vs Computer</Radio>
//               </HStack>
//             </RadioGroup>
//           </Box>
//           <Button
//             colorScheme="blue"
//             onClick={handleStart}
//             isLoading={loading}
//           >
//             Start Game
//           </Button>
//         </VStack>
//       )}

//       {game && (
//         <VStack align="stretch" spacing={4} mt={4}>
//           <HStack justify="space-between">
//             <Text>
//               Mode: <strong>{mode}</strong>
//             </Text>
//             <Text>
//               {game.isOver
//                 ? game.winner
//                   ? `Winner: Player ${game.winner}`
//                   : 'Game over'
//                 : `Current player: ${game.currentPlayer}`}
//             </Text>
//           </HStack>

//           {loading && (
//             <HStack>
//               <Spinner size="sm" />
//               <Text>Thinking...</Text>
//             </HStack>
//           )}

//           <Box display="grid" gridTemplateColumns="repeat(8, 1fr)" gap={2}>
//             {game.board.map((cell) => (
//               <Button
//                 key={cell.index}
//                 height="60px"
//                 colorScheme={
//                   cell.owner === 1 ? 'green' : cell.owner === 2 ? 'purple' : 'gray'
//                 }
//                 variant={cell.owner ? 'solid' : 'outline'}
//                 onClick={() => handleCellClick(cell.index)}
//                 isDisabled={game.isOver || !!cell.owner || loading}
//               >
//                 {cell.owner
//                   ? `P${cell.owner}`
//                   : cell.amplitude !== 0
//                   ? cell.amplitude.toFixed(2)
//                   : ''}
//               </Button>
//             ))}
//           </Box>

//           <Button onClick={handleReset} variant="outline">
//             Reset
//           </Button>
//         </VStack>
//       )}
//     </Box>
//   )
// }
