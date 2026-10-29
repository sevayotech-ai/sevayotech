"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { xr } from "./xr";

/**
 * BrandMark3D — the original SEVAYO identity object.
 * Not extruded text: a twisted "S" ribbon (swept tube along a spline) wrapped
 * by two orbiting containment rings and an internal emissive core.
 */
export function BrandMark3D({
  accent = "#2e9bff",
  accent2 = "#c24bff",
  scale = 1,
  quality = "high",
  spin = 0.14,
  interactive = true,
}: {
  accent?: string;
  accent2?: string;
  scale?: number;
  quality?: "high" | "medium" | "low";
  spin?: number;
  interactive?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(1.15, 2.25, 0.1),
        new THREE.Vector3(-0.35, 1.75, -0.45),
        new THREE.Vector3(-1.3, 0.85, -0.15),
        new THREE.Vector3(-0.55, 0.05, 0.35),
        new THREE.Vector3(0.6, -0.75, 0.2),
        new THREE.Vector3(1.25, -1.6, -0.25),
        new THREE.Vector3(0.2, -2.35, -0.1),
      ],
      false,
      "catmullrom",
      0.4,
    );
    return new THREE.TubeGeometry(curve, quality === "low" ? 90 : 220, 0.36, quality === "low" ? 10 : 22, false);
  }, [quality]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const pointerStrength = interactive ? 0.35 : 0.1;
    if (group.current) {
      group.current.rotation.y += delta * spin;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        xr.smoothPointer.y * pointerStrength,
        0.05,
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        -xr.smoothPointer.x * pointerStrength * 0.6,
        0.05,
      );
      group.current.position.y = Math.sin(t * 0.6) * 0.12;
    }
    if (core.current) {
      const pulse = 1 + Math.sin(t * 1.6) * 0.06;
      core.current.scale.setScalar(pulse);
    }
    if (rings.current) {
      rings.current.rotation.x = t * 0.12;
      rings.current.rotation.y = -t * 0.18;
    }
  });

  const segments = quality === "low" ? 24 : 64;

  return (
    <group ref={group} scale={scale} dispose={null}>
      {/* ribbon */}
      <mesh ref={ribbon} geometry={geometry} castShadow={quality === "high"}>
        <meshPhysicalMaterial
          color="#0e1730"
          metalness={0.55}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.15}
          emissive={new THREE.Color(accent)}
          emissiveIntensity={0.28}
          reflectivity={0.8}
        />
      </mesh>

      {/* internal light core */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.42, quality === "low" ? 1 : 3]} />
        <meshBasicMaterial color={accent} transparent opacity={0.75} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={quality === "low" ? 4 : 9} distance={9} color={accent} />

      {/* containment rings */}
      <group ref={rings}>
        {[2.6, 3.25].map((radius, i) => (
          <mesh key={radius} rotation={[i ? Math.PI / 2.4 : Math.PI / 3.2, i ? 0.5 : -0.4, 0]}>
            <torusGeometry args={[radius, 0.012, 8, segments]} />
            <meshBasicMaterial
              color={i ? accent2 : accent}
              transparent
              opacity={0.55}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* orbiting nodes = the ideas that orbit the mark */}
      {Array.from({ length: quality === "low" ? 4 : 8 }).map((_, i, arr) => {
        const angle = (i / arr.length) * Math.PI * 2;
        const radius = 3.05;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.42, Math.sin(angle * 2) * 0.7]}
          >
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshBasicMaterial color={i % 2 ? accent : accent2} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Small rotating brand mark for login / portal / admin / loading states. */
export function BrandMarkMini({ accent = "#2e9bff", scale = 0.6 }: { accent?: string; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={ref} scale={scale}>
      <mesh>
        <torusKnotGeometry args={[1, 0.3, 120, 16]} />
        <meshStandardMaterial
          color="#0d1428"
          metalness={0.6}
          roughness={0.25}
          emissive={new THREE.Color(accent)}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}
