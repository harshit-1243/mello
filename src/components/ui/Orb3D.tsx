"use client";

import { useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Environment, Lightformer, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * Orb3D — a real WebGL "liquid" orb (React Three Fiber). An organically
 * distorted, glossy metallic blob that reflects a colored studio environment
 * (built from Lightformers — no external HDR), giving the iridescent flowing-
 * colour, bright-rim look of a premium hero. Rotates, parallaxes to the cursor,
 * and reacts to the call audio (distortion + scale via `ampRef`, 0..1).
 */

function Blob({ ampRef }: { ampRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<(THREE.MeshStandardMaterial & { distort: number }) | null>(null);

  useFrame((state, delta) => {
    const amp = ampRef.current ?? 0;
    const t = state.clock.elapsedTime;
    if (mat.current) {
      mat.current.distort = 0.38 + amp * 0.4 + Math.sin(t * 0.5) * 0.05;
    }
    if (group.current) {
      const s = 1 + amp * 0.12;
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, s, 0.15));
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.3, 0.04);
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, state.pointer.x * 0.18, 0.04);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1, 80]} />
        <MeshDistortMaterial
          ref={mat as never}
          color="#8a52cc"
          emissive="#3a1f66"
          emissiveIntensity={0.22}
          roughness={0.13}
          metalness={0.85}
          envMapIntensity={1.9}
          distort={0.4}
          speed={1.1}
        />
      </mesh>
    </group>
  );
}

export function Orb3D({ ampRef }: { ampRef: MutableRefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 3.3], fov: 42 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.45} />
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
        <Blob ampRef={ampRef} />
      </Float>

      {/* colored studio environment → the iridescent flowing reflections (no HDR file) */}
      <Environment resolution={256}>
        <Lightformer form="circle" intensity={3} color="#ffffff" position={[0, 2.5, -2]} scale={5} />
        <Lightformer form="rect" intensity={2.2} color="#c98cff" position={[-3.5, 0, -1]} scale={[3, 8, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#867eb2" position={[3.5, 1, -1]} scale={[3, 8, 1]} />
        <Lightformer form="circle" intensity={2} color="#6ea8ff" position={[2, -2.5, 1.5]} scale={3.5} />
        <Lightformer form="circle" intensity={1.6} color="#ff8fd6" position={[-2, -2, 2]} scale={3} />
      </Environment>

      <EffectComposer multisampling={8}>
        <Bloom intensity={0.5} luminanceThreshold={0.6} luminanceSmoothing={0.35} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
