 import React, { useState, useMemo } from 'react';
 import { useSelector, useDispatch } from 'react-redux';
 import {
 VStack,
 Button,
 Alert,
 AlertIcon,
 AlertTitle,
 AlertDescription,
 Box,
 Text,
 Flex,
 } from '@chakra-ui/react';
 import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
 import { RootState } from '../app/store';
 import { expandSnapshot, collapseSnapshot } from '../features/snapshots/snapshotsSlice';
 import SnapshotCard from '../features/snapshots/components/snapshotCard';
 import SnapshotModal from './SnapshotModal';
 import { estimateMemoryUsage, formatCharacterCount } from '../utils/snapshotSafetyUtils';
 const SnapshotList: React.FC = () => {
 const dispatch = useDispatch();
 const { snapshots, expandedSnapshotId, autoCollapsed, totalCharacterCount } = 
useSelector(
 (state: RootState) => state.snapshots
);
 const [userOverrideCollapse, setUserOverrideCollapse] = useState(false);
 // Determine which snapshots to show
 const displayedSnapshots = useMemo(() => {
 const shouldCollapse = autoCollapsed && !userOverrideCollapse;
 if (shouldCollapse && snapshots.length > 10) {
 return snapshots.slice(0, 10);
 }
 return snapshots;
 }, [snapshots, autoCollapsed, userOverrideCollapse]);
 // Find expanded snapshot for modal
 const expandedSnapshot = useMemo(() => {
 return snapshots.find(s => s.id === expandedSnapshotId) || null;
 }, [snapshots, expandedSnapshotId]);
 // Handle expand snapshot
 const handleExpandSnapshot = (snapshotId: string) => {
 dispatch(expandSnapshot(snapshotId));
 };
 // Handle close modal
const handleCloseModal = () => {
 dispatch(collapseSnapshot());
 };
 // Handle show all button
 const handleShowAll = () => {
 setUserOverrideCollapse(true);
 };
 // Handle collapse button
 const handleCollapse = () => {
 setUserOverrideCollapse(false);
 };
 // Empty state
 if (!snapshots || snapshots.length === 0) {
 return (
 <Flex
 direction="column"
 align="center"
 justify="center"
 p={10}
 textAlign="center"
 color="gray.500"
 >
 <Text fontSize="5xl" mb={4} opacity={0.5}>
�
�
 </Text>
 <Text fontSize="lg" fontWeight="600" color="gray.700" mb={2}>
 No Snapshots Yet
 </Text>
 <Text fontSize="sm" maxW="400px">
 Run a quantum circuit simulation to see state snapshots after each gate.
 </Text>
 </Flex>
 );
 }
 const hiddenCount = snapshots.length - displayedSnapshots.length;
 const shouldShowCollapse = autoCollapsed && !userOverrideCollapse;
 const hasLargeQubits = snapshots.some(s => s.qubitCount >= 10);
 return (
 <Box w="100%" h="100%">
 <VStack spacing={4} align="stretch">
 {/* Warning banner for auto-collapse */}
 {autoCollapsed && (
 <Alert status="warning" borderRadius="md">
 <AlertIcon />
 <Box flex="1">
 <AlertTitle fontSize="sm">Large quantum states detected</AlertTitle>
 <AlertDescription fontSize="xs">
<Text>
 Total: {formatCharacterCount(totalCharacterCount)} characters 
(~{estimateMemoryUsage(totalCharacterCount)})
 </Text>
 {shouldShowCollapse && (
 <Text mt={1}>
 Showing first 10 of {snapshots.length} snapshots to prevent slowness.
 </Text>
 )}
 {hasLargeQubits && (
 <Text mt={1} fontWeight="600">
 ⚠
 Circuit has 10+ qubits - states auto-collapsed for performance
 </Text>
 )}
 </AlertDescription>
 </Box>
 </Alert>
 )}
 {/* Snapshot cards */}
 <VStack
 spacing={3}
 align="stretch"
 maxH="calc(100vh - 250px)"
 overflowY="auto"
 pr={2}
css={{
 '&::-webkit-scrollbar': {
 width: '8px',
 },
 '&::-webkit-scrollbar-track': {
 background: '#f1f1f1',
 borderRadius: '4px',
 },
 '&::-webkit-scrollbar-thumb': {
 background: '#d1d5db',
 borderRadius: '4px',
 },
 '&::-webkit-scrollbar-thumb:hover': {
 background: '#9ca3af',
 },
 }}
 >
 {displayedSnapshots.map(snapshot => (
 <SnapshotCard
 key={snapshot.id}
 snapshot={snapshot}
 onExpand={() => handleExpandSnapshot(snapshot.id)}
 isHighlighted={snapshot.id === expandedSnapshotId}
 />
 ))}
 </VStack>
{/* Show All / Collapse button */}
 {autoCollapsed && (
 <Flex justify="center" pt={2}>
 {shouldShowCollapse ? (
 <Button
 size="md"
 variant="outline"
 colorScheme="blue"
 leftIcon={<ChevronDownIcon />}
 onClick={handleShowAll}
 >
 Show All ({hiddenCount} more snapshots)
 </Button>
 ) : (
 <Button
 size="md"
 variant="outline"
 colorScheme="gray"
 leftIcon={<ChevronUpIcon />}
 onClick={handleCollapse}
 >
 Collapse to 10 snapshots
 </Button>
 )}
 </Flex>
)}
 </VStack>
 {/* Modal for expanded snapshot */}
 <SnapshotModal
 isOpen={!!expandedSnapshotId}
 snapshot={expandedSnapshot}
 onClose={handleCloseModal}
 />
 </Box>
 );
 };
 export default SnapshotList;