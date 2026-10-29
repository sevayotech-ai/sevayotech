import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ensureSeed } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { resolveBrand } from "@/lib/branding";
import { AdminShell, type AdminData } from "@/components/admin/AdminViews";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal");

  const brand = await resolveBrand();

  const initialData: Pick<AdminData, "user" | "brand"> = {
    user: { name: user.name, email: user.email, role: user.role },
    brand: {
      logoUrl: brand.logoUrl,
      iconUrl: brand.iconUrl,
      accent: brand.accent,
      accent2: brand.accent2,
      mode: brand.mode,
      version: brand.version,
      eventName: brand.event?.name ?? null,
      tagline: brand.tagline,
    },
  };

  return <AdminShellBridge data={initialData}>{children}</AdminShellBridge>;
}

async function AdminShellBridge({
  data,
  children,
}: {
  data: Pick<AdminData, "user" | "brand">;
  children: ReactNode;
}) {
  return <AdminShell data={data as AdminData}>{children}</AdminShell>;
}
