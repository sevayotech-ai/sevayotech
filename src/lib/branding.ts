import "server-only";
import { and, asc, desc, eq, lte, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  brandAssets,
  brandingEvents,
  brandingSettings,
  mediaAssets,
  type BrandAsset,
  type BrandingEvent,
} from "@/db/schema";

export type BrandKind = "diwali" | "newyear" | "christmas" | "anniversary" | "independence" | "republic" | "campaign" | "custom";

export type ResolvedBrand = {
  version: number;
  mode: "auto" | "manual";
  brandName: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
  faviconUrl: string;
  wordmarkUrl: string | null;
  accent: string;
  accent2: string;
  particles: "default" | "warm" | "cool" | "festive" | "none";
  event: null | {
    id: string;
    name: string;
    kind: BrandKind;
    announcement: string | null;
    bannerUrl: string | null;
    heroUrl: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    endsAt: string;
  };
  announcement: { message: string; href: string | null } | null;
  standard: { logoUrl: string; iconUrl: string; faviconUrl: string };
};

/** Fallback SVG mark: the permanent SEVAYO standard identity. */
export const STANDARD_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="SEVAYO mark">
  <defs>
    <linearGradient id="sv" x1="24" y1="20" x2="212" y2="224" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#35d6ff"/><stop offset="0.45" stop-color="#2e9bff"/><stop offset="1" stop-color="#c24bff"/>
    </linearGradient>
    <filter id="gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="240" height="240" rx="54" fill="#05070f"/>
  <path d="M172 46C120 30 62 52 58 92c-4 38 52 50 74 70 22 20 8 46-32 52" fill="none" stroke="url(#sv)" stroke-width="30" stroke-linecap="round" filter="url(#gl)"/>
</svg>`;

export const STANDARD_WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120" role="img" aria-label="SEVAYO — Ideas Into Software">
  <defs>
    <linearGradient id="svg2" x1="10" y1="10" x2="110" y2="112" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#35d6ff"/><stop offset="0.5" stop-color="#2e9bff"/><stop offset="1" stop-color="#c24bff"/>
    </linearGradient>
  </defs>
  <path d="M84 18C48 8 8 22 6 48c-2 24 32 31 45 43 13 12 5 28-20 32" fill="none" stroke="url(#svg2)" stroke-width="18" stroke-linecap="round"/>
  <text x="118" y="78" font-family="Inter,system-ui,sans-serif" font-size="62" font-weight="600" letter-spacing="-2" fill="#e9edf9">evayo</text>
  <text x="120" y="104" font-family="Inter,system-ui,sans-serif" font-size="17" letter-spacing="7" fill="#8ea0c0">IDEAS INTO SOFTWARE</text>
</svg>`;

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Returns the instant expressed in `timezone`, encoded as a shifted UTC date.
 * Comparing two shifted dates is a valid wall-clock comparison in one zone.
 */
function zoned(date: Date, timezone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
    return new Date(
      Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")),
    );
  } catch {
    return date;
  }
}

const nowInZone = (timezone: string) => zoned(new Date(), timezone);

export const FALLBACK_BRAND: ResolvedBrand = {
  version: 0,
  mode: "auto",
  brandName: "SEVAYO",
  tagline: "Ideas Into Software",
  logoUrl: svgToDataUrl(STANDARD_WORDMARK_SVG),
  iconUrl: svgToDataUrl(STANDARD_MARK_SVG),
  faviconUrl: svgToDataUrl(STANDARD_MARK_SVG),
  wordmarkUrl: null,
  accent: "#2e9bff",
  accent2: "#9b5cff",
  particles: "default",
  event: null,
  announcement: null,
  standard: {
    logoUrl: svgToDataUrl(STANDARD_WORDMARK_SVG),
    iconUrl: svgToDataUrl(STANDARD_MARK_SVG),
    faviconUrl: svgToDataUrl(STANDARD_MARK_SVG),
  },
};

type CacheEntry = { value: ResolvedBrand; expires: number };
let cache: CacheEntry | null = null;

export function invalidateBrandCache() {
  cache = null;
}

function assetUrl(asset: BrandAsset | undefined | null, fallback: string): string {
  if (!asset?.fileUrl) return fallback;
  return asset.fileUrl;
}

/**
 * Central branding resolver:
 *  1. manual override (branding_settings.mode = 'manual')
 *  2. highest-priority active scheduled event
 *  3. standard SEVAYO identity
 */
export async function resolveBrand(): Promise<ResolvedBrand> {
  if (cache && cache.expires > Date.now()) return cache.value;

  let resolved = FALLBACK_BRAND;

  try {
    const settingsRows = await db.select().from(brandingSettings).orderBy(desc(brandingSettings.version)).limit(1);
    const settings = settingsRows[0];

    const standardLogo = settings?.defaultLogoId
      ? (await db.select().from(brandAssets).where(eq(brandAssets.id, settings.defaultLogoId)).limit(1))[0]
      : undefined;
    const standardIcon = settings?.defaultIconId
      ? (await db.select().from(brandAssets).where(eq(brandAssets.id, settings.defaultIconId)).limit(1))[0]
      : undefined;
    const standardFavicon = settings?.defaultFaviconId
      ? (await db.select().from(brandAssets).where(eq(brandAssets.id, settings.defaultFaviconId)).limit(1))[0]
      : undefined;

    const standard = {
      logoUrl: assetUrl(standardLogo, FALLBACK_BRAND.standard.logoUrl),
      iconUrl: assetUrl(standardIcon, FALLBACK_BRAND.standard.iconUrl),
      faviconUrl: assetUrl(standardFavicon, FALLBACK_BRAND.standard.faviconUrl),
    };

    resolved = {
      ...FALLBACK_BRAND,
      version: settings?.version ?? 1,
      mode: (settings?.mode as "auto" | "manual") ?? "auto",
      brandName: settings?.brandName ?? "SEVAYO",
      tagline: settings?.tagline ?? "Ideas Into Software",
      standard,
      logoUrl: standard.logoUrl,
      iconUrl: standard.iconUrl,
      faviconUrl: standard.faviconUrl,
    };

    /* 1 — manual override always wins */
    if (settings?.mode === "manual" && settings.activeLogoId) {
      const manual = (
        await db.select().from(brandAssets).where(eq(brandAssets.id, settings.activeLogoId)).limit(1)
      )[0];
      if (manual) {
        resolved = {
          ...resolved,
          logoUrl: manual.fileUrl,
          iconUrl: standard.iconUrl,
          accent: (manual.metadata?.accent as string) ?? resolved.accent,
        };
      }
    }

    /* 2 — active scheduled event, highest priority */
    const now = new Date();
    const events = await db
      .select()
      .from(brandingEvents)
      .where(and(gte(brandingEvents.endAt, now), lte(brandingEvents.startAt, now)))
      .orderBy(desc(brandingEvents.priority));

    const active =
      events.find((e: BrandingEvent) => {
        if (e.status === "disabled" || e.status === "draft") return false;
        const now = nowInZone(e.timezone);
        return now >= zoned(new Date(e.startAt), e.timezone) && now <= zoned(new Date(e.endAt), e.timezone);
      }) ?? null;

    if (active) {
      const [logo, favicon, banner, hero] = await Promise.all([
        active.logoAssetId
          ? db.select().from(brandAssets).where(eq(brandAssets.id, active.logoAssetId)).limit(1)
          : Promise.resolve([]),
        active.faviconAssetId
          ? db.select().from(brandAssets).where(eq(brandAssets.id, active.faviconAssetId)).limit(1)
          : Promise.resolve([]),
        active.bannerAssetId
          ? db.select().from(brandAssets).where(eq(brandAssets.id, active.bannerAssetId)).limit(1)
          : Promise.resolve([]),
        active.heroAssetId
          ? db.select().from(brandAssets).where(eq(brandAssets.id, active.heroAssetId)).limit(1)
          : Promise.resolve([]),
      ]);

      resolved = {
        ...resolved,
        logoUrl: logo[0]?.fileUrl ?? resolved.logoUrl,
        faviconUrl: favicon[0]?.fileUrl ?? resolved.faviconUrl,
        accent: active.accentColor ?? resolved.accent,
        particles: (active.particles as ResolvedBrand["particles"]) ?? "default",
        event: {
          id: active.id,
          name: active.name,
          kind: active.kind as BrandKind,
          announcement: active.announcement,
          bannerUrl: banner[0]?.fileUrl ?? null,
          heroUrl: hero[0]?.fileUrl ?? null,
          heroTitle: active.heroTitle,
          heroSubtitle: active.heroSubtitle,
          endsAt: active.endAt.toISOString(),
        },
      };
    }

    /* 3 — standard identity already applied above (fallback guaranteed) */
  } catch {
    resolved = FALLBACK_BRAND;
  }

  try {
    const now = new Date();
    const rows = await db
      .select()
      .from(announcements)
      .where(eq(announcements.active, true))
      .orderBy(asc(announcements.createdAt));
    const live = rows.find(
      (a) => (!a.startAt || a.startAt <= now) && (!a.endAt || a.endAt >= now),
    );
    if (live && !resolved.event?.announcement) {
      resolved.announcement = { message: live.message, href: live.href };
    } else if (resolved.event?.announcement) {
      resolved.announcement = { message: resolved.event.announcement, href: null };
    }
  } catch {
    /* ignore */
  }

  cache = { value: resolved, expires: Date.now() + 30_000 };
  return resolved;
}

export async function brandAssetsList() {
  return db.select().from(brandAssets).orderBy(desc(brandAssets.createdAt));
}

export async function mediaById(id: string) {
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  return rows[0];
}
