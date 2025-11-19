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
  Image,
} from "@chakra-ui/react";

import MeasurementCard from "../../../public/assets/cards/Measurement.png";
import PauliXCard from "../../../public/assets/cards/PauliX.png";
import SqrtXCard from "../../../public/assets/cards/SqrtX.png";
import ICard from "../../../public/assets/cards/I.png";

import DieImage from "../../../public/assets/cards/die.png";
import BoardImage from "../../../public/assets/cards/board.png";
import TouchdownImage from "../../../public/assets/cards/touchdown.png";
// ─────────────────────────────────────────────

export default function RulesTutorialModal({ isOpen, onClose }) {
  const [slide, setSlide] = useState(0);

  const nextSlide = () => {
    if (slide < 4) setSlide(slide + 1);
    else onClose();
  };

  const prevSlide = () => setSlide(Math.max(0, slide - 1));
  const restart = () => setSlide(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="gray.900" color="white" p={3}>
        <ModalHeader textAlign="center">How to Play — Qubit Touchdown</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6}>

            {/* ─────────────────────────────── */}
            {/* Slide Content */}
            {/* ─────────────────────────────── */}
            <VStack spacing={4}>
              {slide === 0 && (
                <>
                  <Text whiteSpace="pre-wrap" fontSize="md">
                    Qubit Touchdown is a two-player strategy game where each player uses
                    action cards to apply quantum operations and move the football token
                    toward the opponent's end zone. The player who scores the most
                    touchdowns until all 52 cards are dealt wins.
                  </Text>
                </>
              )}

              {slide === 1 && (
                <>
                  <Text fontSize="lg" fontWeight="bold">Step 1 — Setup / Deal Cards</Text>

                  <Text whiteSpace="pre-wrap" fontSize="md">
                    There are 52 action cards in the deck. Each player is dealt 4 cards,
                    and the remaining cards form the draw pile. These cards represent
                    quantum gates and special actions you can play on your turn.
                  </Text>

                  <HStack spacing={4}>
                    <Image src={MeasurementCard} w="80px" />
                    <Image src={PauliXCard} w="80px" />
                    <Image src={SqrtXCard} w="80px" />
                    <Image src={ICard} w="80px" />
                  </HStack>
                </>
              )}

              {slide === 2 && (
                <>
                  <Text fontSize="lg" fontWeight="bold">Step 2 — Rolling Dice</Text>

                  <Text whiteSpace="pre-wrap" fontSize="md">
                    Kickoff by rolling the binary die and placing the football token on the
                    game board at 0 or 1. The number the die lands on becomes **your end
                    zone**, and the other becomes the opponent’s.
                  </Text>

                  <Image src={DieImage} w="120px" />
                </>
              )}

              {slide === 3 && (
                <>
                  <Text fontSize="lg" fontWeight="bold">Step 3 — Selecting an Action Card</Text>

                  <Text whiteSpace="pre-wrap" fontSize="md">
                    Select an action card from your hand to move the token according to the
                    quantum gate using the lines drawn on the board. If a transition is not
                    shown for that gate, the token stays put. After completing your move,
                    draw one card from the draw pile.
                  </Text>

                  <HStack spacing={4}>
                    <Image src={BoardImage} w="160px" />
                    <Image src={SqrtXCard} w="90px" />
                  </HStack>

                  <Text whiteSpace="pre-wrap" fontSize="md">
                    For measurement cards, do nothing if the token is at 0 or 1. Otherwise,
                    kickoff by rolling the die.
                  </Text>

                  <Image src={MeasurementCard} w="90px" />
                </>
              )}

              {slide === 4 && (
                <>
                  <Text fontSize="lg" fontWeight="bold">Step 4 — Scoring a Touchdown</Text>

                  <Text whiteSpace="pre-wrap" fontSize="md">
                    Score a touchdown by moving the football token into the **opponent's**
                    end zone.  
                    ⚠️ It is also possible to score **for the opponent** by accidentally
                    moving the token into **your own** end zone!
                  </Text>

                  <Image src={TouchdownImage} w="140px" />
                </>
              )}

              {slide === 5 && (
                <>
                  <Text fontSize="lg" fontWeight="bold">Step 5 — Play Until the Deck Runs Out</Text>

                  <Text whiteSpace="pre-wrap" fontSize="md">
                    Continue taking turns until all 52 action cards have been played.  
                    The player who scored the most touchdowns wins the game!
                  </Text>
                </>
              )}
            </VStack>

            {/* ─────────────────────────────── */}
            {/* Buttons */}
            {/* ─────────────────────────────── */}
            <HStack justify="space-between" width="100%">
              <Button
                onClick={prevSlide}
                variant="outline"
                colorScheme="blue"
                isDisabled={slide === 0}
              >
                Previous
              </Button>

              <Button
                onClick={restart}
                variant="outline"
                colorScheme="yellow"
              >
                Restart
              </Button>

              <Button
                onClick={nextSlide}
                colorScheme="blue"
              >
                {slide === 5 ? "Finish" : "Next"}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
