import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function BrainNetwork({ isSpeaking }) {
  const groupRef = useRef();
  const pointsRef = useRef();
  const activePointsRef = useRef();
  const linesRef = useRef();

  // Generate 2,200 points in a high-fidelity anatomy-accurate brain structure
  const { linePositions, nodePositions, activeNodePositions } = useMemo(() => {
    const points = [];
    const count = 2200; // High density for premium detail

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      
      if (rand < 0.74) {
        // 1. CEREBRUM (Hemispheres with lobes and fissure split)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        const xSign = Math.cos(theta) >= 0 ? 1 : -1;
        const lobeOffset = xSign * 0.08; // Central longitudinal fissure split
        
        // Folds / Gyri wrinkles
        const wrinkle = Math.sin(phi * 10) * Math.cos(theta * 10) * 0.06 +
                        Math.sin(phi * 24) * 0.015;
        
        const r = 0.62 + wrinkle;
        const px = Math.sin(phi) * Math.cos(theta) * r * 0.72 + lobeOffset;
        const py = Math.sin(phi) * Math.sin(theta) * r * 0.78 + 0.12; 
        const pz = Math.cos(phi) * r * 1.02;
        
        // Leave lower-back clear for Cerebellum
        if (py < -0.05 && pz < -0.1) continue;
        
        points.push(new THREE.Vector3(px, py, pz));
      } else if (rand < 0.92) {
        // 2. CEREBELLUM (Lower back cluster with tighter folds)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        const wrinkle = Math.sin(phi * 16) * Math.cos(theta * 16) * 0.03;
        const r = 0.36 + wrinkle;
        
        const px = Math.sin(phi) * Math.cos(theta) * r * 0.82;
        const py = Math.sin(phi) * Math.sin(theta) * r * 0.6 - 0.28;
        const pz = Math.cos(phi) * r * 0.8 - 0.42;
        
        points.push(new THREE.Vector3(px, py, pz));
      } else {
        // 3. BRAINSTEM (Tapering stalk extending downwards)
        const y = -0.28 - Math.random() * 0.45;
        const rad = 0.1 * (1.0 + (y + 0.28));
        const angle = Math.random() * Math.PI * 2;
        
        const px = Math.cos(angle) * rad + (Math.random() - 0.5) * 0.01;
        const py = y;
        const pz = Math.sin(angle) * rad - 0.08;
        
        points.push(new THREE.Vector3(px, py, pz));
      }
    }

    // Connect closest nodes with thin lines to form pathways
    const linePos = [];
    const maxDist = 0.14;
    for (let i = 0; i < points.length; i++) {
      const pi = points[i];
      let connections = 0;
      for (let j = i + 1; j < points.length; j++) {
        const pj = points[j];
        const d = pi.distanceTo(pj);
        if (d < maxDist) {
          linePos.push(pi.x, pi.y, pi.z);
          linePos.push(pj.x, pj.y, pj.z);
          connections++;
          if (connections >= 2) break;
        }
      }
    }

    const activeNodes = points.filter((_, idx) => idx % 5 === 0);

    return {
      linePositions: new Float32Array(linePos),
      nodePositions: new Float32Array(points.flatMap(p => [p.x, p.y, p.z])),
      activeNodePositions: new Float32Array(activeNodes.flatMap(p => [p.x, p.y, p.z]))
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    // Hover tilt oscillation
    groupRef.current.rotation.y = time * 0.06;
    groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.04;
    groupRef.current.rotation.z = Math.cos(time * 0.25) * 0.02;

    // Speech-reactive scale pulse (Subtle breathing/chatter)
    let scaleVal = 1.15; 
    if (isSpeaking) {
      scaleVal = 1.15 + Math.sin(time * 16) * 0.012 + Math.random() * 0.003;
    } else {
      scaleVal = 1.15 + Math.sin(time * 1.5) * 0.008;
    }
    groupRef.current.scale.setScalar(scaleVal);

    // Dynamic color pulsing & opacity transitions
    const speed = isSpeaking ? 20 : 4;
    const wave = 0.5 + Math.sin(time * speed) * 0.4;

    if (pointsRef.current) {
      pointsRef.current.material.opacity = isSpeaking ? 0.7 + wave * 0.2 : 0.5;
    }
    if (activePointsRef.current) {
      activePointsRef.current.material.opacity = isSpeaking ? 0.9 + wave * 0.1 : 0.6;
      // Pulse size of active nodes
      activePointsRef.current.material.size = isSpeaking ? 0.035 + wave * 0.015 : 0.025;
    }
    if (linesRef.current) {
      linesRef.current.material.opacity = isSpeaking ? 0.35 + wave * 0.15 : 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Base Neural Particles (Electric Blue) */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodePositions.length / 3}
            array={nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#4FC3F7"
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.5}
        />
      </points>

      {/* 2. Active High-Energy Data Nodes (Cyan) */}
      <points ref={activePointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={activeNodePositions.length / 3}
            array={activeNodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00E5FF"
          size={0.025}
          sizeAttenuation
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3. Thin Network Connection Lines (Purple) */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#8A2BE2"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

function OrbitRing({ radius, speed, rotation, color, isSpeaking }) {
  const ringRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const multiplier = isSpeaking ? 2.5 : 1.0;
    ringRef.current.rotation.z = time * speed * multiplier;
  });

  return (
    <mesh ref={ringRef} rotation={rotation}>
      <torusGeometry args={[radius, 0.003, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={isSpeaking ? 0.45 : 0.2} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function WaveformRipple({ isSpeaking }) {
  const rippleRef = useRef();
  const materialRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!rippleRef.current || !materialRef.current) return;

    if (isSpeaking) {
      const cycle = (time * 2.0) % 1.0;
      rippleRef.current.scale.setScalar(1.0 + cycle * 0.7);
      materialRef.current.opacity = (1.0 - cycle) * 0.75;
    } else {
      materialRef.current.opacity = 0;
    }
  });

  return (
    <mesh ref={rippleRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <torusGeometry args={[0.92, 0.005, 8, 48]} />
      <meshBasicMaterial ref={materialRef} color="#00E5FF" transparent blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export default function AIOrb({ isSpeaking = false }) {
  return (
    <div className="h-full w-full relative flex items-center justify-center">
      {/* Volumetric background halo glows */}
      <div className="absolute inset-4 rounded-full bg-cyan-500/10 blur-[65px] animate-pulse pointer-events-none" />
      <div className="absolute inset-8 rounded-full bg-purple-500/10 blur-[85px] animate-pulse pointer-events-none" />

      {/* Brought camera closer and adjusted bounds for large presence */}
      <Canvas camera={{ position: [0, 0, 1.3], fov: 60 }} gl={{ alpha: true }}>
        <ambientLight intensity={1.5} />
        
        <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
          {/* Volumetric aura spheres */}
          <Sphere args={[0.95, 16, 16]}>
            <meshBasicMaterial
              color="#00E5FF"
              transparent
              opacity={isSpeaking ? 0.08 : 0.04}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </Sphere>
          
          {/* 3D Neural Brain */}
          <BrainNetwork isSpeaking={isSpeaking} />
          
          {/* Tighter Orbit Rings */}
          <OrbitRing
            radius={1.15}
            speed={0.06}
            rotation={[Math.PI / 3.8, Math.PI / 8, 0]}
            color="#00E5FF"
            isSpeaking={isSpeaking}
          />
          <OrbitRing
            radius={1.25}
            speed={-0.05}
            rotation={[Math.PI / 2.5, -Math.PI / 10, 0]}
            color="#8A2BE2"
            isSpeaking={isSpeaking}
          />
          
          {/* Reactive Waveform rings */}
          <WaveformRipple isSpeaking={isSpeaking} />
        </Float>
      </Canvas>
    </div>
  );
}
