import "server-only";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  cmsSections,
  faqs,
  portfolioProjects,
  services,
  technologies,
  testimonials,
} from "@/db/schema";
import { getMailSettings, getSiteConfig } from "@/lib/content";
import type { AdminData } from "@/components/admin/AdminViews";

export type SharedInput = {
  user: { name: string; email: string; role: string };
  brand: AdminData["brand"];
};

type Shared = SharedInput;

export function emptyExtras() {
  return {
    stats: [],
    analytics: [],
    popular: [],
    leads: [],
    projects: [],
    sections: [],
    services: [],
    portfolio: [],
    faqs: [],
    testimonials: [],
    technologies: [],
    announcements: [],
    journeys: { idea: [], process: [] },
    media: [],
    users: [],
    audit: [] as AdminData["audit"],
    branding: { assets: [], events: [], settings: { mode: "auto", version: 1, defaultLogoUrl: null, tagline: "" } },
    site: {
      company: { name: "SEVAYO", email: "", phone: "", address: "", hours: "" },
      social: [],
      nav: [],
      seo: { title: "", description: "", keywords: "", canonical: "" },
    },
    mail: { to: "sevayo.tech@gmail.com", fromName: "SEVAYO Website", enabled: true },
  };
}

/** Loads every editable collection in one shot for the CMS screen. */
export async function loadCmsData(shared: Shared): Promise<AdminData> {
  const [sectionRows, serviceRows, portfolioRows, faqRows, testimonialRows, techRows, announcementRows, site, mail] =
    await Promise.all([
      db.select().from(cmsSections).orderBy(asc(cmsSections.pageKey), asc(cmsSections.sortOrder)),
      db.select().from(services).orderBy(asc(services.sortOrder)),
      db.select().from(portfolioProjects).orderBy(asc(portfolioProjects.sortOrder)),
      db.select().from(faqs).orderBy(asc(faqs.sortOrder)),
      db.select().from(testimonials).orderBy(asc(testimonials.sortOrder)),
      db.select().from(technologies).orderBy(asc(technologies.sortOrder)),
      db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(20),
      getSiteConfig(),
      getMailSettings(),
    ]);

  const ideaRow = sectionRows.find((row) => row.pageKey === "home" && row.sectionKey === "idea");
  const processRow = sectionRows.find((row) => row.pageKey === "home" && row.sectionKey === "process");
  const ideaData = (ideaRow?.data ?? {}) as { stages?: { label: string; detail: string }[] };
  const processData = (processRow?.data ?? {}) as { stages?: { title: string; detail: string }[] };

  return {
    ...shared,
    ...emptyExtras(),
    sections: sectionRows.map((row) => ({
      id: row.id,
      pageKey: row.pageKey,
      sectionKey: row.sectionKey,
      eyebrow: row.eyebrow ?? "",
      title: row.title,
      subtitle: row.subtitle,
      body: row.body,
    })),
    services: serviceRows.map((row) => ({
      id: row.id,
      title: row.title,
      tagline: row.tagline,
      description: row.description,
      accent: row.accent,
      shape: row.shape,
      published: row.published,
      capabilities: row.capabilities,
      technologies: row.technologies,
      benefits: row.benefits,
      process: row.process,
      engagement: row.engagement,
    })),
    portfolio: portfolioRows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      category: row.category,
      year: row.year,
      accent: row.accent,
      heroMediaUrl: row.heroMediaUrl,
      published: row.published,
      technologies: row.technologies,
      problem: row.problem,
      solution: row.solution,
      architecture: row.architecture,
      screens: row.screens,
      outcome: row.outcome,
    })),
    faqs: faqRows.map((row) => ({ id: row.id, question: row.question, answer: row.answer })),
    testimonials: testimonialRows.map((row) => ({
      id: row.id,
      quote: row.quote,
      author: row.author,
      role: row.role,
      company: row.company,
    })),
    technologies: techRows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      color: row.color,
      orbit: row.orbit,
    })),
    announcements: announcementRows
      .filter((row) => row.active)
      .map((row) => ({ id: row.id, message: row.message })),
    journeys: {
      idea: ideaData.stages ?? [],
      process: processData.stages ?? [],
    },
    site: { company: site.company, social: site.social, nav: site.nav, seo: site.seo },
    mail,
  };
}
