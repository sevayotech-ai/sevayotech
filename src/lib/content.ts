import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  cmsSections,
  faqs,
  services,
  siteSettings,
  technologies,
  testimonials,
  portfolioProjects,
  type CmsSection,
  type Service,
  type Technology,
  type PortfolioProject,
} from "@/db/schema";

type Faq = typeof faqs.$inferSelect;
type Testimonial = typeof testimonials.$inferSelect;

export type Section = CmsSection;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getSections(pageKey: string): Promise<Record<string, Section>> {
  return safe(async () => {
    const rows = await db.select().from(cmsSections).where(eq(cmsSections.pageKey, pageKey));
    return Object.fromEntries(rows.map((r) => [r.sectionKey, r]));
  }, {});
}

export async function getServices(): Promise<Service[]> {
  return safe(
    () =>
      db
        .select()
        .from(services)
        .where(eq(services.published, true))
        .orderBy(asc(services.sortOrder)),
    [],
  );
}

export async function getService(slug: string): Promise<Service | null> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(services)
      .where(and(eq(services.slug, slug), eq(services.published, true)))
      .limit(1);
    return rows[0] ?? null;
  }, null);
}

export async function getProjects(): Promise<PortfolioProject[]> {
  return safe(
    () =>
      db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.published, true))
        .orderBy(asc(portfolioProjects.sortOrder)),
    [],
  );
}

export async function getProject(slug: string): Promise<PortfolioProject | null> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(portfolioProjects)
      .where(and(eq(portfolioProjects.slug, slug), eq(portfolioProjects.published, true)))
      .limit(1);
    return rows[0] ?? null;
  }, null);
}

export async function getTechnologies(): Promise<Technology[]> {
  return safe(
    () =>
      db
        .select()
        .from(technologies)
        .where(eq(technologies.published, true))
        .orderBy(asc(technologies.sortOrder)),
    [],
  );
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return safe(
    () =>
      db
        .select()
        .from(testimonials)
        .where(eq(testimonials.published, true))
        .orderBy(asc(testimonials.sortOrder)),
    [],
  );
}

export async function getFaqs(): Promise<Faq[]> {
  return safe(
    () => db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sortOrder)),
    [],
  );
}

export type SiteConfig = {
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
  social: { label: string; href: string }[];
  nav: { label: string; href: string }[];
  seo: { title: string; description: string; keywords: string; canonical: string };
  stats: { label: string; value: string }[];
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  company: {
    name: "SEVAYO",
    email: "hello@sevayo.dev",
    phone: "+91 90000 00000",
    address: "Remote-first · India",
    hours: "Mon–Fri · 09:30–19:00 IST",
  },
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com" },
    { label: "GitHub", href: "https://github.com" },
    { label: "X", href: "https://x.com" },
  ],
  nav: [
    { label: "Work", href: "/work" },
    { label: "Services", href: "/services" },
    { label: "Process", href: "/process" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/contact" },
  ],
  seo: {
    title: "SEVAYO — Ideas Into Software",
    description:
      "SEVAYO is a software development and technology company that turns ideas into production-grade web, mobile, AI and cloud products.",
    keywords:
      "software development company, custom software, product engineering, AI automation, cloud devops, SEVAYO",
    canonical: "https://sevayo.dev",
  },
  stats: [
    { label: "Products shipped", value: "48" },
    { label: "Avg. delivery velocity", value: "2.4×" },
    { label: "Client retention", value: "94%" },
    { label: "Uptime managed", value: "99.98%" },
  ],
};

export async function getSiteConfig(): Promise<SiteConfig> {
  return safe(async () => {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "site")).limit(1);
    const value = rows[0]?.value as Partial<SiteConfig> | undefined;
    if (!value) return DEFAULT_SITE_CONFIG;
    return {
      company: { ...DEFAULT_SITE_CONFIG.company, ...(value.company ?? {}) },
      social: value.social?.length ? value.social : DEFAULT_SITE_CONFIG.social,
      nav: value.nav?.length ? value.nav : DEFAULT_SITE_CONFIG.nav,
      seo: { ...DEFAULT_SITE_CONFIG.seo, ...(value.seo ?? {}) },
      stats: value.stats?.length ? value.stats : DEFAULT_SITE_CONFIG.stats,
    };
  }, DEFAULT_SITE_CONFIG);
}

export function sectionText(section: Section | undefined, fallback: Partial<Section> = {}) {
  if (!section) return { eyebrow: "", title: "", subtitle: "", body: "", data: {} };
  return {
    eyebrow: section.eyebrow ?? "",
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    data: (section.data ?? {}) as Record<string, unknown>,
  };
}

export async function getHomePayload() {
  const [sections, services, projects, tech, quotes, faqList, config] = await Promise.all([
    getSections("home"),
    getServices(),
    getProjects(),
    getTechnologies(),
    getTestimonials(),
    getFaqs(),
    getSiteConfig(),
  ]);
  return { sections, services, projects, tech, quotes, faqList, config };
}

export type MailSettings = { to: string; fromName: string; enabled: boolean };

export const DEFAULT_MAIL_SETTINGS: MailSettings = {
  to: "sevayo.tech@gmail.com",
  fromName: "SEVAYO Website",
  enabled: true,
};

export async function getMailSettings(): Promise<MailSettings> {
  return safe(async () => {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "mail")).limit(1);
    const value = rows[0]?.value as Partial<MailSettings> | undefined;
    if (!value) return DEFAULT_MAIL_SETTINGS;
    return {
      to: value.to || DEFAULT_MAIL_SETTINGS.to,
      fromName: value.fromName || DEFAULT_MAIL_SETTINGS.fromName,
      enabled: value.enabled ?? true,
    };
  }, DEFAULT_MAIL_SETTINGS);
}

export async function getRecentAudit(limit = 8) {
  return safe(async () => {
    const { auditLogs } = await import("@/db/schema");
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }, []);
}
