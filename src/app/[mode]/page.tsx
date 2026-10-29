import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { PublicShell } from "@/components/site/PublicShell";
import { AuthPanel } from "@/components/forms/AuthPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Client access",
    description: "Sign in to your SEVAYO client workspace or create a new account.",
    robots: { index: false, follow: false },
  };
}

export default async function AuthPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (mode !== "login" && mode !== "register") notFound();

  await ensureSeed();
  const [config, brand, user] = await Promise.all([getSiteConfig(), resolveBrand(), getCurrentUser()]);

  return (
    <PublicShell
      items={config.nav}
      company={config.company}
      social={config.social}
      tagline={brand.tagline}
      glow={brand.accent}
    >
      <AuthPanel
        mode={mode}
        session={
          user
            ? {
                name: user.name,
                email: user.email,
                role: user.role,
                homeHref: user.role === "admin" ? "/admin" : "/portal",
              }
            : null
        }
      />
    </PublicShell>
  );
}
