"use client";

import { Suspense, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SECTION_GAP, xr, type Quality } from "./xr";
import {
  CameraRig,
  GridFloor,
  MorphObject,
  ParticleField,
  ProcessPath,
  ProjectPanel,
  SceneLighting,
  ServiceObject,
  TechnologyNode,
} from "./objects";
import { BrandMark3D } from "./BrandMark3D";

export type SceneService = { id: string; title: string; shape: string; accent: string };
export type SceneProject = { slug: string; title: string; accent: string; image?: string };
export type SceneTech = { name: string; color: string; category: string; orbit: number };

function SectionStage({
  index,
  children,
  y = 0,
  x = 0,
}: {
  index: number;
  children: ReactNode;
  y?: number;
  x?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    const center = -index * SECTION_GAP;
    const distance = Math.abs(camera.position.z - center);
    group.visible = distance < SECTION_GAP * 2.4;
    const local = THREE.MathUtils.clamp(1 - (distance - SECTION_GAP * 0.3) / (SECTION_GAP * 1.3), 0, 1);
    const scale = 0.82 + local * 0.18;
    group.scale.setScalar(scale);
    group.position.x = x + (1 - local) * xr.smoothPointer.x * 1.5;
  });

  return (
    <group ref={ref} position={[x, y, -index * SECTION_GAP]}>
      {children}
    </group>
  );
}

function Rings({ accent, accent2 }: { accent: string; accent2: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 0.05;
  });
  return (
    <group ref={ref}>
      {[5, 7.2, 9.6].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2.2 + i * 0.16, 0, 0]}>
          <torusGeometry args={[r, 0.008, 6, 128]} />
          <meshBasicMaterial color={i % 2 ? accent2 : accent} transparent opacity={0.24} />
        </mesh>
      ))}
    </group>
  );
}

export type HomeWorldProps = {
  quality: Quality;
  services: SceneService[];
  projects: SceneProject[];
  tech: SceneTech[];
  accent: string;
  accent2: string;
  warm: boolean;
  activeService: number;
  activeTech: string | null;
  activeProject: number;
  onService: (index: number) => void;
  onTech: (name: string) => void;
  onProject: (index: number) => void;
};

export default function HomeWorld({
  quality,
  services,
  projects,
  tech,
  accent,
  accent2,
  warm,
  activeService,
  activeTech,
  activeProject,
  onService,
  onTech,
  onProject,
}: HomeWorldProps) {
  const sections = 9;
  xr.sections = sections;

  const low = quality === "low";
  const particles = quality === "high" ? 1100 : quality === "medium" ? 620 : 240;

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={quality === "high" ? [1, 1.85] : quality === "medium" ? [1, 1.4] : 1}
      gl={{ antialias: !low, powerPreference: "high-performance", alpha: true }}
      camera={{ position: [0, 0, 9], fov: 52, near: 0.1, far: 320 }}
      frameloop={xr.reduced ? "demand" : "always"}
    >
      <color attach="background" args={["#04050a"]} />
      <fog attach="fog" args={["#04050a", 16, 96]} />

      <SceneLighting accent={accent} accent2={accent2} quality={quality} />
      <CameraRig sections={sections} />
      <ParticleField count={particles} accent={accent} warm={warm} depth={400} />
      {!low ? <GridFloor from={4} to={-sections * SECTION_GAP} /> : null}

      <Suspense fallback={null}>
        {/* 0 — HERO: the SEVAYO mark */}
        <SectionStage index={0}>
          <BrandMark3D accent={accent} accent2={accent2} quality={low ? "low" : "high"} scale={low ? 0.72 : 0.94} />
          <Rings accent={accent} accent2={accent2} />
        </SectionStage>

        {/* 1 — TRUST: expanding field of discipline nodes */}
        <SectionStage index={1}>
          <group rotation={[0.2, 0, 0]}>
            {Array.from({ length: low ? 18 : 42 }).map((_, i) => {
              const a = (i / (low ? 18 : 42)) * Math.PI * 2;
              const r = 4.5 + (i % 5) * 1.15;
              return (
                <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r * 0.55, -((i % 7) * 1.4)]}>
                  <boxGeometry args={[0.28, 0.28, 0.28]} />
                  <meshStandardMaterial
                    color="#0b1328"
                    metalness={0.6}
                    roughness={0.3}
                    emissive={new THREE.Color(i % 3 ? accent : accent2)}
                    emissiveIntensity={0.35}
                  />
                </mesh>
              );
            })}
          </group>
        </SectionStage>

        {/* 2 — SERVICES: capability objects in a ring */}
        <SectionStage index={2}>
          {services.map((service, i) => {
            const angle = (i / Math.max(1, services.length)) * Math.PI * 2 - Math.PI / 2;
            const radius = low ? 5.6 : 6.4;
            const isActive = activeService === i;
            return (
              <ServiceObject
                key={service.id}
                shape={service.shape}
                accent={service.accent}
                label={service.title}
                position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, isActive ? 2.4 : 0]}
                scale={isActive ? (low ? 0.85 : 1.05) : low ? 0.62 : 0.78}
                quality={low ? "low" : "high"}
                onActivate={() => onService(i)}
              />
            );
          })}
          <Rings accent={accent} accent2={accent2} />
        </SectionStage>

        {/* 3 — IDEA: object that becomes a product */}
        <SectionStage index={3}>
          <MorphObject accent={accent} progress={xr.progress} />
          {Array.from({ length: low ? 3 : 6 }).map((_, i) => (
            <mesh key={i} position={[3.4 + (i % 2) * 1.5, 1.6 - i * 0.6, -i * 0.8]} rotation={[0, -0.5, 0]}>
              <planeGeometry args={[1.3, 0.85]} />
              <meshPhysicalMaterial
                color="#0b1226"
                transparent
                opacity={0.45}
                emissive={new THREE.Color(accent)}
                emissiveIntensity={0.25}
              />
            </mesh>
          ))}
        </SectionStage>

        {/* 4 — TECHNOLOGY: orbital ecosystem */}
        <SectionStage index={4}>
          <mesh>
            <icosahedronGeometry args={[1.15, 2]} />
            <meshStandardMaterial
              color="#080e1e"
              metalness={0.8}
              roughness={0.18}
              emissive={new THREE.Color(accent)}
              emissiveIntensity={0.5}
            />
          </mesh>
          {tech.map((node, i) => {
            const ring = Math.min(3, node.orbit);
            const radius = 2.6 + ring * 1.35;
            const count = tech.length;
            const angle = (i / count) * Math.PI * 2 * 1.6 + ring;
            return (
              <TechnologyNode
                key={node.name}
                color={node.color}
                label={node.name}
                radius={activeTech === node.name ? 0.42 : 0.3}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(angle * 1.4) * (0.8 + ring * 0.4),
                  Math.sin(angle) * radius * 0.5,
                ]}
                active={activeTech === node.name}
                onActivate={() => onTech(node.name)}
              />
            );
          })}
        </SectionStage>

        {/* 5 — PROJECTS: spatial product panels */}
        <SectionStage index={5}>
          {projects.map((project, i) => (
            <ProjectPanel
              key={project.slug}
              accent={project.accent}
              image={project.image}
              label={project.title}
              position={[(i - (projects.length - 1) / 2) * (low ? 3.1 : 4.1), Math.sin(i * 1.7) * 0.8, Math.abs(i - (projects.length - 1) / 2) * -1.4 + (activeProject === i ? 2.2 : 0)]}
              active={activeProject === i}
              onActivate={() => onProject(i)}
            />
          ))}
        </SectionStage>

        {/* 6 — PROCESS: the journey path */}
        <SectionStage index={6}>
          <ProcessPath stages={7} accent={accent} />
          {["01", "02", "03", "04", "05", "06", "07"].map((step, i) => {
            const t = i / 6;
            return (
              <group key={step} position={[Math.sin(t * Math.PI * 2) * 4.2, Math.cos(t * Math.PI * 1.4) * 1.6, -i * 4.2]}>
                <mesh>
                  <torusGeometry args={[0.42, 0.03, 8, 32]} />
                  <meshBasicMaterial color={accent} transparent opacity={0.75} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.14, 14, 14]} />
                  <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
              </group>
            );
          })}
        </SectionStage>

        {/* 7 — PROOF: client signal wall */}
        <SectionStage index={7}>
          <group>
            {Array.from({ length: low ? 4 : 7 }).map((_, i) => (
              <mesh key={i} position={[(i - 3) * 1.55, Math.sin(i * 1.3) * 0.9, Math.cos(i * 2.1) * 1.2]} rotation={[0, 0.2 * i, 0]}>
                <boxGeometry args={[1.25, 1.7, 0.06]} />
                <meshPhysicalMaterial
                  color="#0a1020"
                  transparent
                  opacity={0.5}
                  metalness={0.35}
                  roughness={0.22}
                  emissive={new THREE.Color(i % 2 ? accent : accent2)}
                  emissiveIntensity={0.28}
                />
              </mesh>
            ))}
          </group>
        </SectionStage>

        {/* 8 — CONTACT: the workspace */}
        <SectionStage index={8}>
          <group>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[(i - 1) * 3.1, Math.sin(i) * 0.5, i * -1.2]} rotation={[0, i * 0.2, 0]}>
                <boxGeometry args={[2.6, 1.7, 0.08]} />
                <meshPhysicalMaterial
                  color="#0a1020"
                  transparent
                  opacity={0.62}
                  metalness={0.4}
                  roughness={0.2}
                  emissive={new THREE.Color(i === 1 ? accent : accent2)}
                  emissiveIntensity={0.3}
                />
              </mesh>
            ))}
            <mesh rotation={[-Math.PI / 2.1, 0, 0]} position={[0, -2.4, 0]}>
              <ringGeometry args={[3.4, 5.4, 64]} />
              <meshBasicMaterial color={accent} transparent opacity={0.12} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </SectionStage>
      </Suspense>
    </Canvas>
  );
}
