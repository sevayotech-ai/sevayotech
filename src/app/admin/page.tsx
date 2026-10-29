import { redirect } from "next/navigation";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, leads, portfolioProjects, projects, services } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { resolveBrand } from "@/lib/branding";
import { AdminOverview, type AdminData } from "@/components/admin/AdminViews";
import { emptyExtras, type SharedInput } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal");

  const brand = await resolveBrand();
  const [leadRows, projectRows, eventRows, pathRows, serviceRows, portfolioRows] = await Promise.all([
    db.select().from(leads).orderBy(desc(leads.createdAt)).limit(50),
    db.select().from(projects).orderBy(desc(projects.createdAt)).limit(50),
    db
      .select({ name: analyticsEvents.name, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.name),
    db
      .select({ path: analyticsEvents.path, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
    db.select().from(services),
    db.select().from(portfolioProjects),
  ]);


  const data = {
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
    stats: [
      { label: "Leads", value: String(leadRows.length) },
      { label: "Projects", value: String(projectRows.length) },
      { label: "Services live", value: String(serviceRows.filter((s) => s.published).length) },
      { label: "Case studies", value: String(portfolioRows.filter((p) => p.published).length) },
    ],
    analytics: eventRows.map((row) => ({ name: row.name, count: Number(row.count) })),
    popular: pathRows.map((row) => ({ path: row.path, count: Number(row.count) })),
    leads: leadRows.map((lead) => ({
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
    })),
    projects: projectRows.map((project) => ({
      id: project.id,
      name: project.name,
      stage: project.stage,
      status: project.status,
      progress: project.progress,
      health: project.health,
    })),
    branding: {
      assets: [],
      events: [],
      settings: { mode: brand.mode, version: brand.version, defaultLogoUrl: brand.standard.logoUrl, tagline: brand.tagline },
    },
  };

  return <AdminOverview data={{ ...emptyExtras(), ...data }} />;
}
