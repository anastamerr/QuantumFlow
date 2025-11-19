import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Box,
} from '@chakra-ui/react'

interface QubitRulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function QubitRulesModal({
  isOpen,
  onClose,
}: QubitRulesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>Qubit Touchdown Rules</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={3} fontSize="sm" color="gray.200">
            <Text>
              <b>Start & endzones:</b> Kickoff is a binary die (0 or 1). Player
              1 always starts. Each player&apos;s endzone (blue node) is fixed;
              reaching the opponent&apos;s endzone is a touchdown.
            </Text>
            <Text>
              <b>Touchdown:</b> Move the ball to your opponent&apos;s endzone.
              You score 1 touchdown, then the ball is reset to 0 or 1 with a
              new die roll.
            </Text>
            <Text>
              <b>Safety / own goal:</b> If you move the ball into your own
              endzone, the opponent scores instead. The ball is then reset via
              a die roll.
            </Text>
            <Text>
              <b>Turn flow:</b> On your turn, play one gate card to move the
              ball along a matching arrow, draw a new card, and check for
              touchdown. Measurement cards collapse superposition states (+, −,
              +i, −i) to 0 or 1 with a fresh die roll.
            </Text>
            <Box bg="gray.900" p={3} borderRadius="md" fontFamily="mono">
              <Text>H: Hadamard (0/1 ↔ +/−)</Text>
              <Text>X, Y, Z: Pauli gates</Text>
              <Text>√X: Square root of X</Text>
              <Text>Meas: quantum measurement (collapse to 0 or 1)</Text>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
