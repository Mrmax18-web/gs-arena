import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { useGame } from '../../context/GameContext';

export interface OrbitCoreIconProps {
  size?: 32 | 160;
  className?: string;
  onClick?: () => void;
}

type ClickState = 'idle' | 'implode' | 'explode' | 'reassemble';

/**
 * CSS-only glowing ring fallback when WebGL is unavailable or loading.
 */
function FallbackGlowingRing({
  size,
  className,
  accentColor,
}: {
  size: number;
  className?: string;
  accentColor: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn('relative flex items-center justify-center select-none', className)}
    >
      <div
        className="absolute inset-0 rounded-full border border-accent/40 animate-[spin_8s_linear_infinite]"
        style={{
          boxShadow: `0 0 16px ${accentColor}40, inset 0 0 8px ${accentColor}30`,
        }}
      />
      <div
        className="w-1/2 h-1/2 rounded-full border border-cyan-400/50 animate-[spin_4s_linear_infinite_reverse]"
        style={{
          boxShadow: '0 0 12px rgba(0,217,255,0.4)',
        }}
      />
      <div
        className="w-1/4 h-1/4 rounded-full bg-accent animate-pulse"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  );
}

/**
 * 3D Orbit Core WebGL Canvas implementation using Three.js PBR materials.
 * Metallic torus, counter-rotating inner ring, 3 orbiting cubes,
 * and 60 upward drifting instanced particles.
 */
function OrbitWebGLCanvas({
  size,
  accentColor,
  secondaryColor,
  onClick,
}: {
  size: 32 | 160;
  accentColor: string;
  secondaryColor: string;
  onClick?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clickState, setClickState] = useState<ClickState>('idle');
  const clickStateRef = useRef<ClickState>('idle');
  const isHoveredRef = useRef(false);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const scrollRatioRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Sync ref
  useEffect(() => {
    clickStateRef.current = clickState;
  }, [clickState]);

  // Click state machine: idle -> implode (180ms) -> explode (400ms) -> reassemble (700ms) -> idle
  const handleInteractionClick = useCallback(() => {
    if (clickStateRef.current !== 'idle') return;

    if (onClick) onClick();

    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      setClickState('implode');
      setTimeout(() => setClickState('idle'), 200);
      return;
    }

    setClickState('implode');
    setTimeout(() => {
      setClickState('explode');
      setTimeout(() => {
        setClickState('reassemble');
        setTimeout(() => {
          setClickState('idle');
        }, 700);
      }, 400);
    }, 180);
  }, [onClick]);

  // Passive scroll listener for rotation acceleration
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || 0;
      scrollRatioRef.current = Math.min(Math.max(scrollY / 800, 0), 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Three.js Scene Setup & Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: size > 32,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(size, size);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 4.2;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(4, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(new THREE.Color(accentColor), 2.5);
    dirLight2.position.set(-4, -3, 2);
    scene.add(dirLight2);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Torus Core (PBR Metallic)
    const torusGeo = new THREE.TorusGeometry(1.0, 0.16, 24, 64);
    const torusMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      metalness: 0.95,
      roughness: 0.22,
      emissive: new THREE.Color(accentColor),
      emissiveIntensity: 0.35,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    rootGroup.add(torus);

    // Inner Ring
    const innerRingGeo = new THREE.TorusGeometry(0.65, 0.05, 16, 48);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(secondaryColor),
      metalness: 0.9,
      roughness: 0.3,
      emissive: new THREE.Color(secondaryColor),
      emissiveIntensity: 0.4,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 4;
    rootGroup.add(innerRing);

    // Orbiting Cubes (Only for 160px size)
    const cubes: THREE.Mesh[] = [];
    if (size > 32) {
      const cubeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.1,
        emissive: new THREE.Color(accentColor),
        emissiveIntensity: 0.5,
      });

      for (let i = 0; i < 3; i++) {
        const cube = new THREE.Mesh(cubeGeo, cubeMat);
        cubes.push(cube);
        rootGroup.add(cube);
      }
    }

    // Instanced Particles (60 particles drifting upward)
    let particleMesh: THREE.InstancedMesh | null = null;
    const particleData: Array<{ x: number; y: number; z: number; speed: number; phase: number }> = [];

    if (size > 32) {
      const pCount = 60;
      const pGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(secondaryColor),
        transparent: true,
        opacity: 0.8,
      });
      particleMesh = new THREE.InstancedMesh(pGeo, pMat, pCount);

      const dummy = new THREE.Object3D();
      for (let i = 0; i < pCount; i++) {
        const x = (Math.random() - 0.5) * 2.8;
        const y = (Math.random() - 0.5) * 2.8;
        const z = (Math.random() - 0.5) * 2.8;
        const speed = 0.4 + Math.random() * 0.6;
        const phase = Math.random() * Math.PI * 2;
        particleData.push({ x, y, z, speed, phase });

        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        particleMesh.setMatrixAt(i, dummy.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;
      scene.add(particleMesh);
    }

    // Pointer repulsion calculations
    let repulsionX = 0;
    let repulsionY = 0;
    let targetRepulsionX = 0;
    let targetRepulsionY = 0;

    let animFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      animFrameId = requestAnimationFrame(renderLoop);

      if (!isVisibleRef.current) return;

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const scrollT = scrollRatioRef.current;
      const rotSpeedMultiplier = 1 + scrollT * 2;
      const floatAmpMultiplier = 1 + scrollT * 0.5;

      // Pointer repulsion physics
      if (pointerPosRef.current && size > 32) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = pointerPosRef.current.x - centerX;
        const dy = pointerPosRef.current.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120 && dist > 0.001) {
          const factor = (1 - dist / 120) * 0.4;
          targetRepulsionX = -(dx / dist) * factor;
          targetRepulsionY = (dy / dist) * factor;
        } else {
          targetRepulsionX = 0;
          targetRepulsionY = 0;
        }
      } else {
        targetRepulsionX = 0;
        targetRepulsionY = 0;
      }

      repulsionX += (targetRepulsionX - repulsionX) * 0.12;
      repulsionY += (targetRepulsionY - repulsionY) * 0.12;

      // Idle transforms
      const tSec = time * 0.001;
      const yFloat = Math.sin(tSec * 1.25) * 0.08 * floatAmpMultiplier;

      rootGroup.position.x = repulsionX;
      rootGroup.position.y = yFloat + repulsionY;
      rootGroup.rotation.y += 0.15 * rotSpeedMultiplier * dt;
      rootGroup.rotation.x = Math.sin(tSec * 0.5) * 0.03;

      // Inner ring counter-rotation
      innerRing.rotation.y -= 0.3 * dt;
      innerRing.rotation.z += 0.15 * dt;

      // Hover emissive boost
      const hoverBoost = isHoveredRef.current ? 1.4 : 1.0;
      torusMat.emissiveIntensity = 0.35 * hoverBoost;

      // Click state machine scaling
      const cState = clickStateRef.current;
      let targetScale = 1.0;
      if (cState === 'implode') targetScale = 0.6;
      else if (cState === 'explode') targetScale = 1.8;
      else if (cState === 'reassemble') targetScale = 1.05;

      rootGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), dt * 10);

      // Orbiting cubes
      cubes.forEach((cube, i) => {
        const orbitRadius = 1.35 + i * 0.22;
        const orbitSpeed = (1.2 + i * 0.4) * (i % 2 === 0 ? 1 : -1);
        const angle = tSec * orbitSpeed + (i * Math.PI * 2) / 3;
        cube.position.set(
          Math.cos(angle) * orbitRadius,
          Math.sin(angle * 0.7) * 0.3,
          Math.sin(angle) * orbitRadius
        );
        cube.rotation.x += dt * 2;
        cube.rotation.y += dt * 2;
      });

      // Drifting particles upward
      if (particleMesh) {
        const dummy = new THREE.Object3D();
        const spawnMultiplier = isHoveredRef.current ? 2.0 : 1.0;

        for (let i = 0; i < particleData.length; i++) {
          const p = particleData[i];
          p.y += p.speed * spawnMultiplier * dt;
          if (p.y > 1.5) {
            p.y = -1.5;
            p.x = (Math.random() - 0.5) * 2.8;
            p.z = (Math.random() - 0.5) * 2.8;
          }

          dummy.position.set(p.x, p.y, p.z);
          dummy.scale.setScalar(cState === 'explode' ? 2.0 : 1.0);
          dummy.updateMatrix();
          particleMesh.setMatrixAt(i, dummy.matrix);
        }
        particleMesh.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    // Pause on visibilitychange or IntersectionObserver
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting && !document.hidden;
    });
    observer.observe(container);

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animFrameId);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();

      torusGeo.dispose();
      torusMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();

      cubes.forEach((cube) => {
        cube.geometry.dispose();
        if (Array.isArray(cube.material)) {
          cube.material.forEach((m) => m.dispose());
        } else {
          cube.material.dispose();
        }
      });

      if (particleMesh) {
        particleMesh.geometry.dispose();
        if (Array.isArray(particleMesh.material)) {
          particleMesh.material.forEach((m) => m.dispose());
        } else {
          particleMesh.material.dispose();
        }
      }

      renderer.dispose();
    };
  }, [size, accentColor, secondaryColor]);

  // Pointer move & hover handlers
  const handlePointerMove = (e: React.PointerEvent) => {
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerLeave = () => {
    pointerPosRef.current = null;
    isHoveredRef.current = false;
  };

  const handlePointerEnter = () => {
    isHoveredRef.current = true;
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label="Interactive 3D GS Arena Orbit Core"
      onClick={handleInteractionClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleInteractionClick();
        }
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
    >
      {/* Deep space radial backdrop behind icon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-20%] rounded-full z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(5,5,5,0.95) 0%, transparent 70%)',
        }}
      />

      {/* Emissive CSS halo blur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-full blur-xl opacity-30 transition-opacity duration-300"
        style={{
          backgroundColor: accentColor,
        }}
      />

      <canvas ref={canvasRef} className="relative z-10 w-full h-full block" />
    </div>
  );
}

/**
 * AAA Esports OrbitCoreIcon component.
 * Supports sizes 32 (Header rail) and 160 (Leaderboard hero).
 * Gracefully degrades with React.Suspense and a CSS-only glowing ring fallback.
 */
export function OrbitCoreIcon({ size = 32, className, onClick }: OrbitCoreIconProps) {
  const { currentGame } = useGame();
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  const accentColor = currentGame === 'freefire' ? '#FF2D2D' : '#FF6B35';
  const secondaryColor = '#00D9FF';

  if (!hasWebGL) {
    return (
      <FallbackGlowingRing
        size={size}
        className={className}
        accentColor={accentColor}
      />
    );
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <OrbitWebGLCanvas
        size={size}
        accentColor={accentColor}
        secondaryColor={secondaryColor}
        onClick={onClick}
      />
    </div>
  );
}
