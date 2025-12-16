import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Spinner, useColorModeValue } from '@chakra-ui/react';
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
  const [isRendererInitialized, setIsRendererInitialized] = useState(false);
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
  const stateVectorArrowRef = useRef<THREE.Group | THREE.ArrowHelper>();
  const sphereRef = useRef<THREE.Mesh>();
  const guideMaterialsRef = useRef<Array<{ material: THREE.Material; baseOpacity: number }>>([]);

  const targetRef = useRef<{
    quaternion: THREE.Quaternion;
    length: number;
  } | null>(null);
  if (!targetRef.current) {
    targetRef.current = { quaternion: new THREE.Quaternion(), length: 1 };
  }

  const currentLengthRef = useRef<number>(1);
  const tmpObjectsRef = useRef<{
    direction: THREE.Vector3;
    matrix: THREE.Matrix4;
    origin: THREE.Vector3;
    up: THREE.Vector3;
  } | null>(null);
  if (!tmpObjectsRef.current) {
    tmpObjectsRef.current = {
      direction: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      origin: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
    };
  }
  
  // Modern glassmorphism-inspired color palette
  const sphereColor = useColorModeValue('#f1f5f9', '#1e293b'); // Subtle slate
  const sphereGlowColor = useColorModeValue('#e2e8f0', '#334155'); // Glow effect
  const axisXColor = useColorModeValue('#f43f5e', '#fb7185'); // Rose/pink for X
  const axisYColor = useColorModeValue('#06d6a0', '#34d399'); // Emerald for Y  
  const axisZColor = useColorModeValue('#0ea5e9', '#38bdf8'); // Sky blue for Z
  const stateVectorColor = useColorModeValue('#8b5cf6', '#a855f7'); // Purple gradient
  const stateVectorGlow = useColorModeValue('#c084fc', '#d8b4fe'); // Lighter purple glow
  
  // Modern guide colors with gradients
  const guideColor = useColorModeValue('#e2e8f0', '#475569');
  const guideGlowColor = useColorModeValue('#cbd5e1', '#64748b');

  const loadingOverlayBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(15,15,35,0.9)');
  const loadingPulseBg = useColorModeValue('purple.100', 'purple.900');
  const loadingTextColor = useColorModeValue('gray.600', 'gray.400');
  
  const computedBlochCoordinates = useMemo((): BlochCoordinates | null => {
    if (blochCoordinates) return blochCoordinates;
    if (!stateVector) return null;
    return stateVectorToBloch(stateVector, qubitIndex);
  }, [stateVector, blochCoordinates, qubitIndex]);
  
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
    
    // Create renderer with modern settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize for retina
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add modern lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    // Create modern glassmorphism Bloch sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 128, 64);  // High quality geometry
    
    // Main sphere with glassmorphism effect
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(sphereColor),
      transparent: true,
      opacity: 0.12,
      transmission: 0.9, // Glass-like transmission
      thickness: 0.1,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      ior: 1.5, // Index of refraction for glass
      side: THREE.DoubleSide
    });
    
    // Inner glow sphere
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(sphereGlowColor),
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    
    // Wireframe overlay with gradient effect
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(guideColor),
      transparent: true,
      opacity: 0.25,
      wireframe: true
    });
    
    const mainSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 32), glowMaterial);
    const wireframeSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    
    scene.add(glowSphere);
    scene.add(mainSphere);
    scene.add(wireframeSphere);
    sphereRef.current = mainSphere;
    
    // Create modern gradient axes with glow effects
    const createModernAxis = (direction: THREE.Vector3, color: string, glowColor: string) => {
      // Main axis line with gradient
      const lineGeometry = new THREE.CylinderGeometry(0.012, 0.012, 2.4, 16);
      const lineMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0
      });
      
      const axisLine = new THREE.Mesh(lineGeometry, lineMaterial);
      
      // Align cylinder with direction
      if (direction.x !== 0) {
        axisLine.rotation.z = Math.PI / 2;
      } else if (direction.y !== 0) {
        // Already aligned with Y
      } else {
        axisLine.rotation.x = Math.PI / 2;
      }
      
      // Arrow head with modern design
      const arrowGeometry = new THREE.ConeGeometry(0.04, 0.12, 12);
      const arrowMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.9
      });
      
      const arrowHead = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrowHead.position.copy(direction.clone().multiplyScalar(1.26));
      
      // Orient arrow head
      if (direction.x !== 0) {
        arrowHead.rotation.z = direction.x > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else if (direction.z !== 0) {
        arrowHead.rotation.x = direction.z > 0 ? 0 : Math.PI;
      }
      
      // Glow effect
      const glowGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(glowColor),
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.rotation.copy(axisLine.rotation);
      
      scene.add(glow);
      scene.add(axisLine);
      scene.add(arrowHead);
    };
    
    createModernAxis(new THREE.Vector3(1, 0, 0), axisXColor, axisXColor);
    createModernAxis(new THREE.Vector3(0, 1, 0), axisYColor, axisYColor);
    createModernAxis(new THREE.Vector3(0, 0, 1), axisZColor, axisZColor);
    
    // Add modern guide circles with glow effects
    const createGuideCircle = (rotation: THREE.Euler, color: string) => {
      // Main guide ring
      const ringGeometry = new THREE.TorusGeometry(1, 0.008, 12, 100);
      const ringMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.7
      });
      
      // Glow effect
      const glowGeometry = new THREE.TorusGeometry(1, 0.015, 8, 64);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(guideGlowColor),
        transparent: true,
        opacity: 0.15
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      
      ring.rotation.copy(rotation);
      glow.rotation.copy(rotation);
      
      guideMaterialsRef.current.push({ material: ringMaterial, baseOpacity: 0.6 });
      guideMaterialsRef.current.push({ material: glowMaterial, baseOpacity: 0.15 });
      scene.add(glow);
      scene.add(ring);
    };
    
    // XY plane (equator)
    createGuideCircle(new THREE.Euler(0, 0, 0), guideColor);
    // XZ plane
    createGuideCircle(new THREE.Euler(Math.PI / 2, 0, 0), guideColor);
    // YZ plane  
    createGuideCircle(new THREE.Euler(0, Math.PI / 2, 0), guideColor);
    
    // Add axis labels with a cleaner look
    addAxisLabel(scene, 'X', new THREE.Vector3(1.3, 0, 0), axisXColor);
    addAxisLabel(scene, 'Y', new THREE.Vector3(0, 1.3, 0), axisYColor);
    addAxisLabel(scene, 'Z', new THREE.Vector3(0, 0, 1.3), axisZColor);
    
    // Add state labels |0⟩ and |1⟩ with improved styling
    addAxisLabel(scene, '|0⟩', new THREE.Vector3(0, 0, 1.5), axisZColor);
    addAxisLabel(scene, '|1⟩', new THREE.Vector3(0, 0, -1.5), axisZColor);
    
    // Create ultra-modern state vector with glow trail
    const createStateVector = () => {
      // Main arrow shaft
      const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 16);
      const shaftMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(stateVectorColor),
        emissive: new THREE.Color(stateVectorColor),
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.8,
        clearcoat: 1.0
      });
      
      // Arrow head with premium look
      const headGeometry = new THREE.ConeGeometry(0.06, 0.15, 12);
      const headMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(stateVectorColor),
        emissive: new THREE.Color(stateVectorColor),
        emissiveIntensity: 0.6,
        roughness: 0.05,
        metalness: 0.9,
        clearcoat: 1.0
      });
      
      // Glowing tip sphere
      const tipGeometry = new THREE.SphereGeometry(0.04, 16, 16);
      const tipMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(stateVectorGlow),
        emissive: new THREE.Color(stateVectorGlow),
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      });
      
      // Glow halo around tip
      const haloGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(stateVectorGlow),
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      
      const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
      const head = new THREE.Mesh(headGeometry, headMaterial);
      const tip = new THREE.Mesh(tipGeometry, tipMaterial);
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      
      // Group all parts
      const stateVectorGroup = new THREE.Group();
      stateVectorGroup.add(shaft);
      stateVectorGroup.add(head);
      stateVectorGroup.add(tip);
      stateVectorGroup.add(halo);
      
      // Initial positioning (pointing to |0⟩)
      shaft.position.set(0, 0, 0.5);
      head.position.set(0, 0, 1.075);
      tip.position.set(0, 0, 1.15);
      halo.position.set(0, 0, 1.15);
      
      scene.add(stateVectorGroup);
      return stateVectorGroup;
    };
    
    const stateVectorGroup = createStateVector();
    stateVectorArrowRef.current = stateVectorGroup;
    
    // Set renderer as initialized
    rendererInitializedRef.current = true;
    setIsRendererInitialized(true);
    
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
    
    // Modern typography with glow effect
    context.font = 'Bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Multiple glow layers for modern effect
    context.shadowColor = color;
    context.shadowBlur = 12;
    context.fillStyle = color;
    context.fillText(text, 64, 32);
    
    // Second glow layer
    context.shadowBlur = 6;
    context.fillText(text, 64, 32);
    
    // Sharp text on top
    context.shadowBlur = 0;
    context.fillStyle = '#ffffff';
    context.fillText(text, 64, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(0.6, 0.3, 1); // Slightly larger for better visibility
    
    scene.add(sprite);
  };
  
  // Update state vector visualization with smooth animation
  const updateStateVector = () => {
    if (!stateVectorArrowRef.current) return;
    
    if (!targetRef.current) return;

    const targetQuaternion = targetRef.current.quaternion;
    const targetLength = targetRef.current.length;
    if (targetLength < 1e-10) return;
    
    // Check if we're using the modern group or fallback arrow
    const stateVector = stateVectorArrowRef.current;
    
    if (stateVector instanceof THREE.Group) {
      // Modern grouped state vector
      
      // Smooth interpolation
      stateVector.quaternion.slerp(targetQuaternion, 0.1);
      
      // Update individual component positions based on new orientation
      const shaft = stateVector.children[0] as THREE.Mesh;
      const head = stateVector.children[1] as THREE.Mesh;
      const tip = stateVector.children[2] as THREE.Mesh;
      const halo = stateVector.children[3] as THREE.Mesh;
      
      // Smooth length changes without re-computing Bloch coordinates each frame
      currentLengthRef.current += (targetLength - currentLengthRef.current) * 0.15;
      const scale = Math.max(0.3, Math.min(currentLengthRef.current, 1.0));
      
      if (shaft && head && tip && halo) {
        // Update positions relative to group origin
        shaft.position.set(0, 0, 0.5 * scale);
        head.position.set(0, 0, 1.075 * scale);
        tip.position.set(0, 0, 1.15 * scale);
        halo.position.set(0, 0, 1.15 * scale);
        
        // Adjust opacity based on vector magnitude
        const opacity = Math.max(0.6, scale);
        if (tip.material && 'opacity' in tip.material) {
          (tip.material as THREE.Material & { opacity: number }).opacity = opacity;
        }
        if (halo.material && 'opacity' in halo.material) {
          (halo.material as THREE.Material & { opacity: number }).opacity = 0.3 * opacity;
        }
      }
    } else if (stateVector instanceof THREE.ArrowHelper) {
      // Fallback to simple arrow helper
      if (!tmpObjectsRef.current) return;
      stateVector.setDirection(tmpObjectsRef.current.direction);
      stateVector.setLength(targetLength, 0.08, 0.04);
    }
  };
  
  // Animation loop with enhanced effects
  const animate = () => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const time = Date.now() * 0.001; // Time in seconds
    
    // Smooth camera orbit for better viewing
    const radius = 2.5;
    const cameraX = Math.cos(time * 0.1) * radius;
    const cameraZ = Math.sin(time * 0.1) * radius;
    cameraRef.current.position.set(cameraX, 1.2, cameraZ);
    cameraRef.current.lookAt(0, 0, 0);
    
    // Subtle sphere rotation for depth perception
    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.05;
      sphereRef.current.rotation.x = Math.sin(time * 0.03) * 0.1;
    }
    
    // Animate guide circles with subtle pulsing
    const pulse = Math.sin(time * 2) * 0.1;
    guideMaterialsRef.current.forEach(({ material, baseOpacity }) => {
      if ('opacity' in material) {
        (material as THREE.Material & { opacity: number }).opacity = baseOpacity + pulse;
      }
    });
    
    // Update state vector
    updateStateVector();
    
    // Render with post-processing effects
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    // Request next frame
    requestRef.current = requestAnimationFrame(animate);
  };
  
  // Initialize and clean up Three.js
  useEffect(() => {
    setIsRendererInitialized(false);
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
        guideMaterialsRef.current = [];
      }
    };
  }, [width, height]);
  
  // Update target direction when state changes (avoid stale animation closures)
  useEffect(() => {
    if (!computedBlochCoordinates || !targetRef.current || !tmpObjectsRef.current) return;

    const { x, y, z } = computedBlochCoordinates;
    tmpObjectsRef.current.direction.set(x, y, z);
    const length = tmpObjectsRef.current.direction.length();
    targetRef.current.length = length;

    if (length < 1e-10) {
      targetRef.current.quaternion.identity();
      return;
    }

    tmpObjectsRef.current.direction.normalize();
    tmpObjectsRef.current.matrix.lookAt(
      tmpObjectsRef.current.origin,
      tmpObjectsRef.current.direction,
      tmpObjectsRef.current.up
    );
    targetRef.current.quaternion.setFromRotationMatrix(tmpObjectsRef.current.matrix);
  }, [computedBlochCoordinates]);
  
  return (
    <VStack spacing={4} w="100%" align="stretch">
      <Heading 
        size="sm" 
        bgGradient={useColorModeValue(
          'linear(to-r, purple.600, blue.600)', 
          'linear(to-r, purple.400, blue.400)'
        )}
        bgClip="text"
        fontWeight="bold"
        textAlign="center"
      >
        {title}
      </Heading>
      
      <Box 
        ref={containerRef} 
        w={`${width}px`} 
        h={`${height}px`} 
        position="relative"
        borderRadius="xl"
        overflow="hidden"
        bg={useColorModeValue(
          'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          'linear-gradient(135deg, #0f0f23 0%, #1e1e3f 100%)'
        )}
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        boxShadow={useColorModeValue(
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        )}
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: useColorModeValue(
            '0 25px 30px -5px rgba(0, 0, 0, 0.15), 0 15px 15px -5px rgba(0, 0, 0, 0.08)',
            '0 25px 30px -5px rgba(0, 0, 0, 0.4), 0 15px 15px -5px rgba(0, 0, 0, 0.3)'
          )
        }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        mx="auto"
      >
        {!isRendererInitialized && (
          <Box 
            position="absolute" 
            top="0" 
            left="0" 
            right="0" 
            bottom="0" 
            display="flex" 
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            bg={loadingOverlayBg}
            backdropFilter="blur(10px)"
          >
            <VStack spacing={4}>
              <Box position="relative">
                <Spinner 
                  size="xl" 
                  thickness="3px"
                  speed="0.8s"
                  color="purple.500"
                />
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg={loadingPulseBg}
                  opacity={0.3}
                  animation="ping 2s cubic-bezier(0, 0, 0.2, 1) infinite"
                />
              </Box>
              <Text 
                fontSize="sm" 
                color={loadingTextColor}
                fontWeight="medium"
                textAlign="center"
              >
                Initializing quantum visualization...
              </Text>
            </VStack>
          </Box>
        )}
      </Box>
      
      {/* Enhanced coordinates display */}
      <Box
        p={4}
        bg={useColorModeValue('white', 'gray.800')}
        borderRadius="lg"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
        boxShadow="sm"
      >
        <Text 
          fontSize="sm" 
          fontWeight="bold" 
          mb={3} 
          color={useColorModeValue('gray.700', 'gray.300')}
          textAlign="center"
        >
          Bloch Coordinates
        </Text>
        {(() => {
          const coords = computedBlochCoordinates;
          return coords ? (
            <HStack 
              spacing={6} 
              justify="center" 
              fontSize="sm" 
              fontFamily="mono"
              fontWeight="medium"
            >
              <VStack spacing={1}>
                <Text color="red.500" fontSize="xs" fontWeight="bold">X</Text>
                <Text color="red.500">{coords.x.toFixed(3)}</Text>
              </VStack>
              <VStack spacing={1}>
                <Text color="green.500" fontSize="xs" fontWeight="bold">Y</Text>
                <Text color="green.500">{coords.y.toFixed(3)}</Text>
              </VStack>
              <VStack spacing={1}>
                <Text color="blue.500" fontSize="xs" fontWeight="bold">Z</Text>
                <Text color="blue.500">{coords.z.toFixed(3)}</Text>
              </VStack>
            </HStack>
          ) : (
            <Text 
              fontSize="sm" 
              color="gray.500" 
              textAlign="center"
              fontStyle="italic"
            >
              No state data available
            </Text>
          );
        })()}
      </Box>
    </VStack>
  );
};

export default BlochSphereVisualization;
