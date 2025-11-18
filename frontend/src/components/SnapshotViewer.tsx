import React from 'react';
import { selectSnapshots } from '../store/slices/debugSlice';
 import {
 Box,
 Flex,
 Text,
 Badge,
 Heading,
 useBreakpointValue,
 } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
 import { RootState } from '../app/store';
 import SnapshotList from './SnapshotList';
 const SnapshotViewer: React.FC = () => {
 const { snapshots, isLoading } = useSelector((state: RootState) => state.snapshots);
 console.log('SnapshotViewer rendered', snapshots)
 // Determine layout mode based on screen size
 const layoutMode = useBreakpointValue({
 base: 'bottom', // Mobile
 md: 'sidebar',  // Tablet and up
 });
 return (
    
 <Box
 w="100%"
 h="100%"
 bg="gray.50"
 borderLeft={{ base: 'none', md: '1px solid' }}
 borderTop={{ base: '1px solid', md: 'none' }}
 borderColor="gray.200"
 display="flex"
 flexDirection="column"
 overflow="hidden"
 >
 {/* Header */}
<Flex
 p={4}
 borderBottom="1px solid"
 borderColor="gray.200"
 bg="white"
 justify="space-between"
 align="center"
 flexShrink={0}
 >
 <Heading size="md" color="gray.800">
 Quantum State Snapshots
 </Heading>
 {snapshots.length > 0 && (
 <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
 {snapshots.length} {snapshots.length === 1 ? 'gate' : 'gates'}
 </Badge>
 )}
 </Flex>
 {/* Content */}
 <Box
 flex="1"
 overflow="hidden"
 p={4}
 >
{isLoading ? (
 <Flex
 h="100%"
 align="center"
 justify="center"
 direction="column"
 color="gray.500"
 >
 <Text fontSize="2xl" mb={2}>
 ⏳
 </Text>
 <Text>Loading snapshots...</Text>
 </Flex>
 ) : (
 <SnapshotList />
 )}
 </Box>
 </Box>
 );
 };
 export default SnapshotViewer;