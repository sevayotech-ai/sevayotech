"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  announcements,
  brandAssets,
  brandingAudit,
  brandingEvents,
  brandingSettings,
  cmsSections,
  faqs,
  leads,
  testimonials,
  technologies,
  mediaAssets,
  portfolioProjects,
  services,
  siteSettings,
  users,
} from "@/db/schema";
import {
  assertPermission,
  hashPassword,
  rateLimit,
  recordAudit,
  requestMeta,
  requireUser,
  type SessionUser,
} from "@/lib/auth";
import { invalidateBrandCache } from "@/lib/branding";
import { DEFAULT_MAIL } from "@/lib/mailer";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

const ALLOWED_IMAGE = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX_UPLOAD = 3 * 1024 * 1024;

/** SVG sanitiser — removes scripts, event handlers and external references. */
function sanitizeSvg(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<\s*i?frame[^>]*>/gi, "")
    .replace(/xlink:href\s*=\s*"(?!#)[^"]*"/gi, 'xlink:href="#"');
}

async function storeUpload(file: File, folder: string, actor: SessionUser | null) {
  if (!ALLOWED_IMAGE.includes(file.type)) throw new Error("Unsupported file type. Use PNG, JPEG, WEBP, GIF or SVG.");
  if (file.size > MAX_UPLOAD) throw new Error("File is larger than 3 MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  let data = buffer.toString("base64");
  if (file.type === "image/svg+xml") {
    const text = buffer.toString("utf8");
    if (/<script/i.test(text)) throw new Error("SVG contains a script tag and was rejected.");
    data = Buffer.from(sanitizeSvg(text)).toString("base64");
  }

  const inserted = await db
    .insert(mediaAssets)
    .values({
      name: file.name.slice(0, 120),
      mimeType: file.type,
      sizeBytes: file.size,
      data,
      folder,
      createdBy: actor?.id ?? null,
    })
    .returning();

  return inserted[0];
}

/* ------------------------------ CMS ------------------------------ */

export async function updateSectionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing section id" };

    await db
      .update(cmsSections)
      .set({
        eyebrow: String(formData.get("eyebrow") ?? ""),
        title: String(formData.get("title") ?? ""),
        subtitle: String(formData.get("subtitle") ?? ""),
        body: String(formData.get("body") ?? ""),
        updatedAt: new Date(),
      })
      .where(eq(cmsSections.id, id));

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "cms.section.updated", entity: "cms_section", entityId: id });
    revalidatePath("/", "layout");
    return { ok: true, message: "Section published." };
  } catch {
    return { error: "Could not save this section." };
  }
}

export async function updateSiteSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("settings.manage");
    const value = {
      company: {
        name: String(formData.get("companyName") ?? "SEVAYO"),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? ""),
        hours: String(formData.get("hours") ?? ""),
      },
      social: String(formData.get("social") ?? "")
        .split("\n")
        .map((line) => line.split("|").map((part) => part.trim()))
        .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
        .map((parts) => ({ label: parts[0], href: parts[1] })),
      nav: String(formData.get("nav") ?? "")
        .split("\n")
        .map((line) => line.split("|").map((part) => part.trim()))
        .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
        .map((parts) => ({ label: parts[0], href: parts[1] })),
      seo: {
        title: String(formData.get("seoTitle") ?? ""),
        description: String(formData.get("seoDescription") ?? ""),
        keywords: String(formData.get("seoKeywords") ?? ""),
        canonical: String(formData.get("canonical") ?? ""),
      },
      stats: String(formData.get("stats") ?? "")
        .split("\n")
        .map((line) => line.split("|").map((part) => part.trim()))
        .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
        .map((parts) => ({ label: parts[0], value: parts[1] })),
    };

    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, "site")).limit(1);
    if (existing[0]) {
      await db.update(siteSettings).set({ value, updatedAt: new Date(), updatedBy: actor.id }).where(eq(siteSettings.id, existing[0].id));
    } else {
      await db.insert(siteSettings).values({ key: "site", value, updatedBy: actor.id });
    }

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "settings.updated", entity: "site_settings" });
    revalidatePath("/", "layout");
    return { ok: true, message: "Site settings published." };
  } catch {
    return { error: "Could not save site settings." };
  }
}

/* ------------------------------ Services / portfolio ------------------------------ */

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

type Pair = { label: string; detail: string };

const pairs = (value: string, split = "|"): Pair[] =>
  value
    .split("\n")
    .map((line) => line.split(split).map((part) => part.trim()))
    .filter((parts) => parts.filter(Boolean).length >= 2)
    .map((parts) => ({ label: parts[0], detail: parts[1] }));

const toSteps = (value: string) => pairs(value).map((p) => ({ title: p.label, detail: p.detail }));
const toMetrics = (value: string) => pairs(value, ":").map((p) => ({ label: p.label, value: p.detail }));
const toLayers = (value: string) => pairs(value).map((p) => ({ layer: p.label, detail: p.detail }));

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function updateServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing service id" };
    await db
      .update(services)
      .set({
        title: String(formData.get("title") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        description: String(formData.get("description") ?? ""),
        accent: String(formData.get("accent") ?? "#2e9bff"),
        shape: String(formData.get("shape") ?? "browser"),
        capabilities: lines(String(formData.get("capabilities") ?? "")),
        technologies: lines(String(formData.get("technologies") ?? "")),
        benefits: lines(String(formData.get("benefits") ?? "")),
        process: toSteps(String(formData.get("process"))),
        engagement: toMetrics(String(formData.get("engagement"))),
        published: formData.get("published") === "on",
        updatedAt: new Date(),
      })
      .where(eq(services.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "service.updated", entity: "service", entityId: id });
    invalidateBrandCache();
    revalidatePath("/services");
    revalidatePath(`/services`);
    revalidatePath("/", "layout");
    return { ok: true, message: "Service published." };
  } catch {
    return { error: "Could not update service." };
  }
}

export async function createServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const title = String(formData.get("title") ?? "").trim();
    if (title.length < 2) return { error: "Service title is required." };
    const slug = slugify(String(formData.get("slug") ?? "") || title);
    const existing = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
    if (existing[0]) return { error: "A service with that URL already exists." };

    const inserted = await db
      .insert(services)
      .values({
        slug,
        title,
        tagline: String(formData.get("tagline") ?? ""),
        description: String(formData.get("description") ?? ""),
        shape: String(formData.get("shape") ?? "modules"),
        accent: String(formData.get("accent") ?? "#2e9bff"),
        capabilities: lines(String(formData.get("capabilities") ?? "")),
        technologies: lines(String(formData.get("technologies") ?? "")),
        sortOrder: 99,
        published: true,
      })
      .returning();

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "service.created", entity: "service", entityId: inserted[0].id });
    revalidatePath("/services");
    revalidatePath("/", "layout");
    return { ok: true, message: `${title} created.` };
  } catch {
    return { error: "Could not create the service." };
  }
}

export async function deleteServiceAction(formData: FormData) {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await db.delete(services).where(eq(services.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "service.deleted", entity: "service", entityId: id });
    revalidatePath("/services");
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

export async function updateProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing project id" };
    await db
      .update(portfolioProjects)
      .set({
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        category: String(formData.get("category") ?? "Platform"),
        heroMediaUrl: String(formData.get("heroMediaUrl") ?? "") || null,
        accent: String(formData.get("accent") ?? "#2e9bff"),
        year: String(formData.get("year") ?? String(new Date().getFullYear())),
        technologies: lines(String(formData.get("technologies") ?? "")),
        problem: String(formData.get("problem") ?? ""),
        solution: String(formData.get("solution") ?? ""),
        architecture: toLayers(String(formData.get("architecture"))),
        screens: pairs(String(formData.get("screens"))),
        outcome: toMetrics(String(formData.get("outcome"))),
        published: formData.get("published") === "on",
        updatedAt: new Date(),
      })
      .where(eq(portfolioProjects.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "portfolio.updated", entity: "portfolio_project", entityId: id });
    revalidatePath("/work");
    revalidatePath("/", "layout");
    return { ok: true, message: "Case study published." };
  } catch {
    return { error: "Could not update case study." };
  }
}

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const title = String(formData.get("title") ?? "").trim();
    if (title.length < 2) return { error: "Project title is required." };
    const slug = slugify(String(formData.get("slug") ?? "") || title);
    const existing = await db.select().from(portfolioProjects).where(eq(portfolioProjects.slug, slug)).limit(1);
    if (existing[0]) return { error: "A case study with that URL already exists." };

    const inserted = await db
      .insert(portfolioProjects)
      .values({
        slug,
        title,
        category: String(formData.get("category") ?? "Platform"),
        summary: String(formData.get("summary") ?? ""),
        heroMediaUrl: String(formData.get("heroMediaUrl") ?? "") || null,
        accent: String(formData.get("accent") ?? "#2e9bff"),
        technologies: lines(String(formData.get("technologies") ?? "")),
        problem: String(formData.get("problem") ?? ""),
        solution: String(formData.get("solution") ?? ""),
        outcome: toMetrics(String(formData.get("outcome") ?? "Impact: Pending")),
        year: String(formData.get("year") ?? String(new Date().getFullYear())),
        sortOrder: 99,
        published: true,
      })
      .returning();

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "portfolio.created", entity: "portfolio_project", entityId: inserted[0].id });
    revalidatePath("/work");
    revalidatePath("/", "layout");
    return { ok: true, message: `${title} added to the portfolio.` };
  } catch {
    return { error: "Could not add the case study." };
  }
}

export async function deleteProjectAction(formData: FormData) {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await db.delete(portfolioProjects).where(eq(portfolioProjects.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "portfolio.deleted", entity: "portfolio_project", entityId: id });
    revalidatePath("/work");
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

/* ------------------------------ FAQ + testimonials ------------------------------ */

export async function upsertFaqAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    const question = String(formData.get("question") ?? "").trim();
    const answer = String(formData.get("answer") ?? "").trim();
    if (question.length < 4) return { error: "Question is too short." };
    if (answer.length < 4) return { error: "Answer is too short." };

    if (id) {
      await db.update(faqs).set({ question, answer }).where(eq(faqs.id, id));
    } else {
      await db.insert(faqs).values({ question, answer, sortOrder: 99 });
    }
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: id ? "faq.updated" : "faq.created", entity: "faq", entityId: id || undefined });
    revalidatePath("/", "layout");
    return { ok: true, message: "FAQ saved." };
  } catch {
    return { error: "Could not save the FAQ." };
  }
}

export async function deleteFaqAction(formData: FormData) {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await db.delete(faqs).where(eq(faqs.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "faq.deleted", entity: "faq", entityId: id });
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

export async function upsertTestimonialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    const quote = String(formData.get("quote") ?? "").trim();
    const author = String(formData.get("author") ?? "").trim();
    if (quote.length < 8) return { error: "Quote is too short." };
    if (author.length < 2) return { error: "Author is required." };

    const values = {
      quote,
      author,
      role: String(formData.get("role") ?? ""),
      company: String(formData.get("company") ?? ""),
    };

    if (id) {
      await db.update(testimonials).set(values).where(eq(testimonials.id, id));
    } else {
      await db.insert(testimonials).values({ ...values, sortOrder: 99 });
    }
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: id ? "testimonial.updated" : "testimonial.created", entity: "testimonial", entityId: id || undefined });
    revalidatePath("/", "layout");
    return { ok: true, message: "Testimonial saved." };
  } catch {
    return { error: "Could not save the testimonial." };
  }
}

export async function deleteTestimonialAction(formData: FormData) {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await db.delete(testimonials).where(eq(testimonials.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "testimonial.deleted", entity: "testimonial", entityId: id });
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

/* ------------------------------ Journeys (idea pipeline + process path) ------------------------------ */

export async function updateJourneyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const sectionKey = String(formData.get("sectionKey") ?? "");
    if (!["idea", "process"].includes(sectionKey)) return { error: "Unknown journey." };

    const detailField = sectionKey === "idea" ? "label" : "title";
    const stages = String(formData.get("stages") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [head, ...rest] = line.split("|");
        return { [detailField]: head.trim(), detail: rest.join("|").trim() };
      })
      .filter((stage) => stage[detailField as "label" | "title"]);

    if (stages.length < 2) return { error: "Add at least two stages." };

    await db
      .update(cmsSections)
      .set({ data: { stages }, updatedAt: new Date() })
      .where(and(eq(cmsSections.pageKey, "home"), eq(cmsSections.sectionKey, sectionKey)));

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "journey.updated", entity: "cms_section", entityId: sectionKey, meta: { count: stages.length } });
    revalidatePath("/", "layout");
    revalidatePath("/process");
    return { ok: true, message: `${stages.length} stages published.` };
  } catch {
    return { error: "Could not save the journey." };
  }
}

/* ------------------------------ Technology ecosystem ------------------------------ */

export async function upsertTechnologyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) return { error: "Technology name is required." };
    const values = {
      name,
      category: String(formData.get("category") ?? "Core"),
      description: String(formData.get("description") ?? ""),
      color: String(formData.get("color") ?? "#2e9bff"),
      orbit: Math.max(1, Math.min(4, Number(formData.get("orbit") ?? 1))),
    };
    if (id) {
      await db.update(technologies).set(values).where(eq(technologies.id, id));
    } else {
      await db.insert(technologies).values({ ...values, sortOrder: 99 });
    }
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: id ? "technology.updated" : "technology.created", entity: "technology", entityId: id || undefined });
    revalidatePath("/", "layout");
    return { ok: true, message: `${name} saved.` };
  } catch {
    return { error: "Could not save the technology." };
  }
}

export async function deleteTechnologyAction(formData: FormData) {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await db.delete(technologies).where(eq(technologies.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "technology.deleted", entity: "technology", entityId: id });
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

/* ------------------------------ Notifications / mail ------------------------------ */

export async function updateMailSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("settings.manage");
    const value = {
      to: String(formData.get("to") ?? DEFAULT_MAIL.to).trim() || DEFAULT_MAIL.to,
      fromName: String(formData.get("fromName") ?? DEFAULT_MAIL.fromName).trim() || DEFAULT_MAIL.fromName,
      enabled: formData.get("enabled") === "on",
    };

    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, "mail")).limit(1);
    if (existing[0]) {
      await db.update(siteSettings).set({ value, updatedAt: new Date(), updatedBy: actor.id }).where(eq(siteSettings.id, existing[0].id));
    } else {
      await db.insert(siteSettings).values({ key: "mail", value, updatedBy: actor.id });
    }

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "mail.settings.updated", entity: "site_settings", meta: value });
    revalidatePath("/admin/content");
    return { ok: true, message: `Notifications now deliver to ${value.to}.` };
  } catch {
    return { error: "Could not save notification settings." };
  }
}

export async function deleteAnnouncementAction(formData: FormData) {
  try {
    const actor = await assertPermission("cms.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await db.delete(announcements).where(eq(announcements.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "announcement.deleted", entity: "announcement", entityId: id });
    invalidateBrandCache();
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

/* ------------------------------ Branding ------------------------------ */

export async function uploadBrandAssetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("branding.manage");
    if (!rateLimit(`upload:${actor.id}`, 20, 60_000)) return { error: "Too many uploads. Wait a moment." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

    const type = String(formData.get("type") ?? "logo");
    const name = String(formData.get("name") ?? file.name).slice(0, 120);

    const media = await storeUpload(file, "brand", actor);
    const fileUrl = `/api/media/${media.id}`;

    const inserted = await db
      .insert(brandAssets)
      .values({
        name,
        type,
        variant: String(formData.get("variant") ?? "dark"),
        context: String(formData.get("context") ?? "standard"),
        fileUrl,
        thumbnailUrl: fileUrl,
        metadata: { accent: String(formData.get("accent") ?? "#2e9bff"), mimeType: file.type },
        createdBy: actor.id,
      })
      .returning();

    void type;

    await db.insert(brandingAudit).values({
      actorId: actor.id,
      actorLabel: actor.email,
      action: "asset.uploaded",
      next: { id: inserted[0].id, name, type, fileUrl },
    });
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "brand.asset.uploaded", entity: "brand_asset", entityId: inserted[0].id });

    invalidateBrandCache();
    revalidatePath("/admin/branding");
    revalidatePath("/", "layout");
    return { ok: true, message: `${name} uploaded.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function setBrandingModeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("branding.manage");
    const mode = String(formData.get("mode") ?? "auto");
    const activeLogoId = String(formData.get("activeLogoId") ?? "") || null;

    const before = (await db.select().from(brandingSettings).limit(1))[0];
    const current = before ?? (await db.insert(brandingSettings).values({}).returning())[0];

    await db
      .update(brandingSettings)
      .set({
        mode: mode === "manual" ? "manual" : "auto",
        activeLogoId: mode === "manual" ? activeLogoId : null,
        version: current.version + 1,
        updatedBy: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(brandingSettings.id, current.id));

    await db.insert(brandingAudit).values({
      actorId: actor.id,
      actorLabel: actor.email,
      action: "branding.mode.changed",
      eventId: activeLogoId,
      previous: { mode: current.mode, activeLogoId: current.activeLogoId },
      next: { mode, activeLogoId },
    });
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "branding.mode.changed", entity: "branding_settings", meta: { mode } });

    invalidateBrandCache();
    revalidatePath("/", "layout");
    return { ok: true, message: mode === "manual" ? "Manual override active." : "Automatic branding restored." };
  } catch {
    return { error: "Could not change branding mode." };
  }
}

const eventSchema = z.object({
  name: z.string().min(2, "Event name is required"),
  kind: z.string().min(2),
  startAt: z.string().min(4, "Start date required"),
  endAt: z.string().min(4, "End date required"),
  timezone: z.string().min(2),
  priority: z.coerce.number().int().min(1).max(100),
  accentColor: z.string().optional(),
  announcement: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  particles: z.string().optional(),
});

export async function createBrandingEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("events.manage");
    const parsed = eventSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      kind: String(formData.get("kind") ?? "custom"),
      startAt: String(formData.get("startAt") ?? ""),
      endAt: String(formData.get("endAt") ?? ""),
      timezone: String(formData.get("timezone") ?? "Asia/Kolkata"),
      priority: Number(formData.get("priority") ?? 10),
      accentColor: String(formData.get("accentColor") ?? "") || undefined,
      announcement: String(formData.get("announcement") ?? "") || undefined,
      heroTitle: String(formData.get("heroTitle") ?? "") || undefined,
      heroSubtitle: String(formData.get("heroSubtitle") ?? "") || undefined,
      particles: String(formData.get("particles") ?? "default"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid event" };

    const logoAssetId = String(formData.get("logoAssetId") ?? "") || null;
    const slugBase = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const inserted = await db
      .insert(brandingEvents)
      .values({
        name: parsed.data.name,
        slug: `${slugBase}-${Date.now().toString(36)}`,
        description: String(formData.get("description") ?? ""),
        kind: parsed.data.kind,
        logoAssetId,
        faviconAssetId: logoAssetId,
        accentColor: parsed.data.accentColor ?? null,
        announcement: parsed.data.announcement ?? null,
        heroTitle: parsed.data.heroTitle ?? null,
        heroSubtitle: parsed.data.heroSubtitle ?? null,
        particles: parsed.data.particles ?? "default",
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        timezone: parsed.data.timezone,
        priority: parsed.data.priority,
        status: "scheduled",
        createdBy: actor.id,
      })
      .returning();

    await db.insert(brandingAudit).values({
      actorId: actor.id,
      actorLabel: actor.email,
      action: "event.created",
      eventId: inserted[0].id,
      next: { name: parsed.data.name, startAt: parsed.data.startAt, endAt: parsed.data.endAt },
    });
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "branding.event.created", entity: "branding_event", entityId: inserted[0].id });

    invalidateBrandCache();
    revalidatePath("/admin/branding");
    revalidatePath("/", "layout");
    return { ok: true, message: `${parsed.data.name} scheduled.` };
  } catch {
    return { error: "Could not create the event." };
  }
}

export async function setEventStatusAction(formData: FormData) {
  try {
    const actor = await assertPermission("events.manage");
    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "scheduled");
    if (!id || !["draft", "scheduled", "active", "expired", "disabled"].includes(status)) return;

    await db.update(brandingEvents).set({ status, updatedAt: new Date() }).where(eq(brandingEvents.id, id));
    await db.insert(brandingAudit).values({
      actorId: actor.id,
      actorLabel: actor.email,
      action: "event.status",
      eventId: id,
      next: { status },
    });
    invalidateBrandCache();
    revalidatePath("/admin/branding");
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

export async function deleteBrandingEventAction(formData: FormData) {
  try {
    const actor = await assertPermission("events.manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await db.delete(brandingEvents).where(eq(brandingEvents.id, id));
    await db.insert(brandingAudit).values({ actorId: actor.id, actorLabel: actor.email, action: "event.deleted", eventId: id });
    invalidateBrandCache();
    revalidatePath("/admin/branding");
    revalidatePath("/", "layout");
  } catch {
    /* ignored */
  }
}

/* ------------------------------ Operations ------------------------------ */

export async function updateLeadAction(formData: FormData) {
  try {
    const actor = await assertPermission("leads.manage");
    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "new");
    const notes = String(formData.get("notes") ?? "");
    if (!id) return;
    await db.update(leads).set({ status, notes }).where(eq(leads.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "lead.updated", entity: "lead", entityId: id, meta: { status } });
    revalidatePath("/admin/leads");
  } catch {
    /* ignored */
  }
}

export async function createTeamUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("users.manage");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const name = String(formData.get("name") ?? "").trim();
    const role = String(formData.get("role") ?? "client");
    const password = String(formData.get("password") ?? "");
    if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email" };
    if (password.length < 8) return { error: "Password must be at least 8 characters" };
    if (name.length < 2) return { error: "Name is too short" };

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) return { error: "That email already exists." };

    await db.insert(users).values({
      email,
      name,
      role: role === "admin" ? "admin" : "client",
      passwordHash: hashPassword(password),
      company: String(formData.get("company") ?? "") || null,
    });

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "user.created", entity: "user", meta: { email, role } });
    revalidatePath("/admin/users");
    return { ok: true, message: `${name} added.` };
  } catch {
    return { error: "Could not create the user." };
  }
}

export async function setUserRoleAction(formData: FormData) {
  try {
    const actor = await assertPermission("users.manage");
    const id = String(formData.get("id") ?? "");
    const role = String(formData.get("role") ?? "client");
    if (!id || !["admin", "client"].includes(role)) return;
    if (id === actor.id) return;
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "user.role", entity: "user", entityId: id, meta: { role } });
    revalidatePath("/admin/users");
  } catch {
    /* ignored */
  }
}

export async function createAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("cms.manage");
    const message = String(formData.get("message") ?? "").trim();
    if (message.length < 6) return { error: "Message is too short" };
    await db.insert(announcements).values({
      message,
      href: String(formData.get("href") ?? "") || null,
      active: true,
    });
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "announcement.created", entity: "announcement" });
    invalidateBrandCache();
    revalidatePath("/", "layout");
    return { ok: true, message: "Announcement live." };
  } catch {
    return { error: "Could not publish the announcement." };
  }
}

export async function uploadMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await assertPermission("media.manage");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };
    const media = await storeUpload(file, "library", actor);
    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "media.uploaded", entity: "media", entityId: media.id });
    revalidatePath("/admin/media");
    return { ok: true, message: `${media.name} stored.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function updateAdminProfileAction(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string } | null> {
  try {
    const actor = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) return { error: "Name is too short." };
    const password = String(formData.get("password") ?? "");
    if (password && password.length < 8) return { error: "Password must be at least 8 characters." };

    await db
      .update(users)
      .set({
        name,
        company: String(formData.get("company") ?? "") || null,
        jobTitle: String(formData.get("jobTitle") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, actor.id));

    await recordAudit({ actorId: actor.id, actorLabel: actor.email, action: "admin.profile.updated", entity: "user", entityId: actor.id });
    revalidatePath("/admin/profile");
    return { ok: true };
  } catch {
    return { error: "Could not update your profile." };
  }
}

export async function requestMetaInfo() {
  return requestMeta();
}
