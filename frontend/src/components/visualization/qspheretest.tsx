import React, { useEffect } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import QSphere3D from './QSphere3D';
import { convertToQSphereData } from '../../utils/qSphereCalculations'; // Make sure this import exists

export default function QSphereTest() {
  useEffect(() => {
    // Expose function to window for console testing
    (window as any).convertToQSphereData = convertToQSphereData;
    
    console.log('🎯 Q-Sphere functions available in console!');
    console.log('Try: convertToQSphereData({ "00": {real: 0.7, imag: 0}, "11": {real: 0.7, imag: 0} }, 2)');
    
    return () => {
      // Clean up
      delete (window as any).convertToQSphereData;
    };
  }, []);

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Text color="gray.300" textAlign="center">
          Check console (Ctrl+Shift+I) - Functions are available for testing!
        </Text>
        
        <QSphere3D />
        
        <Box p={3} bg="blue.800" borderRadius="md">
          <Text color="white" textAlign="center">
            ✅ Q-Sphere Ready - Test functions in browser console
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}