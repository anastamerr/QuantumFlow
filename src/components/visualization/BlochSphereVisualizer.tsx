import React, { useRef, useEffect } from 'react';
import { Box, Heading, Text, VStack, Spinner, useColorModeValue } from '@chakra-ui/react';
import * as THREE from 'three';
import { stateVectorToBloch } from '../../utils/blochSphereUtils';

// Type for Bloch sphere coordinates
export interface BlochCoordinates {
  x: number; // X coordinate (-1 to 1)
  y: number; // Y coordinate (-1 to 1)
  z: number; // Z coordinate (-1 to 1)
}

interface BlochSphereVisualizationProps {
  // The state vector as an object with basis states as keys and complex amplitudes as [real, imag] arrays
  stateVector?: Record<string, [number, number]>;
  // If a single qubit is provided directly instead of a state vector
  blochCoordinates?: BlochCoordinates;
  // Which qubit to visualize if the state vector has multiple qubits
  qubitIndex?: number;
  // Optional width and height
  width?: number;
  height?: number;
  // Optional title
  title?: string;
}

/**
 * Component that visualizes a single qubit state on the Bloch sphere
 */
const BlochSphereVisualization: React.FC<BlochSphereVisualizationProps> = ({
  stateVector,
  blochCoordinates,
  qubitIndex = 0,
  width = 300,
  height = 300,
  title = 'Bloch Sphere',
}) => {
  // Container ref for the Three.js scene
  const containerRef = useRef<HTMLDivElement>(null);
  // Track animation frame to cancel if component unmounts
  const requestRef = useRef<number>();
  // Track if the renderer is initialized
  const rendererInitializedRef = useRef<boolean>(false);
  
  // References to Three.js objects we'll need to update
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const stateVectorArrowRef = useRef<THREE.ArrowHelper>();
  const sphereRef = useRef<THREE.Mesh>();
  
  // Theme colors with more modern, vibrant palette
  const bgColor = useColorModeValue('#f8fafc', '#111827'); // Lighter gray, darker slate
  const sphereColor = useColorModeValue('#e2e8f0', '#4a5568'); // Subtle gray, slate
  const axisXColor = useColorModeValue('#ef4444', '#f87171'); // Vibrant red
  const axisYColor = useColorModeValue('#10b981', '#34d399'); // Modern green
  const axisZColor = useColorModeValue('#3b82f6', '#60a5fa'); // Bright blue
  const stateVectorColor = useColorModeValue('#8b5cf6', '#a78bfa'); // Vibrant purple
  
  // For the circle guides
  const equatorColor = useColorModeValue('#E2E8F0', '#4A5568');
  
  // Calculate Bloch coordinates from state vector
  const calculateBlochCoordinates = (): BlochCoordinates | null => {
    if (blochCoordinates) {
      return blochCoordinates;
    }
    
    if (!stateVector) return null;
    
    // Use the utility function from blochSphereUtils
    return stateVectorToBloch(stateVector, qubitIndex);
  };
  
  // Initialize Three.js scene
  const initThree = () => {
    if (!containerRef.current || rendererInitializedRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
      width / height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.z = 2;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create Bloch sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);  // Increased segments for smoother appearance
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: sphereColor,
      transparent: true,
      opacity: 0.15,  // More subtle transparency
      wireframe: false  // Solid surface instead of wireframe
    });
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: sphereColor,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    
    // Create both a solid and wireframe sphere for a modern look
    const solidSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    const wireframeSphere = new THREE.Mesh(sphereGeometry, wireMaterial);
    scene.add(solidSphere);
    scene.add(wireframeSphere);
    sphereRef.current = solidSphere;
    
    // Create coordinate axes with more elegant arrows
    // X-axis (red)
    const xAxisHelper = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1.2,
      axisXColor,
      0.08,  // Smaller arrow head
      0.04   // Thinner arrow head
    );
    scene.add(xAxisHelper);
    
    // Y-axis (green)
    const yAxisHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1.2,
      axisYColor,
      0.08,
      0.04
    );
    scene.add(yAxisHelper);
    
    // Z-axis (blue)
    const zAxisHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      1.2,
      axisZColor,
      0.08,
      0.04
    );
    scene.add(zAxisHelper);
    
    // Add circular guides for a modern look
    const equatorGeometry = new THREE.TorusGeometry(1, 0.005, 16, 100);
    const equatorMaterial = new THREE.MeshBasicMaterial({ 
      color: equatorColor,
      transparent: true,
      opacity: 0.5
    });
    const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
    scene.add(equator);
    
    // Add XZ circle (vertical aligned with X)
    const xzCircleGeometry = new THREE.TorusGeometry(1, 0.005, 16, 100);
    const xzCircle = new THREE.Mesh(xzCircleGeometry, equatorMaterial);
    xzCircle.rotation.y = Math.PI / 2;
    scene.add(xzCircle);
    
    // Add YZ circle (vertical aligned with Y)
    const yzCircleGeometry = new THREE.TorusGeometry(1, 0.005, 16, 100);
    const yzCircle = new THREE.Mesh(yzCircleGeometry, equatorMaterial);
    yzCircle.rotation.x = Math.PI / 2;
    scene.add(yzCircle);
    
    // Add axis labels with a cleaner look
    addAxisLabel(scene, 'X', new THREE.Vector3(1.3, 0, 0), axisXColor);
    addAxisLabel(scene, 'Y', new THREE.Vector3(0, 1.3, 0), axisYColor);
    addAxisLabel(scene, 'Z', new THREE.Vector3(0, 0, 1.3), axisZColor);
    
    // Add state labels |0⟩ and |1⟩ with improved styling
    addAxisLabel(scene, '|0⟩', new THREE.Vector3(0, 0, 1.5), axisZColor);
    addAxisLabel(scene, '|1⟩', new THREE.Vector3(0, 0, -1.5), axisZColor);
    
    // Add a state vector arrow with a more elegant look
    const stateVectorArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), // Initial direction
      new THREE.Vector3(0, 0, 0), // Origin
      1, // Length
      stateVectorColor, // Color
      0.08, // Head length
      0.04 // Head width
    );
    scene.add(stateVectorArrow);
    stateVectorArrowRef.current = stateVectorArrow;
    
    // Add a subtle point at the tip of the arrow for better visibility
    const sphereGeometry2 = new THREE.SphereGeometry(0.035, 16, 16);
    const sphereMaterial2 = new THREE.MeshBasicMaterial({ color: stateVectorColor });
    const pointSphere = new THREE.Mesh(sphereGeometry2, sphereMaterial2);
    pointSphere.position.set(0, 0, 1); // Position at the end of the initial arrow
    scene.add(pointSphere);
    
    // Set renderer as initialized
    rendererInitializedRef.current = true;
    
    // Initial render
    renderer.render(scene, camera);
  };
  
  // Helper to add text labels with modern styling
  const addAxisLabel = (
    scene: THREE.Scene, 
    text: string, 
    position: THREE.Vector3, 
    color: string
  ) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 128;
    canvas.height = 64;
    
    // Clear background
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text with subtle shadow for better visibility
    context.font = 'Bold 38px Inter, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Text shadow for better contrast
    context.shadowColor = 'rgba(0, 0, 0, 0.6)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    
    context.fillStyle = color;
    context.fillText(text, 64, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(0.5, 0.25, 1);
    
    scene.add(sprite);
  };
  
  // Update state vector visualization with smooth animation
  const updateStateVector = () => {
    if (!stateVectorArrowRef.current) return;
    
    const blochCoords = calculateBlochCoordinates();
    if (!blochCoords) return;
    
    const { x, y, z } = blochCoords;
    
    // Update the arrow direction and length with smoothing
    const direction = new THREE.Vector3(x, y, z).normalize();
    
    // Get the current direction for smoother transitions
    const currentDirection = stateVectorArrowRef.current.getWorldDirection(new THREE.Vector3());
    
    // Interpolate between current and target direction for smoother animation
    const smoothedDirection = new THREE.Vector3().lerpVectors(
      currentDirection, 
      direction,
      0.1 // Smoothing factor - lower is smoother but slower
    ).normalize();
    
    stateVectorArrowRef.current.setDirection(smoothedDirection);
    stateVectorArrowRef.current.setLength(1, 0.08, 0.04);
    
    // Update point sphere position if it exists
    if (sceneRef.current) {
      const pointSphere = sceneRef.current.children.find(
        child => child instanceof THREE.Mesh && 
                child.geometry instanceof THREE.SphereGeometry && 
                child.geometry.parameters.radius === 0.035
      ) as THREE.Mesh;
      
      if (pointSphere) {
        // Position the sphere at the tip of the arrow
        pointSphere.position.copy(direction);
      }
    }
  };
  
  // Animation loop
  const animate = () => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    // Add rotation animation to the sphere for better 3D perception
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.002;
    }
    
    // Render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    // Request next frame
    requestRef.current = requestAnimationFrame(animate);
  };
  
  // Initialize and clean up Three.js
  useEffect(() => {
    initThree();
    
    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
        rendererInitializedRef.current = false;
      }
    };
  }, [width, height]);
  
  // Update state vector when it changes
  useEffect(() => {
    updateStateVector();
  }, [stateVector, blochCoordinates, qubitIndex]);
  
  return (
    <VStack spacing={4} w="100%">
      <Heading size="sm">{title}</Heading>
      <Box 
        ref={containerRef} 
        w={`${width}px`} 
        h={`${height}px`} 
        position="relative"
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      >
        {!stateVector && !blochCoordinates && (
          <Box 
            position="absolute" 
            top="0" 
            left="0" 
            right="0" 
            bottom="0" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <Spinner size="xl" color="blue.500" />
          </Box>
        )}
      </Box>
      <VStack spacing={1}>
        <Text fontSize="sm" fontWeight="medium">State Coordinates:</Text>
        {calculateBlochCoordinates() ? (
          <Box 
            p={2} 
            bgColor={useColorModeValue("gray.50", "gray.800")} 
            borderRadius="md"
            boxShadow="sm"
          >
            <Text fontSize="sm" fontFamily="monospace">
              (
              {calculateBlochCoordinates()?.x.toFixed(2)}, 
              {calculateBlochCoordinates()?.y.toFixed(2)}, 
              {calculateBlochCoordinates()?.z.toFixed(2)}
              )
            </Text>
          </Box>
        ) : (
          <Text fontSize="sm" color="gray.500">No state data available</Text>
        )}
      </VStack>
    </VStack>
  );
};

export default BlochSphereVisualization;