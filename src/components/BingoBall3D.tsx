'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BallColors {
  primary: string;
  secondary: string;
}

function getBallColors(number: number): BallColors {
  if (number <= 15) return { primary: '#3b82f6', secondary: '#1d4ed8' };
  if (number <= 30) return { primary: '#ef4444', secondary: '#b91c1c' };
  if (number <= 45) return { primary: '#eab308', secondary: '#a16207' };
  if (number <= 60) return { primary: '#22c55e', secondary: '#15803d' };
  if (number <= 75) return { primary: '#a855f7', secondary: '#7e22ce' };
  return { primary: '#f97316', secondary: '#c2410c' };
}

interface BallMeshProps {
  number: number;
  isEntering: boolean;
  isExiting: boolean;
  onExitComplete: () => void;
}

function BallMesh({ number, isEntering, isExiting, onExitComplete }: BallMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const colors = getBallColors(number);

  const enterProgressRef = useRef(0);
  const exitProgressRef = useRef(0);
  const idleRotationRef = useRef(0);
  const hasCalledExitComplete = useRef(false);

  const ballGeometry = useMemo(() => new THREE.SphereGeometry(2.2, 32, 32), []);
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(2.0, 2.0), []);

  const numberTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);

    const colors = getBallColors(number);
    const gradient = ctx.createRadialGradient(
      size * 0.3, size * 0.3, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, colors.secondary);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    const fontSize = number >= 10 ? 280 : 320;
    ctx.font = `900 ${fontSize}px "Space Mono", "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = size / 2;
    const textY = size / 2 + 8;
    const text = number.toString();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, textX, textY);

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, textX, textY);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [number]);

  const numberMaterial = useMemo(() => {
    if (!numberTexture) return null;
    return new THREE.MeshBasicMaterial({
      map: numberTexture,
      transparent: true,
      alphaTest: 0.5,
    });
  }, [numberTexture]);

  useEffect(() => {
    return () => {
      ballGeometry.dispose();
      planeGeometry.dispose();
      numberTexture?.dispose();
      numberMaterial?.dispose();
    };
  }, [ballGeometry, planeGeometry, numberTexture, numberMaterial]);

  useEffect(() => {
    if (isEntering) {
      enterProgressRef.current = 0;
    }
  }, [isEntering]);

  useEffect(() => {
    if (isExiting) {
      exitProgressRef.current = 0;
      hasCalledExitComplete.current = false;
    }
  }, [isExiting]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isEntering && enterProgressRef.current < 1) {
      enterProgressRef.current = Math.min(enterProgressRef.current + delta * 2.5, 1);

      const eased = 1 - (1 - enterProgressRef.current) ** 3;
      groupRef.current.position.y = 8 - eased * 8;
      groupRef.current.rotation.x = (1 - eased) * Math.PI * 2;

      const bounce = Math.sin(enterProgressRef.current * Math.PI) * 0.3;
      groupRef.current.scale.setScalar(eased + bounce * (1 - eased));
    } else if (isExiting && exitProgressRef.current < 1) {
      exitProgressRef.current = Math.min(exitProgressRef.current + delta * 4, 1);

      const eased = exitProgressRef.current ** 2;
      groupRef.current.scale.setScalar(1 - eased);
      groupRef.current.rotation.z = eased * Math.PI;
      groupRef.current.position.y = -eased * 3;

      if (exitProgressRef.current >= 1 && !hasCalledExitComplete.current) {
        hasCalledExitComplete.current = true;
        onExitComplete();
      }
    } else if (!isEntering && !isExiting) {
      idleRotationRef.current += delta * 0.3;
      groupRef.current.rotation.y = Math.sin(idleRotationRef.current) * 0.15;
      groupRef.current.rotation.x = Math.cos(idleRotationRef.current * 0.7) * 0.1;
      groupRef.current.position.y = Math.sin(idleRotationRef.current * 1.5) * 0.1;
    }
  });

  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const gradient = ctx.createRadialGradient(180, 150, 0, 256, 256, 350);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, colors.primary);
    gradient.addColorStop(0.7, colors.secondary);
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [colors.primary, colors.secondary]);

  useEffect(() => {
    return () => {
      gradientTexture?.dispose();
    };
  }, [gradientTexture]);

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={ballGeometry}>
        <meshStandardMaterial
          map={gradientTexture}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {numberMaterial && (
        <>
          <mesh position={[0, 0, 2.21]} geometry={planeGeometry} material={numberMaterial} />
          <mesh position={[0, 0, -2.21]} rotation={[0, Math.PI, 0]} geometry={planeGeometry} material={numberMaterial} />
        </>
      )}
    </group>
  );
}

interface BingoBall3DProps {
  number: number;
  previousNumber?: number | null;
}

export function BingoBall3D({ number, previousNumber }: BingoBall3DProps) {
  const [displayedNumber, setDisplayedNumber] = useState(number);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);

  useEffect(() => {
    if (previousNumber !== null && previousNumber !== undefined && number !== previousNumber) {
      setShowPrevious(true);
      setIsTransitioning(true);
    } else {
      setDisplayedNumber(number);
    }
  }, [number, previousNumber]);

  const handleExitComplete = () => {
    setShowPrevious(false);
    setDisplayedNumber(number);
    setTimeout(() => setIsTransitioning(false), 50);
  };

  return (
    <div className="w-[min(90vw,50vh)] h-[min(90vw,50vh)] md:w-[min(80vw,55vh)] md:h-[min(80vw,55vh)]">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <directionalLight position={[-3, 3, -3]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.4} />
        <hemisphereLight intensity={0.3} />

        {showPrevious && previousNumber && (
          <BallMesh
            number={previousNumber}
            isEntering={false}
            isExiting={true}
            onExitComplete={handleExitComplete}
          />
        )}

        {!showPrevious && (
          <BallMesh
            number={displayedNumber}
            isEntering={isTransitioning || displayedNumber === number}
            isExiting={false}
            onExitComplete={() => {}}
          />
        )}
      </Canvas>
    </div>
  );
}
