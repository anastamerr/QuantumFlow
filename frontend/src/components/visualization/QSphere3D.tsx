// src/components/visualization/QSphere3D.tsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { convertToQSphereData } from '../../utils/qSphereCalculations';

// Component for a single state point as an arrow from origin to point
function StatePoint({ point, index }: { point: any; index: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  // Arrow starts at origin (0,0,0) and goes to the point position
  const arrowDirection = new THREE.Vector3(...point.position).normalize();
  const arrowLength = Math.sqrt(
    point.position[0] * 2 + point.position[1] * 2 + point.position[2] ** 2
  );

  return (
    <group 
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Arrow from origin to point position */}
      <arrowHelper
        args={[
          arrowDirection, // direction
          new THREE.Vector3(0, 0, 0), // origin (starts at center)
          arrowLength, // length (distance from origin to point)
          point.color, // color based on phase
          point.size * 0.8, // head length (scaled by probability)
          point.size * 0.5 // head width (scaled by probability)
        ]}
      />
      
      {/* Small sphere at the arrow tip (the actual state point) */}
      <mesh position={point.position}>
        <sphereGeometry args={[point.size * 0.2, 6, 6]} />
        <meshStandardMaterial 
          color={point.color} 
          emissive={point.color}
          emissiveIntensity={hovered ? 1 : 0.5}
        />
      </mesh>
      
      {/* Hover Tooltip */}
      {hovered && (
        <Html position={[point.position[0], point.position[1] + point.size + 0.3, point.position[2]]}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #4FD1C5',
            fontSize: '12px',
            minWidth: '150px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              State |{point.state}⟩
            </div>
            <div>Probability: <strong>{(point.probability * 100).toFixed(1)}%</strong></div>
            <div>Amplitude: {point.amplitude.real.toFixed(3)} + {point.amplitude.imag.toFixed(3)}i</div>
            <div>Phase: {(point.phase * 180 / Math.PI).toFixed(1)}°</div>
            <div style={{ 
              width: '100%', 
              height: '3px', 
              background: 'linear-gradient(to right, ${point.color} 0%, ${point.color} ${point.probability * 100}%, #333 ${point.probability * 100}%)',
              marginTop: '5px',
              borderRadius: '2px'
            }}></div>
          </div>
        </Html>
      )}
      
      {/* State label */}
      <Text
        position={[point.position[0], point.position[1] + point.size + 0.15, point.position[2]]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {'|${point.state}⟩'}
      </Text>
    </group>
  );
}

// Main Q-Sphere visualization
function QSphereVisualization() {
  const groupRef = useRef<THREE.Group>(null!);
  
  // Test data - Bell state (entangled)
  const testState = {
    "00": { real: 1/Math.sqrt(2), imag: 0 },
    "11": { real: 1/Math.sqrt(2), imag: 0 }
  };
  
  const qSphereData = convertToQSphereData(testState, 2);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0;
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
          opacity={0.15} 
          wireframe 
        />
      </mesh>
      
      {/* Arrows from origin to each state point */}
      {qSphereData.points.map((point, index) => (
        <StatePoint key={index} point={point} index={index} />
      ))}
      
      {/* Coordinate system that rotates with the sphere */}
      <gridHelper args={[5, 20, '#4A5568', '#4A5568']} />
      <axesHelper args={[3]} />
    </group>
  );
}

// Phase Key Component
function PhaseKey() {
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '12px',
      border: '1px solid #4FD1C5',
      zIndex: 100
    }}>
      <div style={{fontWeight: 'bold', marginBottom: '8px'}}>Phase Color Key</div>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
        <div style={{
          width: '100%',
          height: '20px',
          background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
          borderRadius: '3px'
        }}/>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px'}}>
        <span>0°</span>
        <span>180°</span>
        <span>360°</span>
      </div>
      <div style={{fontSize: '10px', marginTop: '8px', color: '#CBD5E0'}}>
        Colors represent quantum phase (0-360°)
      </div>
    </div>
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
      borderRadius: '8px',
      position: 'relative'
    }}>
      {/* Info Button */}
      <button 
        style={{
          position: 'absolute', 
          top: '10px', 
          left: '10px', 
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          border: '1px solid #4FD1C5',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          cursor: 'pointer',
          zIndex: 100,
          fontSize: '16px'
        }}
        title="Q-Sphere shows the entire quantum state. Points represent basis states, size shows probability, color shows phase."
      >
        ℹ️
      </button>
      
      <Canvas
        camera={{ position: [4, 4, 4], fov: 50 }}
        style={{ background: '#2d3748' }}
      >
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Q-Sphere with rotating axes */}
        <QSphereVisualization />
        
        {/* Controls */}
        <OrbitControls enableZoom={true} enablePan={true} />
        
        {/* NO STATIONARY HELPERS HERE - they're inside QSphereVisualization */}
      </Canvas>
      
      {/* Phase Key */}
      <PhaseKey />
      
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