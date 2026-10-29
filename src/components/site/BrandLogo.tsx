"use client";

import { useState } from "react";
import { useBrand } from "./BrandProvider";

type BrandContextKey = "header" | "footer" | "login" | "portal" | "admin" | "email" | "mobile" | "hero";

function TextWordmark({ compact, brandName, tagline }: { compact?: boolean; brandName: string; tagline: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-lg font-semibold tracking-tight text-ink">{brandName}</span>
      {!compact ? (
        <span className="hidden text-[10px] uppercase tracking-[0.3em] text-mute sm:inline">{tagline}</span>
      ) : null}
    </span>
  );
}

/**
 * BrandLogo — renders the active brand asset for a given context.
 * Falls back to a typographic wordmark if the asset is missing or fails to load.
 */
export function BrandLogo({
  context = "header",
  className = "",
  height = 34,
}: {
  context?: BrandContextKey;
  className?: string;
  height?: number;
}) {
  const brand = useBrand();
  const [failed, setFailed] = useState(false);

  const src =
    context === "mobile" || context === "admin" || context === "portal" ? brand.logoUrl : brand.logoUrl;

  if (failed) {
    return <TextWordmark brandName={brand.brandName} tagline={brand.tagline} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${brand.brandName} — ${brand.tagline}`}
      height={height}
      className={`w-auto max-w-[220px] object-contain ${className}`}
      onError={() => setFailed(true)}
      loading="eager"
      decoding="async"
    />
  );
}

/** BrandIcon — the square mark used for avatars, loaders and small surfaces. */
export function BrandIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  const brand = useBrand();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="grid place-items-center rounded-xl text-xs font-semibold"
        style={{ width: size, height: size, background: "rgba(255,255,255,0.08)", color: brand.accent }}
      >
        {brand.brandName.slice(0, 1)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.iconUrl}
      alt=""
      width={size}
      height={size}
      className={`rounded-xl object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

/** Active event ribbon — respects the branding engine, never hardcoded. */
export function BrandEventBadge() {
  const brand = useBrand();
  if (!brand.event) return null;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium"
      style={{ borderColor: `${brand.accent}55`, color: brand.accent, background: `${brand.accent}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full pulse-soft" style={{ background: brand.accent }} />
      {brand.event.name}
    </span>
  );
}
