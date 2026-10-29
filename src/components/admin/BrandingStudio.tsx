"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BrandMark3D } from "@/components/three/BrandMark3D";
import { useBrand } from "@/components/site/BrandProvider";
import { GlassPanel } from "@/components/ui/kit";

type Device = "desktop" | "tablet" | "mobile";
type Surface = "hero" | "header" | "login" | "portal" | "admin";

function LogoPlate({ url, scale = 1 }: { url: string; scale?: number }) {
  const texture = useRef<THREE.Texture | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!ready && !failed && url) {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        texture.current = loaded;
        setReady(true);
      },
      undefined,
      () => setFailed(true),
    );
  }

  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.position.y = Math.sin(state.clock.elapsedTime) * 0.06;
  });

  return (
    <mesh ref={mesh} scale={scale}>
      <planeGeometry args={[3.2, 1]} />
      {ready && texture.current ? (
        <meshBasicMaterial map={texture.current} transparent toneMapped={false} />
      ) : (
        <meshBasicMaterial color="#e9edf9" transparent opacity={failed ? 0.15 : 0.35} />
      )}
    </mesh>
  );
}

function PreviewScene({
  surface,
  device,
  logoUrl,
  accent,
  accent2,
  light,
}: {
  surface: Surface;
  device: Device;
  logoUrl: string;
  accent: string;
  accent2: string;
  light: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.pointer.y * 0.2, 0.05);
  });

  return (
    <group ref={group}>
      <ambientLight intensity={light ? 0.9 : 0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} color="#ffffff" />
      <pointLight position={[-4, -2, 3]} intensity={3} color={accent2} distance={12} />

      {surface === "hero" ? (
        <BrandMark3D accent={accent} accent2={accent2} scale={device === "mobile" ? 0.45 : 0.7} quality="medium" />
      ) : (
        <group>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[1.5, 0.02, 8, 96]} />
            <meshBasicMaterial color={accent} transparent opacity={0.4} />
          </mesh>
          <LogoPlate url={logoUrl} scale={device === "mobile" ? 0.55 : 0.85} />
        </group>
      )}

      <mesh position={[0, 0, -1.6]}>
        <circleGeometry args={[3.2, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

/**
 * BrandStudio — live 3D branding preview with device + surface switching,
 * before/after comparison and rotation control.
 */
export function BrandStudio({
  accent,
  accent2,
  standardLogo,
  activeLogo,
  mode,
  version,
  eventName,
}: {
  accent: string;
  accent2: string;
  standardLogo: string;
  activeLogo: string;
  mode: string;
  version: number;
  eventName: string | null;
}) {
  const brand = useBrand();
  const [device, setDevice] = useState<Device>("desktop");
  const [surface, setSurface] = useState<Surface>("hero");
  const [compare, setCompare] = useState(false);
  const [light, setLight] = useState(false);
  const [rotate, setRotate] = useState(true);

  const previewLogo = activeLogo || standardLogo;

  return (
    <GlassPanel className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="eyebrow">Live 3D preview</p>
          <p className="mt-1 text-sm text-mute">
            mode <span className="mono text-ink">{mode}</span> · version{" "}
            <span className="mono text-ink">{version}</span>
            {eventName ? (
              <>
                {" "}
                · event <span style={{ color: brand.accent }}>{eventName}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["desktop", "tablet", "mobile"] as Device[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDevice(option)}
              className={`rounded-full border px-3 py-1.5 text-[12px] capitalize transition ${
                device === option ? "border-white/25 bg-white/10 text-ink" : "border-line text-mute hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCompare((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
              compare ? "border-white/25 bg-white/10 text-ink" : "border-line text-mute hover:text-ink"
            }`}
          >
            compare
          </button>
          <button
            type="button"
            onClick={() => setLight((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
              light ? "border-white/25 bg-white/10 text-ink" : "border-line text-mute hover:text-ink"
            }`}
          >
            {light ? "light env" : "dark env"}
          </button>
          <button
            type="button"
            onClick={() => setRotate((v) => !v)}
            className="rounded-full border border-line px-3 py-1.5 text-[12px] text-mute hover:text-ink"
          >
            {rotate ? "pause spin" : "spin"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        {(["hero", "header", "login", "portal", "admin"] as Surface[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSurface(option)}
            className={`rounded-full px-3 py-1.5 text-[12px] capitalize transition ${
              surface === option ? "bg-white/10 text-ink" : "text-mute hover:text-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div
        className="grid gap-4 p-5"
        style={{
          gridTemplateColumns: compare ? "1fr 1fr" : "1fr",
          background: light ? "linear-gradient(180deg,#f4f6fb,#e7ebf4)" : "transparent",
        }}
      >
        <PreviewFrame
          device={device}
          surface={surface}
          logoUrl={previewLogo}
          accent={accent}
          accent2={accent2}
          light={light}
          rotate={rotate}
          label="Active branding"
        />
        {compare ? (
          <PreviewFrame
            device={device}
            surface={surface}
            logoUrl={standardLogo}
            accent="#2e9bff"
            accent2="#9b5cff"
            light={light}
            rotate={rotate}
            label="Standard fallback"
          />
        ) : null}
      </div>

      <div className="border-t border-line px-5 py-4 text-xs text-mute">
        Preview resolves the same branding pipeline as production: manual override → active event → standard identity.
      </div>
    </GlassPanel>
  );
}

function PreviewFrame({
  device,
  surface,
  logoUrl,
  accent,
  accent2,
  light,
  rotate,
  label,
}: {
  device: Device;
  surface: Surface;
  logoUrl: string;
  accent: string;
  accent2: string;
  light: boolean;
  rotate: boolean;
  label: string;
}) {
  const height = device === "mobile" ? 420 : device === "tablet" ? 380 : 340;
  const width = device === "mobile" ? 240 : device === "tablet" ? 320 : 620;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-[22px] border border-line"
        style={{
          width: "100%",
          maxWidth: width,
          height,
          background: light
            ? "linear-gradient(160deg,#ffffff,#dfe5f0)"
            : `radial-gradient(80% 70% at 50% 10%, ${accent}18, transparent 70%), #05070f`,
        }}
      >
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6.4], fov: 45 }} frameloop={rotate ? "always" : "demand"}>
          <group rotation={rotate ? [0, 0, 0] : [0, 0.6, 0]}>
            <PreviewScene surface={surface} device={device} logoUrl={logoUrl} accent={accent} accent2={accent2} light={light} />
          </group>
        </Canvas>
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
          {label}
        </span>
      </div>
    </div>
  );
}
