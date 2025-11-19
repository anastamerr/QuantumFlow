import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Button,
  Box,
  useColorModeValue,
  HStack,
  Icon,
  OrderedList,
  ListItem,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { selectActivePanel, setActivePanel } from '../../store/slices/uiSlice'

const QKDModal: React.FC = () => {
  const dispatch = useDispatch()
  const activePanel = useSelector(selectActivePanel)

  const isOpen = activePanel === 'qkd'
  const headerBg = useColorModeValue('purple.50', 'purple.900')
  const bodyBg = useColorModeValue('white', 'gray.800')
  const accentColor = useColorModeValue('purple.600', 'purple.300')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const closeModal = () => {
    dispatch(setActivePanel('circuit'))
  }

  const colabHref =
    'https://colab.research.google.com/drive/1p5L1Vj9DlnPd72E7o3SzEJiWJCVbH_5B?usp=sharing'

  return (
    <Modal isOpen={isOpen} onClose={closeModal} size={{ base: 'full', md: 'lg' }} isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(2px)" />
      <ModalContent bg={bodyBg} maxW="600px">
        <ModalHeader bg={headerBg} borderTopRadius="md" textAlign="center">
          <Text fontSize="lg" fontWeight="bold" color={accentColor}>
            QuantumFlow × Google Colab
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <VStack spacing={6} align="center" textAlign="center">
            <Text fontSize="lg" fontWeight="bold" color={accentColor}>
              Ignite Your Quantum Key Distribution Adventure in Google Colab!
            </Text>
            <Text fontSize="sm" color={textColor} maxW="460px">
              Colab is the go-to playground for quantum explorers. Dive into a ready-to-run notebook and feel real QKD code come alive within minutes; no installs, just pure discovery!
            </Text>
            <Box bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md" p={5} w="100%">
              <VStack align="stretch" spacing={3} fontSize="sm" color={textColor}>
                <Text fontWeight="semibold">3 quick moves to spark the magic:</Text>
                <OrderedList spacing={2} pl={4} textAlign="left">
                  <ListItem>Make a personal copy: File → Save a copy in Drive.</ListItem>
                  <ListItem>Open your copy, press Run, and watch the protocol unfold live.</ListItem>
                  <ListItem>Tweak parameters, rerun, and explore! Every experiment runs in your private workspace!</ListItem>
                </OrderedList>
              </VStack>
            </Box>
            <HStack justify="flex-end" w="100%">
              <Button
                as="a"
                href={colabHref}
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="purple"
                rightIcon={<Icon as={ExternalLinkIcon} />}
              >
                Open Colab Notebook
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default QKDModal
