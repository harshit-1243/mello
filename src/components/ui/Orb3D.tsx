"use client";

import { useRef, useMemo, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * Orb3D — a morphing iridescent glass/liquid blob (soap-bubble look), in mello's
 * violet/lavender palette. A custom shader flows low-frequency simplex noise to
 * marble the surface colour, displaces the geometry to morph the shape, and adds
 * a bright fresnel rim (the glowing bubble edge). Fully OPAQUE, so it's
 * flicker-proof with bloom. Reacts to the call audio (uAmp) and is drag-to-spin.
 */

// Ashima simplex noise (3D) — shared by both shaders.
const snoise = /* glsl */ `
  vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vView;
  ${snoise}
  void main() {
    float t = uTime * 0.16;
    float n  = snoise(position * 0.8 + vec3(0.0, t, 0.0));
    float n2 = snoise(position * 1.7 + vec3(t * 0.6));
    float disp = (n * 0.07 + n2 * 0.025) * (1.0 + uAmp * 1.2);
    vec3 pos = position + normal * disp;
    vPos = position;
    vNormalW = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vView;
  ${snoise}
  // iridescent violet/lavender/pink/blue palette (IQ cosine gradient)
  vec3 palette(float t){
    vec3 a = vec3(0.55, 0.45, 0.78);
    vec3 b = vec3(0.38, 0.32, 0.42);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.25, 0.50, 0.80);
    return a + b * cos(6.28318 * (c * t + d));
  }
  void main(){
    float t = uTime * 0.12;
    float n  = snoise(vPos * 0.9 + vec3(0.0, t, 0.0));
    float n2 = snoise(vPos * 1.8 - vec3(t * 0.6));
    float m = clamp(n * 0.6 + n2 * 0.25 + 0.5, 0.0, 1.0);
    // controlled violet → lavender → periwinkle (no rainbow / no yellow)
    vec3 c1 = vec3(0.20, 0.09, 0.42); // deep violet
    vec3 c2 = vec3(0.49, 0.27, 0.85); // violet
    vec3 c3 = vec3(0.80, 0.58, 0.97); // lavender-pink
    vec3 c4 = vec3(0.46, 0.53, 0.93); // periwinkle
    vec3 col = mix(c1, c2, smoothstep(0.0, 0.4, m));
    col = mix(col, c3, smoothstep(0.4, 0.72, m));
    col = mix(col, c4, smoothstep(0.72, 1.0, m));
    // thin, soft fresnel rim (not a white blowout)
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vView))), 3.0);
    col = mix(col, vec3(0.92, 0.86, 1.0), fres * 0.5);
    col += uAmp * 0.2;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Blob({ ampRef }: { ampRef: MutableRefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAmp: { value: 0 } }),
    [],
  );

  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    mat.current.uniforms.uAmp.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uAmp.value,
      ampRef.current ?? 0,
      0.1,
    );
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1, 18]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function Orb3D({ ampRef }: { ampRef: MutableRefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 3.4], fov: 42 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Float speed={1} rotationIntensity={0.15} floatIntensity={0.4}>
        <Blob ampRef={ampRef} />
      </Float>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} rotateSpeed={0.5} />

      {/* opaque shader blob → bloom is stable. Soft halo on the bright rim. */}
      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
