import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { DEFAULT_MAIL_SETTINGS } from "@/lib/content";

export type MailConfig = {
  to: string;
  fromName: string;
  enabled: boolean;
};

/** Recipient is database-driven so it can be changed from the admin panel. */
export const DEFAULT_MAIL: MailConfig = DEFAULT_MAIL_SETTINGS;

export async function getMailConfig(): Promise<MailConfig> {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "mail")).limit(1);
    const value = rows[0]?.value as Partial<MailConfig> | undefined;
    if (!value) return DEFAULT_MAIL;
    return {
      to: value.to || DEFAULT_MAIL.to,
      fromName: value.fromName || DEFAULT_MAIL.fromName,
      enabled: value.enabled ?? true,
    };
  } catch {
    return DEFAULT_MAIL;
  }
}

export type MailResult = { delivered: boolean; transport: "smtp" | "logged"; error?: string };

/**
 * Sends an email through SMTP when credentials are present in the environment,
 * otherwise falls back to a durable structured log so nothing is lost and the
 * integration point stays obvious.
 *
 * Required env for real delivery:
 *   SEVAYO_SMTP_HOST, SEVAYO_SMTP_PORT, SEVAYO_SMTP_USER, SEVAYO_SMTP_PASS
 */
export async function sendMail(input: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<MailResult> {
  const config = await getMailConfig();
  if (!config.enabled) return { delivered: false, transport: "logged", error: "mail disabled in settings" };

  const host = process.env.SEVAYO_SMTP_HOST;
  const user = process.env.SEVAYO_SMTP_USER;
  const pass = process.env.SEVAYO_SMTP_PASS;
  const port = Number(process.env.SEVAYO_SMTP_PORT ?? 587);

  if (!host || !user || !pass) {
    console.info(
      `[sevayo:mail] SMTP not configured — message queued for ${config.to}\n` +
        `subject: ${input.subject}\n${input.text}`,
    );
    return { delivered: false, transport: "logged" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${user}>`,
      to: config.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { delivered: true, transport: "smtp" };
  } catch (error) {
    console.error("[sevayo:mail] delivery failed", error);
    return {
      delivered: false,
      transport: "logged",
      error: error instanceof Error ? error.message : "unknown mail error",
    };
  }
}

export function leadEmailHtml(data: {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  projectType: string;
  idea: string;
  timeline: string;
  budget: string;
  reference: string;
}) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#0b1020;font-size:14px">${value}</td></tr>`;

  return `<div style="font-family:Inter,system-ui,sans-serif;background:#f6f7fb;padding:28px">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e6e9f2">
      <div style="background:linear-gradient(120deg,#35d6ff,#2e9bff 55%,#9b5cff);padding:22px 26px">
        <h1 style="margin:0;color:#04050a;font-size:19px;letter-spacing:-.02em">New project brief · ${data.reference}</h1>
        <p style="margin:6px 0 0;color:#04050a;opacity:.72;font-size:13px">Submitted from sevayo.tech</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${row("Name", data.name)}
        ${row("Email", `<a href="mailto:${data.email}">${data.email}</a>`)}
        ${row("Company", data.company || "—")}
        ${row("Phone", data.phone || "—")}
        ${row("Project type", data.projectType)}
        ${row("Timeline", data.timeline)}
        ${row("Budget", data.budget)}
      </table>
      <div style="padding:20px 26px 26px">
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Idea</p>
        <p style="margin:0;color:#0b1020;font-size:14px;line-height:1.65;white-space:pre-line">${data.idea}</p>
      </div>
    </div>
  </div>`;
}
