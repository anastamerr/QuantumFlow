// src/components/visualization/QSphere3D.tsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { convertToQSphereData } from '../../utils/qSphereCalculations';

// Component for a single state point on the Q-Sphere
function StatePoint({ point, index }: { point: any; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  return (
    <mesh position={point.position} ref={meshRef}>
      <sphereGeometry args={[point.size, 16, 16]} />
      <meshStandardMaterial 
        color={point.color} 
        emissive={point.color}
        emissiveIntensity={0.3}
      />
      {/* State label */}
      <Text
        position={[0, point.size + 0.1, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {`|${point.state}⟩`}
      </Text>
    </mesh>
  );
}

// Main Q-Sphere visualization
function QSphereVisualization() {
  const groupRef = useRef<THREE.Group>(null!);
  
  // Test data - replace with real quantum state later
  const testState = {
    "00": { real: 1/Math.sqrt(2), imag: 0 },
    "11": { real: 1/Math.sqrt(2), imag: 0 }
  };
  
  const qSphereData = convertToQSphereData(testState, 2);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2; // Slow rotation
    }
  });

  return (
    <group ref={groupRef}>
      {/* Q-Sphere wireframe */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial 
          color="#4FD1C5" 
          transparent 
          opacity={0.2} 
          wireframe 
        />
      </mesh>
      
      {/* State points */}
      {qSphereData.points.map((point, index) => (
        <StatePoint key={index} point={point} index={index} />
      ))}
    </group>
  );
}

// Main component
export default function QSphere3D() {
  return (
    <div style={{ 
      width: '100%', 
      height: '500px', 
      background: '#1a1a1a',
      border: '2px solid #00ff00',
      borderRadius: '8px'
    }}>
      <Canvas
        camera={{ position: [4, 4, 4], fov: 50 }}
        style={{ background: '#2d3748' }}
      >
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Q-Sphere */}
        <QSphereVisualization />
        
        {/* Controls */}
        <OrbitControls enableZoom={true} enablePan={true} />
        
        {/* Helpers */}
        <gridHelper args={[5, 20, '#4A5568', '#4A5568']} />
        <axesHelper args={[3]} />
      </Canvas>
      
      <div style={{ 
        padding: '10px', 
        color: 'white', 
        textAlign: 'center',
        background: '#2d3748'
      }}>
        <strong>Q-Sphere 3D Visualization</strong>
        <br />
        <small>Drag to rotate • Scroll to zoom • Green border = 3D working!</small>
      </div>
    </div>
  );
}