import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function OrbSphere() {
  const meshRef = useRef();
  const eyesRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!meshRef.current) return;

    // Pulse scale slightly
    const scale = 1.0 + Math.sin(time * 2.0) * 0.05;
    meshRef.current.scale.set(scale, scale, scale);

    // Rotate mesh
    meshRef.current.rotation.y = time * 0.2;
    meshRef.current.rotation.z = time * 0.1;

    // Follow mouse coordinates
    const targetX = state.mouse.x * 0.8;
    const targetY = state.mouse.y * 0.8;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);

    // Dynamic eyes blink sequence
    if (leftEyeRef.current && rightEyeRef.current) {
      const blink = Math.sin(time * 4) > 0.98 ? 0.1 : 1.0;
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blink, 0.2);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blink, 0.2);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Dynamic distorting glass core */}
      <Sphere args={[1.0, 32, 32]}>
        <MeshDistortMaterial
          color="#3b82f6"
          roughness={0.1}
          metalness={0.9}
          distort={0.35}
          speed={2.2}
          clearcoat={1.0}
          transmission={0.65}
          thickness={1.2}
          opacity={0.8}
          transparent
        />
      </Sphere>

      {/* Wireframe outer shell */}
      <Sphere args={[1.15, 16, 16]}>
        <meshBasicMaterial
          color="#22d3ee"
          wireframe
          transparent
          opacity={0.18}
        />
      </Sphere>

      {/* Glowing neural energy rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.015, 8, 32]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[1.32, 0.012, 8, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
      </mesh>

      {/* Holographic Smiling Face Emotive Layer */}
      <group ref={eyesRef} position={[0, 0.05, 0.95]}>
        {/* Left Eye */}
        <mesh ref={leftEyeRef} position={[-0.22, 0.1, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        {/* Right Eye */}
        <mesh ref={rightEyeRef} position={[0.22, 0.1, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        {/* Simple smile arc */}
        <mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.12, 0.02, 8, 16, Math.PI * 0.6]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </group>
    </group>
  );
}

export default function AIOrb() {
  return (
    <div className="h-60 sm:h-72 w-full max-w-sm mx-auto relative flex items-center justify-center">
      {/* Outer glow ring shadows */}
      <div className="absolute inset-10 rounded-full bg-cyan-500/10 blur-[60px] animate-pulse pointer-events-none" />
      <div className="absolute inset-14 rounded-full bg-purple-500/10 blur-[80px] animate-pulse pointer-events-none" />

      <Canvas camera={{ position: [0, 0, 3.2], fov: 60 }} gl={{ alpha: true }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2.0} color="#22d3ee" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#a855f7" />
        
        <Float speed={2.0} rotationIntensity={0.5} floatIntensity={0.8}>
          <OrbSphere />
        </Float>
      </Canvas>
    </div>
  );
}
