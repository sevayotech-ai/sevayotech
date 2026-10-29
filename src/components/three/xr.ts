"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Quality = "high" | "medium" | "low" | "none";

export const SECTION_GAP = 48;

/** Mutable, render-free 3D state. Written by DOM listeners, read inside useFrame. */
export const xr = {
  progress: 0,
  pointer: { x: 0, y: 0 },
  smoothPointer: { x: 0, y: 0 },
  dragging: false,
  sections: 1,
  scene: "hero" as string,
  quality: "medium" as Quality,
  reduced: false,
};

type UiState = {
  quality: Quality;
  reduced: boolean;
  ready: boolean;
  scene: string;
  version: number;
};

let ui: UiState = {
  quality: "medium",
  reduced: false,
  ready: false,
  scene: "hero",
  version: 0,
};

const listeners = new Set<() => void>();

function emit(patch: Partial<UiState>) {
  ui = { ...ui, ...patch, version: ui.version + 1 };
  listeners.forEach((l) => l());
}

export function subscribeUi(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUiSnapshot() {
  return ui;
}

export function useXrUi(): UiState {
  return useSyncExternalStore(subscribeUi, getUiSnapshot, getUiSnapshot);
}

export function setScene(scene: string) {
  if (xr.scene !== scene) {
    xr.scene = scene;
    emit({ scene });
  }
}

export function setQuality(quality: Quality) {
  xr.quality = quality;
  emit({ quality });
}

export function setReduced(reduced: boolean) {
  xr.reduced = reduced;
  emit({ reduced });
}

/* ------------------------- capability detection ------------------------- */

function webglSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

function detect(): { quality: Quality; reduced: boolean } {
  if (typeof window === "undefined") return { quality: "medium", reduced: false };
  if (!webglSupported()) return { quality: "none", reduced: false };

  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
  const memory = (nav as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 4;
  const mobile = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  const reduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.localStorage.getItem("sevayo:reduced-motion") === "1";

  let quality: Quality = "high";
  if (mobile) quality = "low";
  else if (cores <= 4 || memory <= 4) quality = "medium";
  if (mobile && cores >= 8) quality = "medium";

  return { quality: reduced ? "low" : quality, reduced };
}

/** Attaches global listeners. Safe to call once from the app shell. */
export function useXrRuntime() {
  const detectNow = useCallback(() => {
    const result = detect();
    setQuality(result.quality);
    setReduced(result.reduced);
    emit({ ready: true });
  }, []);

  useEffect(() => {
    detectNow();

    let frame = 0;
    let target = 0;

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onPointer = (event: PointerEvent) => {
      xr.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      xr.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const loop = () => {
      xr.progress += (target - xr.progress) * 0.085;
      xr.smoothPointer.x += (xr.pointer.x - xr.smoothPointer.x) * 0.06;
      xr.smoothPointer.y += (xr.pointer.y - xr.smoothPointer.y) * 0.06;
      frame = requestAnimationFrame(loop);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    frame = requestAnimationFrame(loop);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMedia = () => setReduced(media.matches);
    media.addEventListener("change", onMedia);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      media.removeEventListener("change", onMedia);
      cancelAnimationFrame(frame);
    };
  }, [detectNow]);
}

/** Marks a section as active for camera + nav state. */
export function useSceneObserver(id: string, onActive?: (active: boolean) => void) {
  useEffect(() => {
    const element = document.getElementById(id);
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setScene(id);
          onActive?.(entry.isIntersecting);
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [id, onActive]);
}
