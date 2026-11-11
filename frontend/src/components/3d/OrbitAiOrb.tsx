import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'generating' | 'completed';

interface OrbProps {
  state?: OrbState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
}

// Inner 3D scene elements
const CoreSphere: React.FC<{ state: OrbState }> = ({ state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  // Dynamic colors and speed based on state
  const config = useMemo(() => {
    switch (state) {
      case 'listening':
        return { color: '#22D3EE', emissive: '#0891B2', speed: 2.0, roughness: 0.1 };
      case 'thinking':
        return { color: '#8B5CF6', emissive: '#6D28D9', speed: 4.0, roughness: 0.3 };
      case 'generating':
        return { color: '#D946EF', emissive: '#A21CAF', speed: 3.5, roughness: 0.2 };
      case 'completed':
        return { color: '#34D399', emissive: '#059669', speed: 1.5, roughness: 0.1 };
      case 'idle':
      default:
        return { color: '#6366F1', emissive: '#4338CA', speed: 1.0, roughness: 0.25 };
    }
  }, [state]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4 * config.speed;
      meshRef.current.rotation.x += delta * 0.2 * config.speed;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.3 * config.speed;
      wireRef.current.rotation.z += delta * 0.2 * config.speed;
    }
  });

  return (
    <group>
      {/* Inner Glow Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={1.2}
          roughness={config.roughness}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Outer Holographic Wireframe Cage */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshStandardMaterial
          color="#22D3EE"
          wireframe
          transparent
          opacity={state === 'thinking' || state === 'generating' ? 0.7 : 0.35}
        />
      </mesh>
    </group>
  );
};

const OrbitingRings: React.FC<{ state: OrbState }> = ({ state }) => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const mult = state === 'thinking' ? 3.0 : state === 'generating' ? 2.5 : 1.0;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.8 * mult;
      ring1Ref.current.rotation.y += delta * 0.5 * mult;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.7 * mult;
      ring2Ref.current.rotation.z += delta * 0.6 * mult;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.9 * mult;
      ring3Ref.current.rotation.x -= delta * 0.4 * mult;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.85, 0.025, 16, 100]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.1, 0.02, 16, 100]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[2.35, 0.018, 16, 100]} />
        <meshBasicMaterial color="#D946EF" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

const ParticleCloud: React.FC<{ count?: number; state: OrbState }> = ({ count = 90, state }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorCyan = new THREE.Color('#22D3EE');
    const colorViolet = new THREE.Color('#8B5CF6');

    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const mixed = colorCyan.clone().lerp(colorViolet, Math.random());
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      const speed = state === 'thinking' ? 0.6 : 0.15;
      pointsRef.current.rotation.y += delta * speed;
      pointsRef.current.rotation.x += delta * (speed * 0.5);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Fallback CSS Orb if WebGL is unavailable
const FallbackOrb: React.FC<{ state: OrbState; sizeClass: string }> = ({ state, sizeClass }) => {
  const glowColor =
    state === 'listening' ? 'border-cosmic-cyan shadow-neon-cyan' :
    state === 'thinking' ? 'border-cosmic-violet shadow-neon-violet' :
    state === 'generating' ? 'border-cosmic-magenta shadow-neon-cyan' :
    state === 'completed' ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)]' :
    'border-cosmic-blue shadow-[0_0_25px_rgba(37,99,235,0.4)]';

  return (
    <div className={`relative flex items-center justify-center ${sizeClass}`}>
      {/* Outer pulsating energy ring */}
      <div className={`absolute inset-0 rounded-full border border-dashed ${glowColor} animate-orbit-spin opacity-60`} />
      {/* Mid ring */}
      <div className="absolute inset-2 rounded-full border border-cosmic-cyan/40 animate-pulse-slow" />
      {/* Core orb */}
      <div className="w-2/3 h-2/3 rounded-full bg-gradient-to-tr from-cosmic-violet via-cosmic-blue to-cosmic-cyan animate-pulse shadow-lg" />
    </div>
  );
};

export const OrbitAiOrb: React.FC<OrbProps> = ({ state = 'idle', size = 'md', interactive = true }) => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  const sizeDimensions = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-80 h-80',
    xl: 'w-96 h-96 lg:w-[480px] lg:h-[480px]'
  };

  const sizeClass = sizeDimensions[size];

  if (!hasWebGL) {
    return <FallbackOrb state={state} sizeClass={sizeClass} />;
  }

  return (
    <div className={`relative ${sizeClass} select-none`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#22D3EE" />
        <pointLight position={[-10, -10, -10]} intensity={1.2} color="#8B5CF6" />
        <CoreSphere state={state} />
        <OrbitingRings state={state} />
        <ParticleCloud state={state} />
      </Canvas>
    </div>
  );
};

export default OrbitAiOrb;

