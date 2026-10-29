"use client";

import { useEffect, useState } from "react";
import { setQuality, setReduced, useXrRuntime, useXrUi } from "@/components/three/xr";

const KEY = "sevayo:motion-mode"; // spatial | reduced | off

/**
 * Spatial controls. Three modes, applied instantly (no reload):
 *  spatial — full 3D
 *  reduced — minimal camera/object motion, 3D preserved
 *  off     — WebGL disabled entirely, CSS 2.5D world instead
 */
export function XrRuntime() {
  useXrRuntime();
  const { ready, quality } = useXrUi();
  const [mode, setMode] = useState<"spatial" | "reduced" | "off">("spatial");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = (window.localStorage.getItem(KEY) as typeof mode | null) ?? "spatial";
    setMode(stored);
    applyMode(stored, quality);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const apply = (next: "spatial" | "reduced" | "off") => {
    setMode(next);
    window.localStorage.setItem(KEY, next);
    applyMode(next, quality);
    setOpen(false);
  };

  const label = mode === "spatial" ? "Motion: spatial" : mode === "reduced" ? "Motion: reduced" : "3D: off";

  return (
    <>
      <div className="fixed bottom-5 left-5 z-30 hidden md:block">
        {open ? (
          <div className="glass-strong mb-2 w-56 rounded-2xl p-2">
            <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.22em] text-mute">Experience mode</p>
            {(
              [
                { key: "spatial", title: "Spatial", detail: "Full 3D environment" },
                { key: "reduced", title: "Reduced", detail: "3D on, minimal motion" },
                { key: "off", title: "Off", detail: "Disable 3D completely" },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => apply(option.key)}
                aria-pressed={mode === option.key}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition ${
                  mode === option.key ? "bg-white/10 text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
                }`}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: mode === option.key ? "#2e9bff" : "rgba(255,255,255,0.25)" }}
                />
                <span>
                  <span className="block text-[13px]">{option.title}</span>
                  <span className="block text-[11px] text-mute">{option.detail}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Change motion and 3D mode"
          className="rounded-full border border-line bg-black/40 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-mute backdrop-blur transition hover:text-ink"
        >
          {label}
        </button>
      </div>
    </>
  );
}

function applyMode(mode: "spatial" | "reduced" | "off", detected: string) {
  if (mode === "off") {
    setQuality("none");
    setReduced(true);
    return;
  }
  if (mode === "reduced") {
    setQuality("low");
    setReduced(true);
    return;
  }
  setReduced(false);
  setQuality(detected === "none" ? "none" : (detected as "high" | "medium" | "low"));
}
