import { Box, BoxProps, useColorModeValue } from '@chakra-ui/react';
import React, { useRef, useState, useCallback, ReactNode, useEffect } from 'react';

// Create our own interface to avoid conflict with Chakra's onResize
type CustomBoxProps = Omit<BoxProps, 'onResize'>;

interface ResizablePanelProps extends CustomBoxProps {
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  children: ReactNode;
  handlePosition?: 'start' | 'end';
  onResize?: (newSize: number) => void;
}

/**
 * ResizablePanel component allows for resizable sections in the application
 */
const ResizablePanel: React.FC<ResizablePanelProps> = ({
  direction = 'vertical',
  defaultSize = 300,
  minSize = 100,
  maxSize = 800,
  children,
  handlePosition = 'end',
  onResize,
  ...boxProps
}) => {
  const [size, setSize] = useState<number>(defaultSize);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startPos = useRef<number>(0);
  const startSize = useRef<number>(defaultSize);
  const panelRef = useRef<HTMLDivElement>(null);
 
  // Theme colors
  const handleColor = useColorModeValue('gray.300', 'gray.600');
  const handleHoverColor = useColorModeValue('blue.400', 'blue.500');
  const handleActiveColor = useColorModeValue('blue.500', 'blue.400');

  // Initialize with the defaultSize
  useEffect(() => {
    setSize(defaultSize);
  }, [defaultSize]);
 
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSize.current = size;
   
    // Add event listeners to window
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [direction, size]);
 
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
   
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPos.current;
   
    // Calculate new size based on handle position
    const multiplier = handlePosition === 'start' ? -1 : 1;
    let newSize = startSize.current + (delta * multiplier);
   
    // Constrain size within min and max
    newSize = Math.max(minSize, Math.min(maxSize, newSize));
   
    setSize(newSize);

    // Update the actual DOM element's size directly
    if (panelRef.current) {
      if (direction === 'horizontal') {
        panelRef.current.style.width = `${newSize}px`;
      } else {
        panelRef.current.style.height = `${newSize}px`;
      }
    }

    if (onResize) {
      onResize(newSize);
    }
  }, [isResizing, direction, handlePosition, minSize, maxSize, onResize]);
 
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
 
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Ensure that the size is applied on mount and when it changes
  useEffect(() => {
    if (panelRef.current) {
      if (direction === 'horizontal') {
        panelRef.current.style.width = `${size}px`;
      } else {
        panelRef.current.style.height = `${size}px`;
      }
    }
  }, [size, direction]);
 
  const sizeProps = direction === 'horizontal'
    ? { width: `${size}px` }
    : { height: `${size}px` };
 
  const handleStyles = {
    position: 'absolute',
    cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
    backgroundColor: handleColor,
    transition: 'background-color 0.2s',
    zIndex: 10,
    _hover: {
      backgroundColor: handleHoverColor,
    },
    _active: {
      backgroundColor: handleActiveColor,
    },
    ...(direction === 'horizontal'
      ? {
          width: '6px',
          top: 0,
          bottom: 0,
          [handlePosition === 'start' ? 'left' : 'right']: '-3px',
        }
      : {
          height: '6px',
          left: 0,
          right: 0,
          [handlePosition === 'start' ? 'top' : 'bottom']: '-3px',
        }
    ),
  };
 
  return (
    <Box
      ref={panelRef}
      position="relative"
      overflow="auto"
      {...sizeProps}
      {...boxProps}
    >
      <Box
        height="100%"
        width="100%"
      >
        {children}
      </Box>
      <Box
        as="div"
        onMouseDown={handleMouseDown}
        sx={handleStyles}
      />
    </Box>
  );
};

export default ResizablePanel;