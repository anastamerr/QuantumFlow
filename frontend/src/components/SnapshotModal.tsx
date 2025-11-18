 import React, { useEffect, useRef } from 'react';
 import {
 Modal,
 ModalOverlay,
 ModalContent,
 ModalHeader,
 ModalBody,
 ModalFooter,
 ModalCloseButton,
 Button,
 Code,
 Badge,
 Flex,
 Text,
 useToast,
 Box,
 } from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
 import { Snapshot } from '../features/snapshots/snapshotsSlice';
 import { formatCharacterCount, estimateMemoryUsage } from '../utils/snapshotSafetyUtils';
 interface SnapshotModalProps {
 isOpen: boolean;
 snapshot: Snapshot | null;
 onClose: () => void;
 }
 const SnapshotModal: React.FC<SnapshotModalProps> = ({ isOpen, snapshot, onClose }) => {
 const toast = useToast();
 const [copied, setCopied] = React.useState(false);
 const modalContentRef = useRef<HTMLDivElement>(null);
 // Reset copied state when modal opens/closes
 useEffect(() => {
 if (!isOpen) {
 setCopied(false);
 }
 }, [isOpen]);
 if (!snapshot) return null;
 const handleCopyToClipboard = async () => {
 try {
await navigator.clipboard.writeText(snapshot.fullState);
 setCopied(true);
 toast({
 title: 'Copied to clipboard',
 description: 'Quantum state copied successfully',
 status: 'success',
 duration: 2000,
 isClosable: true,
 });
 // Reset copied state after 2 seconds
 setTimeout(() => setCopied(false), 2000);
 } catch (err) {
 console.error('Failed to copy:', err);
 toast({
 title: 'Copy failed',
 description: 'Unable to copy to clipboard',
 status: 'error',
 duration: 3000,
 isClosable: true,
 });
 }
 };
 const amplitudeCount = Math.pow(2, snapshot.qubitCount);
return (
 <Modal 
isOpen={isOpen} 
onClose={onClose} 
size="4xl"
 scrollBehavior="inside"
 >
 <ModalOverlay bg="blackAlpha.600" />
 <ModalContent maxH="90vh" ref={modalContentRef}>
 <ModalHeader pb={2}>
 <Flex direction="column" gap={2}>
 <Text fontSize="xl" fontWeight="bold">
 {snapshot.gateName}
 </Text>
 <Flex gap={2} flexWrap="wrap" fontSize="sm">
 <Badge colorScheme="blue" px={2} py={1}>
 Gate #{snapshot.gateIndex}
 </Badge>
 <Badge colorScheme="purple" px={2} py={1}>
 {snapshot.qubitCount} qubits = {amplitudeCount} amplitudes
 </Badge>
 <Badge colorScheme="gray" px={2} py={1} fontFamily="mono">
{formatCharacterCount(snapshot.characterCount)} characters
 </Badge>
 <Badge colorScheme="orange" px={2} py={1}>
 ~{estimateMemoryUsage(snapshot.characterCount)}
 </Badge>
 </Flex>
 </Flex>
 </ModalHeader>
 <ModalCloseButton />
 <ModalBody py={4}>
 <Box
 bg="gray.50"
 border="1px solid"
 borderColor="gray.200"
 borderRadius="md"
 p={4}
 maxH="calc(80vh - 200px)"
 overflowY="auto"
 overflowX="auto"
 css={{
 '&::-webkit-scrollbar': {
 width: '10px',
 height: '10px',
},
 '&::-webkit-scrollbar-track': {
 background: '#e5e7eb',
 },
 '&::-webkit-scrollbar-thumb': {
 background: '#9ca3af',
 borderRadius: '5px',
 },
 '&::-webkit-scrollbar-thumb:hover': {
 background: '#6b7280',
 },
 }}
 >
 <Code
 display="block"
 whiteSpace="pre-wrap"
 wordBreak="break-word"
 fontSize="sm"
 fontFamily="'Courier New', 'Monaco', 'Menlo', monospace"
 bg="transparent"
 p={0}
 color="gray.800"
 >
 {snapshot.fullState}
 </Code>
 </Box>
</ModalBody>
 <ModalFooter>
 <Flex gap={2} w="100%" justify="space-between">
 <Button
 colorScheme="green"
 leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
 onClick={handleCopyToClipboard}
 isDisabled={copied}
 >
 {copied ? 'Copied!' : 'Copy to Clipboard'}
 </Button>
 <Button colorScheme="gray" onClick={onClose}>
 Close
 </Button>
 </Flex>
 </ModalFooter>
 </ModalContent>
 </Modal>
 );
 };
 export default SnapshotModal;