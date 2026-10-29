import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ensureSeed } from "@/db/seed";
import { getCurrentUser } from "@/lib/auth";
import { resolveBrand } from "@/lib/branding";
import { getClientContext, getUnreadCount } from "@/lib/portal";
import { PortalShell } from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [brand, context, unread] = await Promise.all([
    resolveBrand(),
    getClientContext(),
    getUnreadCount(user.id),
  ]);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(90% 60% at 12% 0%, ${brand.accent}1f, transparent 65%), radial-gradient(70% 50% at 90% 10%, ${brand.accent2}17, transparent 65%), #04050a`,
          }}
        />
        <div className="absolute inset-0 grid-floor opacity-40" />
      </div>
      <PortalShell
        user={{ name: user.name, email: user.email, company: user.company, role: user.role }}
        accent={brand.accent}
        unread={unread}
      >
        {children}
      </PortalShell>
    </div>
  );
}
