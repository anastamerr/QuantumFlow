import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';

// --- Tutorial Slides (from the provided tutorial doc) ---
import BlochBack from "../../../public/assets/cards/Back.png";
import SqrtXCard from "../../../public/assets/cards/SqrtX.png";
import Board from "../../../public/assets/cards/Board.png";
import MeasurementCard from "../../../public/assets/cards/Measurement.png";

const tutorialSlides = [
  // 1
  `Hut...hut...hike!

Qubit Touchdown is an easy-to-learn, football-themed, two-player competitive game. Take turns moving the football across the field by playing action cards. Whoever scores the most touchdowns wins!`,

  // 2
  `A qubit (quantum bit), like a classical bit, can take two values 0 or 1.

If we had a classical bit, 0 and 1 would be the only two states. But the laws of quantum mechanics allow a qubit to be a combination of 0 and 1, called a superposition of 0 and 1.

For example, here is a state that is 50% 0 and 50% 1:`,

  // 3
  `We visualize these distinct states, 0 and 1, as the north and south poles of a unit sphere called the Bloch sphere.`,

  // 4
  `The back of each action card has a drawing of the Bloch sphere.`,

  // 5
  `A qubit, however, can be any point on the Bloch Sphere, so it has an infinite number of possible states.`,

  // 6
  `Qubit Touchdown uses just six states, and they are drawn on the Bloch sphere and labeled 0, 1, +, -, i, -i.

Each one of the 4 superposition states is 50% 0 and 50% 1 but with different phases, which makes their positions on the Bloch sphere different.`,

  // 7
  `The positions on the game board correspond to these six states, and the token is a qubit changing its state between those states.`,

  // 8
  `Quantum gates, which correspond to the gate action cards, change a qubit’s state.

For example: The √x gate rotates the qubit’s state about the x-axis by 90°. So √x turns 0 into i and leaves + and – unchanged.`,

  // 9
  `Although a qubit can be any point on the Bloch sphere, measuring its value yields 0 or 1, each with some probability.`,

  // 10
  `Since +, -, i, -i lie on the equator, they are superpositions of half 0 and half 1. Then measuring them yields 0 or 1, each with 50% probability.`,

  // 11
  `Furthermore, measuring 0 yields 0 with certainty, and measuring 1 yields 1 with certainty.`,

  // 12
  `Kicking off after a touchdown, or playing the measurement card, corresponds to a quantum measurement.`,
];

// --- Tutorial Modal Component ---
export default function QubitTutorialModal({ isOpen, onClose }) {
  const [slide, setSlide] = useState(0);

  const nextSlide = () => {
    if (slide < tutorialSlides.length - 1) setSlide(slide + 1);
    else onClose();
  };

  const restart = () => setSlide(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="gray.900" color="white" p={2}>
        <ModalHeader textAlign="center">The Physics of the Qubit Touchdown</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6}>
            <VStack>
              <Text whiteSpace="pre-wrap" fontSize="md">
                {tutorialSlides[slide]}
              </Text>

              {(slide === 3 || slide === 4 || slide === 5) && (
                <img
                  src={BlochBack}
                  alt="Bloch Sphere"
                  style={{ width: "180px", marginTop: "10px", borderRadius: "8px" }}
                />
              )}

              {slide === 7 && (
                <img
                  src={SqrtXCard}
                  alt="SqrtX Gate"
                  style={{ width: "160px", marginTop: "10px", borderRadius: "8px" }}
                />
              )}

              {slide === 11 && (
                <img
                  src={MeasurementCard}
                  alt="Measurement Card"
                  style={{ width: "160px", marginTop: "10px", borderRadius: "8px" }}
                />
              )}
              {slide === 6 && (
                <img
                  src={Board}
                  alt="Board"
                  style={{ width: "160px", marginTop: "10px", borderRadius: "8px" }}
                />
              )}
            </VStack>

            <HStack justify="space-between" width="100%">
              <Button
                onClick={() => setSlide(Math.max(0, slide - 1))}
                variant="outline"
                colorScheme="blue"
                isDisabled={slide === 0}
              >
                Previous
              </Button>

              <Button onClick={restart} variant="outline" colorScheme="yellow">
                Restart
              </Button>

              <Button onClick={nextSlide} colorScheme="blue">
                {slide === tutorialSlides.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
