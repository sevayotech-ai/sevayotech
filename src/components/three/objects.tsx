"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SECTION_GAP, xr, type Quality } from "./xr";

/* ================================================================
   Lighting — one coherent system for the whole universe
   ================================================================ */

export function SceneLighting({
  accent = "#2e9bff",
  accent2 = "#9b5cff",
  quality = "high",
}: {
  accent?: string;
  accent2?: string;
  quality?: Quality;
}) {
  const key = useRef<THREE.DirectionalLight>(null);
  useFrame((state) => {
    if (!key.current) return;
    key.current.position.x = 6 + xr.smoothPointer.x * 2.5;
    key.current.position.y = 7 + xr.smoothPointer.y * 2.5;
    key.current.target.position.set(0, 0, state.camera.position.z - 18);
    key.current.target.updateMatrixWorld();
  });

  return (
    <>
      <ambientLight intensity={quality === "low" ? 0.7 : 0.45} />
      <hemisphereLight intensity={0.35} groundColor="#04050a" color="#20305c" />
      <directionalLight
        ref={key}
        position={[6, 7, 6]}
        intensity={quality === "low" ? 0.9 : 1.5}
        color="#dce8ff"
        castShadow={false}
      />
      <directionalLight position={[-8, -3, -6]} intensity={0.8} color={accent2} />
      <pointLight position={[0, 0, 4]} intensity={2.2} distance={30} color={accent} />
    </>
  );
}

/* ================================================================
   Particle field — volumetric dust that gives the space depth
   ================================================================ */

export function ParticleField({
  count = 900,
  depth = 400,
  accent = "#8ec5ff",
  warm = false,
}: {
  count?: number;
  depth?: number;
  accent?: string;
  warm?: boolean;
}) {
  const points = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const base = new THREE.Color(warm ? "#ffb35c" : accent);
    const alt = new THREE.Color(warm ? "#ff7ab8" : "#c24bff");
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 46;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = 8 - Math.random() * depth;
      const mixed = base.clone().lerp(alt, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
      sizes[i] = Math.random() * 0.06 + 0.015;
    }
    return { positions, colors, sizes };
  }, [count, depth, accent, warm]);

  useFrame((state) => {
    const geo = points.current?.geometry as THREE.BufferGeometry | undefined;
    if (!geo) return;
    geo.attributes.position.needsUpdate = true;
    const arr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    const step = xr.reduced ? 0 : 1;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.25 + i) * 0.0016 * step;
      arr[i * 3] += Math.cos(t * 0.18 + i * 0.7) * 0.0012 * step;
    }
    points.current!.rotation.z = xr.smoothPointer.x * 0.02;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ================================================================
   Subtle floor grid — spatial reference, never noisy
   ================================================================ */

export function GridFloor({ from = 0, to = -320 }: { from?: number; to?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color("#4b7fd6") } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec2 vUv; uniform vec3 uColor;
          float grid(vec2 uv, float scale){
            vec2 g = abs(fract(uv * scale - 0.5) - 0.5) / fwidth(uv * scale);
            return 1.0 - min(min(g.x, g.y), 1.0);
          }
          void main(){
            float g = grid(vUv, 90.0);
            float fade = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
            gl_FragColor = vec4(uColor, g * fade * 0.22);
          }`,
      }),
    [],
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.5, (from + to) / 2]} material={material}>
      <planeGeometry args={[120, Math.abs(to - from)]} />
    </mesh>
  );
}

/* ================================================================
   InteractiveObject — hover / focus / click behaviour
   ================================================================ */

export function InteractiveObject({
  children,
  onActivate,
  label,
  hoverLift = 0.9,
  scaleTo = 1.08,
}: {
  children: ReactNode;
  onActivate?: () => void;
  label?: string;
  hoverLift?: number;
  scaleTo?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = hovered ? scaleTo : 1;
    const s = THREE.MathUtils.lerp(group.current.scale.x, target, Math.min(1, delta * 6));
    group.current.scale.setScalar(s);
    group.current.position.z = THREE.MathUtils.lerp(
      group.current.position.z,
      hovered ? hoverLift : 0,
      Math.min(1, delta * 6),
    );
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.dataset.cursorHover = "3d";
      }}
      onPointerOut={() => {
        setHovered(false);
        delete document.body.dataset.cursorHover;
      }}
      onClick={(e) => {
        e.stopPropagation();
        onActivate?.();
      }}
    >
      {children}
    </group>
  );
}

/* ================================================================
   Service objects — one 3D metaphor per capability
   ================================================================ */

function ServiceShape({ shape, accent }: { shape: string; accent: string }) {
  const frame = (
    <meshPhysicalMaterial
      color="#0b1226"
      metalness={0.5}
      roughness={0.28}
      clearcoat={0.8}
      emissive={new THREE.Color(accent)}
      emissiveIntensity={0.12}
    />
  );
  const glow = <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.85} />;

  switch (shape) {
    case "phone":
      return (
        <group>
          <mesh>
            <boxGeometry args={[1.5, 3, 0.22]} />
            {frame}
          </mesh>
          <mesh position={[0, 0.9, 0.13]}>
            <planeGeometry args={[1.2, 0.8]} />
            {glow}
          </mesh>
          <mesh position={[0, -0.35, 0.13]}>
            <planeGeometry args={[1.2, 0.18]} />
            <meshBasicMaterial color={accent} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, -0.95, 0.13]}>
            <planeGeometry args={[0.8, 0.18]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
          </mesh>
        </group>
      );
    case "neural":
      return (
        <group>
          {Array.from({ length: 12 }).map((_, i) => {
            const ring = Math.floor(i / 4);
            const angle = ((i % 4) / 4) * Math.PI * 2 + ring;
            const r = 0.7 + ring * 0.55;
            return (
              <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r * 0.7, ring * 0.5 - 0.5]}>
                <sphereGeometry args={[0.16, 12, 12]} />
                {glow}
              </mesh>
            );
          })}
          <mesh>
            <sphereGeometry args={[0.34, 18, 18]} />
            <meshStandardMaterial color="#12082b" emissive={new THREE.Color(accent)} emissiveIntensity={1.1} />
          </mesh>
        </group>
      );
    case "cloud":
      return (
        <group>
          {[[-0.7, 0.2, 0, 0.62], [0.1, 0.5, 0, 0.8], [0.85, 0.15, 0, 0.55], [0, -0.35, 0, 0.7]].map(
            ([x, y, z, r], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[r, 16, 16]} />
                {frame}
              </mesh>
            ),
          )}
          <mesh position={[0, -1.05, 0]}>
            <boxGeometry args={[2.1, 0.05, 0.7]} />
            {glow}
          </mesh>
        </group>
      );
    case "layers":
      return (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, i * 0.42 - 0.6, i * 0.28 - 0.42]} rotation={[-0.35, 0, 0]}>
              <boxGeometry args={[2.2, 1.4, 0.05]} />
              <meshPhysicalMaterial
                color="#0b1226"
                transparent
                opacity={0.55}
                roughness={0.15}
                metalness={0.3}
                emissive={new THREE.Color(accent)}
                emissiveIntensity={i === 3 ? 0.4 : 0.1}
              />
            </mesh>
          ))}
        </group>
      );
    case "modules":
      return (
        <group>
          {[
            [-0.8, 0.5],
            [0.8, 0.5],
            [-0.8, -0.6],
            [0.8, -0.6],
            [0, -0.05],
          ].map(([x, y], i) => (
            <mesh key={i} position={[x, y, i === 4 ? 0.3 : 0]}>
              <boxGeometry args={[1.25, 0.85, i === 4 ? 0.9 : 0.35]} />
              {frame}
            </mesh>
          ))}
        </group>
      );
    default: // browser
      return (
        <group>
          <mesh>
            <boxGeometry args={[2.8, 1.85, 0.16]} />
            {frame}
          </mesh>
          <mesh position={[0, 0.68, 0.09]}>
            <boxGeometry args={[2.8, 0.45, 0.02]} />
            <meshBasicMaterial color="#101a33" />
          </mesh>
          {[-1.15, -0.95, -0.75].map((x) => (
            <mesh key={x} position={[x, 0.68, 0.11]}>
              <circleGeometry args={[0.055, 12]} />
              {glow}
            </mesh>
          ))}
          <mesh position={[-0.35, -0.1, 0.09]}>
            <planeGeometry args={[1.5, 0.75]} />
            {glow}
          </mesh>
          <mesh position={[0.75, -0.1, 0.09]}>
            <planeGeometry args={[0.6, 0.75]} />
            <meshBasicMaterial color={accent} transparent opacity={0.35} />
          </mesh>
          <mesh position={[-0.35, -0.66, 0.09]}>
            <planeGeometry args={[2.1, 0.14]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
          </mesh>
        </group>
      );
  }
}

export function ServiceObject({
  shape,
  accent,
  position,
  scale = 1,
  quality = "high",
  onActivate,
  label,
}: {
  shape: string;
  accent: string;
  position: [number, number, number];
  scale?: number;
  quality?: Quality;
  onActivate?: () => void;
  label?: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current || xr.reduced) return;
    const t = state.clock.elapsedTime + seed;
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 0.18;
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.25;
  });

  const seg = quality === "low" ? 0.7 : 1;

  return (
    <group ref={ref} position={position} scale={scale * seg}>
      <InteractiveObject label={label} onActivate={onActivate}>
        <pointLight position={[0, 0, 1.2]} intensity={3} distance={6} color={accent} />
        <ServiceShape shape={shape} accent={accent} />
      </InteractiveObject>
    </group>
  );
}

/* ================================================================
   Technology node — orbital ecosystem element
   ================================================================ */

export function TechnologyNode({
  color,
  radius = 0.4,
  position,
  active = false,
  label,
  onActivate,
}: {
  color: string;
  radius?: number;
  position: [number, number, number];
  active?: boolean;
  label?: string;
  onActivate?: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.6;
    const target = active ? 1.45 : 1;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    if (!xr.reduced) {
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.12;
    }
  });

  return (
    <InteractiveObject label={label} onActivate={onActivate} hoverLift={0.4} scaleTo={1.2}>
      <mesh ref={mesh} position={position}>
        <icosahedronGeometry args={[radius, 1]} />
        <meshStandardMaterial
          color="#0a1122"
          metalness={0.7}
          roughness={0.25}
          emissive={new THREE.Color(color)}
          emissiveIntensity={active ? 1.4 : 0.55}
        />
      </mesh>
      <mesh position={position} scale={1.35}>
        <sphereGeometry args={[radius, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.22 : 0.09} />
      </mesh>
    </InteractiveObject>
  );
}

/* ================================================================
   Project panel — layered spatial screen
   ================================================================ */

export function ProjectPanel({
  accent,
  position,
  image,
  active = false,
  onActivate,
  label,
}: {
  accent: string;
  position: [number, number, number];
  image?: string;
  active?: boolean;
  onActivate?: () => void;
  label?: string;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current || xr.reduced) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.25 + position[0]) * 0.18;
    group.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.14;
  });

  return (
    <group ref={group} position={position}>
      <InteractiveObject label={label} onActivate={onActivate} hoverLift={1.2} scaleTo={1.04}>
        <mesh>
          <boxGeometry args={[3.6, 2.25, 0.1]} />
          <meshPhysicalMaterial
            color="#080d1c"
            metalness={0.45}
            roughness={0.3}
            emissive={new THREE.Color(accent)}
            emissiveIntensity={active ? 0.35 : 0.12}
          />
        </mesh>
        <mesh position={[0, 0.08, 0.06]}>
          <planeGeometry args={[3.36, 1.9]} />
          <meshBasicMaterial map={useScreenTexture(accent, image)} toneMapped={false} />
        </mesh>
        <mesh position={[0, -1.25, 0.05]}>
          <boxGeometry args={[2.4, 0.06, 0.04]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
        <mesh position={[-1.6, 0, -0.5]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.06, 2, 1]} />
          <meshBasicMaterial color={accent} transparent opacity={0.28} />
        </mesh>
      </InteractiveObject>
    </group>
  );
}

/**
 * Procedural "product screen" texture — zero network requests, zero failure modes.
 * If a project image URL exists it is painted into the canvas as a soft plate.
 */
const screenCache = new Map<string, THREE.CanvasTexture>();

function useScreenTexture(accent: string, image?: string) {
  return useMemo(() => {
    const key = `${accent}|${image ?? "none"}`;
    const cached = screenCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = 672;
    canvas.height = 380;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.fillStyle = "#070b16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.globalAlpha = 0.5;
    }
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `${accent}55`);
    gradient.addColorStop(0.5, "#0d1730");
    gradient.addColorStop(1, "#9b5cff33");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // interface scaffolding
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(24, 40 + i * 58);
      ctx.lineTo(canvas.width - 24, 40 + i * 58);
      ctx.stroke();
    }
    ctx.fillStyle = `${accent}cc`;
    const bars = [0.62, 0.84, 0.45, 0.94, 0.7, 1];
    bars.forEach((b, i) => {
      const w = 46;
      const h = b * 190;
      ctx.fillRect(40 + i * 100, 340 - h, w, h);
    });
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(40, 24, 190, 6);
    ctx.fillStyle = `${accent}aa`;
    ctx.fillRect(40, 40, 120, 5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    screenCache.set(key, texture);
    return texture;
  }, [accent, image]);
}

/* ================================================================
   Process path — the journey camera travels along
   ================================================================ */

export function ProcessPath({ stages, accent }: { stages: number; accent: string }) {
  const curve = useMemo(() => {
    const points = Array.from({ length: stages }).map((_, i) => {
      const t = i / Math.max(1, stages - 1);
      return new THREE.Vector3(Math.sin(t * Math.PI * 2) * 4.2, Math.cos(t * Math.PI * 1.4) * 1.6, -i * 4.2);
    });
    return new THREE.CatmullRomCurve3(points);
  }, [stages]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, stages * 18, 0.035, 8, false), [curve, stages]);
  const marker = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!marker.current || xr.reduced) return;
    const t = (state.clock.elapsedTime * 0.06) % 1;
    const p = curve.getPointAt(t);
    marker.current.position.copy(p);
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={accent} transparent opacity={0.5} />
      </mesh>
      <mesh ref={marker}>
        <sphereGeometry args={[0.14, 14, 14]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ================================================================
   Idea-to-software morph object
   ================================================================ */

export function MorphObject({ accent, progress }: { accent: string; progress: number }) {
  const ref = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.25;
    if (core.current) {
      const target = THREE.MathUtils.lerp(0.45, 1.15, progress);
      core.current.scale.lerp(new THREE.Vector3(target, target, target), 0.08);
    }
  });

  const shellCount = Math.round(THREE.MathUtils.clamp(progress * 4, 0, 4));

  return (
    <group ref={ref}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.6, progress > 0.5 ? 2 : 1]} />
        <meshStandardMaterial
          color="#0a1122"
          metalness={0.6}
          roughness={0.2}
          emissive={new THREE.Color(accent)}
          emissiveIntensity={0.5 + progress * 0.9}
        />
      </mesh>
      {Array.from({ length: shellCount }).map((_, i) => (
        <mesh key={i} scale={1.35 + i * 0.32} rotation={[i * 0.5, i * 0.35, 0]}>
          <boxGeometry args={[1, 1, 0.04]} />
          <meshPhysicalMaterial
            color="#0b1226"
            transparent
            opacity={0.35}
            metalness={0.4}
            roughness={0.15}
            emissive={new THREE.Color(accent)}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
      <pointLight intensity={2 + progress * 6} distance={8} color={accent} />
    </group>
  );
}

/* ================================================================
   Camera rig — single source of truth for camera state
   ================================================================ */

export function CameraRig({ sections }: { sections: number }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const travel = xr.progress * (sections - 1) * SECTION_GAP;
    const z = 9 - travel;
    const parallax = xr.reduced ? 0.15 : 1;
    camera.position.x += (xr.smoothPointer.x * 1.5 * parallax - camera.position.x) * 0.05;
    camera.position.y += (xr.smoothPointer.y * 1 * parallax - camera.position.y) * 0.05;
    camera.position.z += (z - camera.position.z) * 0.08;
    target.set(
      xr.smoothPointer.x * 0.9 * parallax,
      xr.smoothPointer.y * 0.6 * parallax,
      camera.position.z - 18,
    );
    camera.lookAt(target);
  });

  return null;
}

/** Visibility culling: only render the sections near the camera. */
export function useSectionVisible(index: number, sections: number) {
  const center = (index / Math.max(1, sections - 1)) * (sections - 1) * SECTION_GAP;
  const cameraZ = 9 - xr.progress * (sections - 1) * SECTION_GAP;
  const distance = Math.abs(cameraZ - center);
  return distance < SECTION_GAP * 1.7;
}
