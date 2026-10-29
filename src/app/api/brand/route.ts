import { NextResponse } from "next/server";
import { invalidateBrandCache, resolveBrand } from "@/lib/branding";

export const dynamic = "force-dynamic";

/** Public branding endpoint — lets live clients pick up branding changes. */
export async function GET() {
  invalidateBrandCache();
  const brand = await resolveBrand();
  return NextResponse.json(
    {
      brand: {
        version: brand.version,
        mode: brand.mode,
        brandName: brand.brandName,
        tagline: brand.tagline,
        logoUrl: brand.logoUrl,
        iconUrl: brand.iconUrl,
        faviconUrl: brand.faviconUrl,
        accent: brand.accent,
        accent2: brand.accent2,
        particles: brand.particles,
        event: brand.event,
        announcement: brand.announcement,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
