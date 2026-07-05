import React, { useMemo, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeContext } from '../context/ThemeContext';

// Define custom 2D shapes for extruded Enterprise / Workplace items
const iconShapes = {
  file: (() => {
    const s = new THREE.Shape();
    // folder shape with tab
    s.moveTo(-0.4, -0.3);
    s.lineTo(-0.4, 0.3);
    s.lineTo(-0.1, 0.3);
    s.lineTo(0, 0.4);
    s.lineTo(0.3, 0.4);
    s.lineTo(0.3, 0.3);
    s.lineTo(0.4, 0.3);
    s.lineTo(0.4, -0.3);
    s.closePath();
    return s;
  })(),
  paper: (() => {
    const s = new THREE.Shape();
    // sheet of paper with dog-eared corner
    s.moveTo(-0.35, -0.45);
    s.lineTo(-0.35, 0.45);
    s.lineTo(0.15, 0.45);
    s.lineTo(0.35, 0.25);
    s.lineTo(0.35, -0.45);
    s.closePath();
    return s;
  })(),
  printer: (() => {
    const s = new THREE.Shape();
    // printer body outline
    s.moveTo(-0.45, -0.25);
    s.lineTo(-0.45, 0.1);
    s.lineTo(-0.3, 0.1);
    s.lineTo(-0.3, 0.3);
    s.lineTo(0.3, 0.3);
    s.lineTo(0.3, 0.1);
    s.lineTo(0.45, 0.1);
    s.lineTo(0.45, -0.25);
    s.lineTo(0.3, -0.25);
    s.lineTo(0.3, -0.15);
    s.lineTo(-0.3, -0.15);
    s.lineTo(-0.3, -0.25);
    s.closePath();
    return s;
  })(),
  laptop: (() => {
    const s = new THREE.Shape();
    // screen and base keyboard panel
    s.moveTo(-0.45, -0.12);
    s.lineTo(-0.45, 0.35);
    s.lineTo(0.45, 0.35);
    s.lineTo(0.45, -0.12);
    s.lineTo(0.55, -0.12);
    s.lineTo(0.55, -0.22);
    s.lineTo(-0.55, -0.22);
    s.lineTo(-0.55, -0.12);
    s.closePath();
    return s;
  })(),
  bottle: (() => {
    const s = new THREE.Shape();
    // beverage container flask
    s.moveTo(-0.18, -0.45);
    s.lineTo(-0.18, 0.2);
    s.lineTo(-0.1, 0.32);
    s.lineTo(-0.1, 0.45);
    s.lineTo(0.1, 0.45);
    s.lineTo(0.1, 0.32);
    s.lineTo(0.18, 0.2);
    s.lineTo(0.18, -0.45);
    s.closePath();
    return s;
  })(),
  pen: (() => {
    const s = new THREE.Shape();
    // vertical office pen
    s.moveTo(-0.06, -0.45);
    s.lineTo(-0.06, 0.3);
    s.lineTo(0, 0.45);
    s.lineTo(0.06, 0.3);
    s.lineTo(0.06, -0.45);
    s.closePath();
    return s;
  })()
};

const extrudeSettings = {
  depth: 0.15,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.015,
  bevelThickness: 0.015
};

function SingleShape({ shape, isDark }) {
  const meshRef = useRef();
  // Keep track of moving coordinates locally to support wrap-around drift
  const posRef = useRef([...shape.position]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Apply slow linear drift movement
    posRef.current[0] += shape.velocity[0] * delta;
    posRef.current[1] += shape.velocity[1] * delta;
    posRef.current[2] += shape.velocity[2] * delta;

    // Wrap coordinates at screen boundaries
    if (posRef.current[0] > 26) posRef.current[0] = -26;
    if (posRef.current[0] < -26) posRef.current[0] = 26;

    if (posRef.current[1] > 20) posRef.current[1] = -20;
    if (posRef.current[1] < -20) posRef.current[1] = 20;

    if (posRef.current[2] > -4) posRef.current[2] = -40;
    if (posRef.current[2] < -40) posRef.current[2] = -4;

    // Calculate camera target offset with mouse parallax
    const targetX = posRef.current[0] + (state.mouse.x * (posRef.current[2] > -12 ? 1.5 : 0.4));
    const targetY = posRef.current[1] + (state.mouse.y * (posRef.current[2] > -12 ? 1.5 : 0.4));

    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, posRef.current[2], 0.05);
  });

  const currentShape = useMemo(() => {
    const keys = ['file', 'paper', 'printer', 'laptop', 'bottle', 'pen'];
    return iconShapes[keys[shape.type % keys.length]];
  }, [shape.type]);

  const material = useMemo(() => {
    if (shape.isWireframe) {
      return new THREE.MeshBasicMaterial({
        color: shape.color,
        wireframe: true,
        transparent: true,
        opacity: isDark ? 0.25 : 0.12,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: shape.color,
      roughness: shape.roughness,
      transmission: shape.transmission,
      thickness: 1.0,
      envMapIntensity: 1.5,
      clearcoat: 1.0,
      transparent: true,
      opacity: isDark ? shape.opacity * 0.9 : shape.opacity * 0.45,
      ior: 1.5,
    });
  }, [shape, isDark]);

  return (
    <Float 
      speed={0.8 + Math.random() * 1.0} 
      rotationIntensity={0.8 + Math.random() * 1.0} 
      floatIntensity={0.8 + Math.random() * 1.0}
    >
      <mesh
        ref={meshRef}
        position={shape.position}
        scale={shape.scale}
        material={material}
      >
        <extrudeGeometry args={[currentShape, extrudeSettings]} />
      </mesh>
    </Float>
  );
}

function FloatingShapes({ isDark }) {
  const shapes = useMemo(() => {
    return new Array(85).fill(0).map((_, i) => {
      let z, scale, opacity, roughness, transmission;
      const isWireframe = i % 7 === 0; 
      
      let geomType = 'icon';

      // 10% larger bounds
      if (i < 45) {
        z = Math.random() * -20 - 20; 
        scale = Math.random() * 0.5 + 0.35; 
        opacity = 0.15;
        roughness = 0.2;
        transmission = 0.4;
      } else if (i < 70) {
        z = Math.random() * -10 - 10; 
        scale = Math.random() * 0.85 + 0.55; 
        opacity = 0.25;
        roughness = 0.2;
        transmission = 0.4;
      } else {
        z = Math.random() * -6 - 8; 
        scale = Math.random() * 1.35 + 1.0; 
        opacity = 0.38;
        roughness = 0.1;
        transmission = 0.3;
      }

      // Slowly drifting velocities (very small, to look elegant)
      const velocity = [
        (Math.random() - 0.5) * 0.35, // x speed
        (Math.random() - 0.5) * 0.35, // y speed
        (Math.random() - 0.5) * 0.08  // z speed
      ];

      // Colorful, rich saturated office tones
      const colors = [
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber/Yellow
        '#ec4899', // Pink
        '#8b5cf6', // Violet
        '#06b6d4', // Cyan
        '#f97316'  // Orange
      ];

      return {
        position: [
          Math.random() * 40 - 20,
          Math.random() * 40 - 20,
          z,
        ],
        scale,
        geomType,
        type: Math.floor(Math.random() * 6), // 6 distinct office items
        roughness,
        transmission,
        opacity,
        isWireframe,
        velocity,
        color: colors[i % colors.length],
      };
    });
  }, [isDark]);

  return (
    <>
      {shapes.map((shape, i) => (
        <SingleShape key={i} shape={shape} isDark={isDark} />
      ))}
    </>
  );
}

function Rig() {
  useFrame((state) => {
    // Camera rig responsive to mouse position
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x * 4, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.mouse.y * 4, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function CursorFollowerLight() {
  const lightRef = useRef();

  useFrame((state) => {
    if (!lightRef.current) return;
    // Map normal screen coordinates to 3D space position
    const x = state.mouse.x * 12;
    const y = state.mouse.y * 8;
    lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, x, 0.1);
    lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, y, 0.1);
  });

  return <pointLight ref={lightRef} distance={15} intensity={5.5} color="#22d3ee" />;
}

const PremiumBackground = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const location = useLocation();

  const isLaunchpad = location.pathname === '/' || location.pathname === '/demo' || location.pathname === '/welcome';

  const bgClass = isDark
    ? 'bg-gradient-to-tr from-[#18153A] via-[#12102A] to-[#0A091E]'
    : 'bg-gradient-to-tr from-[#FFF9FB] via-[#FCFBFD] to-[#F0F3FA]';

  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 ${bgClass} transition-colors duration-700 ease-in-out`}>
      {!isLaunchpad && (
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }} gl={{ alpha: true }}>
          {isDark && <Stars radius={120} depth={60} count={3500} factor={5} saturation={0} fade speed={1.2} />}
          
          {/* Ambient environment setup */}
          <ambientLight intensity={isDark ? 0.6 : 1.4} />
          <spotLight position={[15, 20, 15]} angle={0.2} penumbra={1} intensity={1.8} color={isDark ? '#6366f1' : '#818cf8'} />
          <pointLight position={[-15, -15, -10]} intensity={isDark ? 0.8 : 1.5} color={isDark ? '#a855f7' : '#c084fc'} />
          
          {/* Dynamic Light Following Cursor */}
          <CursorFollowerLight />

          <FloatingShapes isDark={isDark} />
          
          <Environment preset={isDark ? 'night' : 'city'} />
          <Rig />
        </Canvas>
      )}
    </div>
  );
};

export default PremiumBackground;
