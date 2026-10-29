"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useXrUi } from "./xr";
import { LiteBackdrop } from "./LiteBackdrop";

const HomeWorld = dynamic(() => import("./HomeWorld"), { ssr: false });

export type WorldConfig = {
  services: { id: string; title: string; shape: string; accent: string }[];
  projects: { slug: string; title: string; accent: string; image?: string }[];
  tech: { name: string; color: string; category: string; orbit: number }[];
  accent: string;
  accent2: string;
  warm: boolean;
};

/**
 * SceneContainer — owns capability gating, progressive enhancement and the
 * WebGL fallback. The DOM content stays fully functional in every branch.
 */
export function SceneContainer({
  config,
  activeService,
  activeTech,
  activeProject,
  onService,
  onTech,
  onProject,
}: {
  config: WorldConfig;
  activeService: number;
  activeTech: string | null;
  activeProject: number;
  onService: (index: number) => void;
  onTech: (name: string) => void;
  onProject: (index: number) => void;
}) {
  const { quality, ready, reduced } = useXrUi();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!ready || quality === "none") {
    return <LiteBackdrop accent={config.accent} accent2={config.accent2} active={activeService} />;
  }

  if (!mounted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full border border-white/10 border-t-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <HomeWorld
      quality={reduced ? "low" : quality}
      services={config.services}
      projects={config.projects}
      tech={config.tech}
      accent={config.accent}
      accent2={config.accent2}
      warm={config.warm}
      activeService={activeService}
      activeTech={activeTech}
      activeProject={activeProject}
      onService={onService}
      onTech={onTech}
      onProject={onProject}
    />
  );
}
