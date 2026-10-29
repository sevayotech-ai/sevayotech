"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type BrandConfig = {
  version: number;
  mode: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
  faviconUrl: string;
  accent: string;
  accent2: string;
  particles: string;
  event: null | {
    id: string;
    name: string;
    kind: string;
    announcement: string | null;
    bannerUrl: string | null;
    heroUrl: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    endsAt: string;
  };
  announcement: { message: string; href: string | null } | null;
};

const BrandContext = createContext<BrandConfig | null>(null);

export function useBrand(): BrandConfig {
  const value = useContext(BrandContext);
  if (!value) throw new Error("useBrand must be used inside BrandProvider");
  return value;
}

/**
 * BrandProvider — single source of truth for active branding.
 * Revalidates against the server so branding changes publish without a deploy.
 */
export function BrandProvider({ initial, children }: { initial: BrandConfig; children: ReactNode }) {
  const [brand, setBrand] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch("/api/brand", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { brand: BrandConfig };
        if (!cancelled && data.brand && data.brand.version !== brand.version) {
          setBrand(data.brand);
        }
      } catch {
        /* offline — keep current branding */
      }
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [brand.version]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", brand.accent);
    root.style.setProperty("--accent-2", brand.accent2);
    root.style.setProperty("--accent-soft", `${brand.accent}29`);

    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = brand.faviconUrl;
  }, [brand.accent, brand.accent2, brand.faviconUrl]);

  const value = useMemo(() => brand, [brand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}
