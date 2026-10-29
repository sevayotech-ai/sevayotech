import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { resolveBrand, invalidateBrandCache } from "@/lib/branding";
import { getSiteConfig } from "@/lib/content";
import { ensureSeed } from "@/db/seed";
import { BrandProvider } from "@/components/site/BrandProvider";
import { Cursor } from "@/components/site/Cursor";
import { XrRuntime } from "@/components/site/XrRuntime";
import { SessionProvider } from "@/components/site/SessionProvider";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  invalidateBrandCache();
  await ensureSeed();
  const [brand, config] = await Promise.all([resolveBrand(), getSiteConfig()]);
  const title = config.seo.title || `${brand.brandName} — ${brand.tagline}`;

  return {
    title: { default: title, template: `%s · ${brand.brandName}` },
    description: config.seo.description,
    keywords: config.seo.keywords.split(",").map((k) => k.trim()),
    applicationName: brand.brandName,
    metadataBase: new URL(config.seo.canonical),
    alternates: { canonical: "/" },
    icons: {
      icon: [{ url: brand.faviconUrl, type: "image/svg+xml" }],
      apple: [{ url: brand.iconUrl }],
    },
    openGraph: {
      type: "website",
      siteName: brand.brandName,
      title,
      description: config.seo.description,
      url: config.seo.canonical,
      images: [{ url: brand.logoUrl, width: 1200, height: 630, alt: `${brand.brandName} — ${brand.tagline}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: config.seo.description,
      images: [brand.logoUrl],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#04050a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const [brand, user] = await Promise.all([resolveBrand(), getCurrentUser()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <SessionProvider
          value={{
            loggedIn: !!user,
            role: user?.role ?? "guest",
            name: user?.name ?? "",
            homeHref: user?.role === "admin" ? "/admin" : "/portal",
          }}
        >
        <BrandProvider
          initial={{
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
          }}
        >
          <Cursor />
          <XrRuntime />
          {children}
        </BrandProvider>
        </SessionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: brand.brandName,
              slogan: brand.tagline,
              url: "https://sevayo.dev",
              description: "Software development and technology company. Ideas Into Software.",
              knowsAbout: ["Web Development", "Mobile Applications", "AI & Automation", "Cloud & DevOps", "UI/UX", "Custom Software"],
            }),
          }}
        />
      </body>
    </html>
  );
}
