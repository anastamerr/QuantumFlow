import React from 'react';
import { Box } from '@chakra-ui/react';
import QubitTouchdown from '../pages/QubitTouchdown'; // Ensure path matches where you saved file #1

interface QubitTouchdownPageProps {
  onBack: () => void;
}

const QubitTouchdownPage: React.FC<QubitTouchdownPageProps> = ({ onBack }) => {
  return (
    <Box 
      flex="1" 
      width="100%" 
      height="100%" 
      overflow="hidden" 
      position="relative"
    >
      {/* The Game Component with Exit Handler */}
      <QubitTouchdown onExit={onBack} />
    </Box>
  );
};

export default QubitTouchdownPage;