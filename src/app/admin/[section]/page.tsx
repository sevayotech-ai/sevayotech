import { notFound, redirect } from "next/navigation";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  analyticsEvents,
  auditLogs,
  brandAssets,
  brandingEvents,
  brandingSettings,
  leads,
  mediaAssets,
  projects,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { resolveBrand } from "@/lib/branding";
import { loadCmsData, emptyExtras, type SharedInput } from "@/lib/admin-data";
import {
  AdminAudit,
  AdminBranding,
  AdminContent,
  AdminLeads,
  AdminMedia,
  AdminProjects,
  AdminUsers,
} from "@/components/admin/AdminViews";
import { AdminProfile } from "@/components/admin/AdminProfile";

export const dynamic = "force-dynamic";

const SECTIONS = ["leads", "projects", "content", "branding", "media", "users", "audit", "profile"] as const;
type SectionKey = (typeof SECTIONS)[number];

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SECTIONS.includes(section as SectionKey)) notFound();

  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.role !== "admin") redirect("/portal");

  const brand = await resolveBrand();
  const shared: SharedInput = {
    user: { name: current.name, email: current.email, role: current.role },
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
  const base = { ...shared, ...emptyExtras() };

  if (section === "leads") {
    const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
    return <AdminLeads data={{ ...base, leads: rows.map(mapLead) }} />;
  }

  if (section === "projects") {
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return (
      <AdminProjects
        data={{
          ...base,
          projects: rows.map((project) => ({
            id: project.id,
            name: project.name,
            stage: project.stage,
            status: project.status,
            progress: project.progress,
            health: project.health,
          })),
        }}
      />
    );
  }

  if (section === "content") {
    return <AdminContent data={await loadCmsData(shared)} />;
  }

  if (section === "branding") {
    const [assetRows, eventRows, settingsRows] = await Promise.all([
      db.select().from(brandAssets).orderBy(desc(brandAssets.createdAt)),
      db.select().from(brandingEvents).orderBy(desc(brandingEvents.priority)),
      db.select().from(brandingSettings).limit(1),
    ]);
    const defaultLogo = assetRows.find((asset) => asset.id === settingsRows[0]?.defaultLogoId);

    return (
      <AdminBranding
        data={{
          ...base,
          branding: {
            assets: assetRows.map((asset) => ({
              id: asset.id,
              name: asset.name,
              type: asset.type,
              fileUrl: asset.fileUrl,
              variant: asset.variant,
              context: asset.context,
            })),
            events: eventRows.map((event) => ({
              id: event.id,
              name: event.name,
              kind: event.kind,
              status: event.status,
              priority: event.priority,
              startAt: event.startAt.toISOString(),
              endAt: event.endAt.toISOString(),
              timezone: event.timezone,
              accentColor: event.accentColor,
              announcement: event.announcement,
              heroTitle: event.heroTitle,
              heroSubtitle: event.heroSubtitle,
              particles: event.particles,
              logoUrl: assetRows.find((asset) => asset.id === event.logoAssetId)?.fileUrl ?? null,
            })),
            settings: {
              mode: settingsRows[0]?.mode ?? "auto",
              version: settingsRows[0]?.version ?? 1,
              defaultLogoUrl: defaultLogo?.fileUrl ?? null,
              tagline: settingsRows[0]?.tagline ?? brand.tagline,
            },
          },
        }}
      />
    );
  }

  if (section === "media") {
    const rows = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(60);
    return (
      <AdminMedia
        data={{
          ...base,
          media: rows.map((asset) => ({
            id: asset.id,
            name: asset.name,
            mimeType: asset.mimeType,
            sizeBytes: asset.sizeBytes,
            createdAt: asset.createdAt.toISOString(),
          })),
        }}
      />
    );
  }

  if (section === "users") {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return (
      <AdminUsers
        data={{
          ...base,
          users: rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
          })),
        }}
      />
    );
  }

  if (section === "profile") {
    return <AdminProfile user={shared.user} brand={shared.brand} />;
  }

  const [auditRows, eventRows] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40),
    db
      .select({ name: analyticsEvents.name, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.name),
  ]);

  return (
    <AdminAudit
      data={{
        ...base,
        audit: auditRows.map((row) => ({
          id: row.id,
          actorLabel: row.actorLabel,
          action: row.action,
          entity: row.entity,
          createdAt: row.createdAt.toISOString(),
          ip: row.ip,
        })),
        analytics: eventRows.map((row) => ({ name: row.name, count: Number(row.count) })),
      }}
    />
  );
}

function mapLead(lead: typeof leads.$inferSelect) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    projectType: lead.projectType,
    idea: lead.idea,
    timeline: lead.timeline,
    budget: lead.budget,
    status: lead.status,
    score: lead.score,
  };
}
