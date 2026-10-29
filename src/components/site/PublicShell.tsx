"use client";

import type { ReactNode } from "react";
import { SiteNav, SiteFooter } from "./SiteNav";
import { LiteBackdrop } from "@/components/three/LiteBackdrop";
import { useBrand } from "./BrandProvider";

/** Shared shell for inner public pages: spatial backdrop + navigation. */
export function PublicShell({
  items,
  company,
  social,
  tagline,
  children,
  glow = "#2e9bff",
}: {
  items: { label: string; href: string }[];
  company: { name: string; email: string; phone: string; address: string; hours: string };
  social: { label: string; href: string }[];
  tagline: string;
  children: ReactNode;
  glow?: string;
}) {
  const brand = useBrand();
  return (
    <>
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <LiteBackdrop accent={brand.accent} accent2={brand.accent2} />
        <div
          className="absolute left-1/2 top-0 h-[40vh] w-[120vw] -translate-x-1/2 opacity-40 blur-3xl"
          style={{ background: `radial-gradient(60% 60% at 50% 0%, ${glow}33, transparent 70%)` }}
        />
      </div>
      <SiteNav items={items} />
      <main id="main" className="relative z-10 pt-32">
        {children}
      </main>
      <SiteFooter items={items} company={company} social={social} tagline={tagline} />
    </>
  );
}
