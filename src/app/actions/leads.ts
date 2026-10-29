"use server";

import { z } from "zod";
import { db } from "@/db";
import { leads, notifications } from "@/db/schema";
import { rateLimit, recordAudit, requestMeta } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { leadEmailHtml, sendMail } from "@/lib/mailer";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name (at least 2 characters)."),
  email: z.string().trim().min(1, "Email address is required.").email("That email address doesn't look right."),
  company: z.string().trim().max(120, "Company name is too long.").optional().or(z.literal("")),
  phone: z.string().trim().max(40, "Phone number is too long.").optional().or(z.literal("")),
  projectType: z.string().min(2, "Choose what you are building."),
  idea: z
    .string()
    .trim()
    .min(20, "Please describe your idea in at least 20 characters so we can respond usefully."),
  timeline: z.string().min(2, "Choose a timeline."),
  budget: z.string().min(2, "Choose a budget range."),
});

export type LeadState = {
  ok?: boolean;
  error?: string;
  reference?: string;
  fieldErrors?: Record<string, string | undefined>;
} | null;

const SCORING: Record<string, number> = {
  asap: 25,
  "1-3-months": 20,
  "3-6-months": 12,
  flexible: 6,
  "150k+": 30,
  "75k-150k": 24,
  "25k-75k": 16,
  undecided: 5,
};

export async function submitProjectAction(_prev: LeadState, formData: FormData): Promise<LeadState> {
  await ensureSeed();

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    company: String(formData.get("company") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    projectType: String(formData.get("projectType") ?? "").trim(),
    idea: String(formData.get("idea") ?? "").trim(),
    timeline: String(formData.get("timeline") ?? "").trim(),
    budget: String(formData.get("budget") ?? "").trim(),
  };

  const parsed = leadSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string | undefined> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the highlighted fields and continue.", fieldErrors };
  }

  const { ip } = await requestMeta();
  if (!rateLimit(`lead:${ip}`, 6, 10 * 60_000)) {
    return { error: "You've submitted several briefs recently. Email hello@sevayo.dev and we'll pick it up immediately." };
  }

  const score = (SCORING[parsed.data.timeline] ?? 8) + (SCORING[parsed.data.budget] ?? 8);

  const inserted = await db
    .insert(leads)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      projectType: parsed.data.projectType,
      idea: parsed.data.idea,
      timeline: parsed.data.timeline,
      budget: parsed.data.budget,
      source: "website-wizard",
      status: "new",
      score,
    })
    .returning();

  const reference = inserted[0].id.slice(0, 8).toUpperCase();

  await db.insert(notifications).values({
    audience: "admin",
    title: `New project brief: ${parsed.data.company || parsed.data.name}`,
    body: `${parsed.data.projectType} · ${parsed.data.timeline} · ${parsed.data.budget}`,
    kind: "lead",
    href: "/admin/leads",
  });

  await recordAudit({
    action: "lead.created",
    entity: "lead",
    entityId: inserted[0].id,
    meta: { projectType: parsed.data.projectType, score },
  });

  // Email notification — recipient is managed from Admin → CMS → Notifications.
  const mail = await sendMail({
    subject: `SEVAYO brief ${reference} — ${parsed.data.company || parsed.data.name}`,
    replyTo: parsed.data.email,
    text: [
      `Name: ${parsed.data.name}`,
      `Email: ${parsed.data.email}`,
      `Company: ${parsed.data.company || "—"}`,
      `Phone: ${parsed.data.phone || "—"}`,
      `Type: ${parsed.data.projectType}`,
      `Timeline: ${parsed.data.timeline}`,
      `Budget: ${parsed.data.budget}`,
      "",
      parsed.data.idea,
    ].join("\n"),
    html: leadEmailHtml({ ...parsed.data, reference }),
  });

  await recordAudit({
    action: "lead.email",
    entity: "lead",
    entityId: inserted[0].id,
    meta: { transport: mail.transport, delivered: mail.delivered, error: mail.error ?? null },
  });

  return { ok: true, reference };
}
