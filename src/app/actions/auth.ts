"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { clients, notifications, users } from "@/db/schema";
import {
  clearSessionCookie,
  hashPassword,
  rateLimit,
  recordAudit,
  requestMeta,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeed } from "@/db/seed";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Tell us your name"),
  company: z.string().optional(),
});

export type AuthState = { error?: string; ok?: boolean } | null;

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  await ensureSeed();
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    remember: formData.get("remember") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const { ip } = await requestMeta();
  if (!rateLimit(`login:${ip}`, 8, 60_000)) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    await recordAudit({ action: "auth.login.failed", entity: "user", meta: { email: parsed.data.email } });
    return { error: "Those credentials don't match our records." };
  }
  if (user.status !== "active") {
    return { error: "This account is suspended. Contact your SEVAYO lead." };
  }

  await setSessionCookie(user, parsed.data.remember);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await recordAudit({ actorId: user.id, actorLabel: user.email, action: "auth.login", entity: "user", entityId: user.id });

  redirect(user.role === "admin" ? "/admin" : "/portal");
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  await ensureSeed();
  const parsed = registerSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    remember: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const { ip } = await requestMeta();
  if (!rateLimit(`register:${ip}`, 6, 60_000)) {
    return { error: "Too many attempts. Please wait a minute." };
  }

  const existing = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing[0]) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  const created = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      name: parsed.data.name,
      role: "client",
      company: parsed.data.company || null,
    })
    .returning();

  await db.insert(clients).values({ userId: created[0].id, company: parsed.data.company || null });
  await db.insert(notifications).values({
    userId: created[0].id,
    title: "Welcome to SEVAYO",
    body: "Your client workspace is ready. Add your first idea to get started.",
    kind: "success",
    href: "/portal/ideas",
  });
  await db.insert(notifications).values({
    audience: "admin",
    title: "New client registered",
    body: `${parsed.data.name}${parsed.data.company ? ` · ${parsed.data.company}` : ""} (${parsed.data.email})`,
    kind: "info",
    href: "/admin/users",
  });

  await setSessionCookie(created[0], true);
  await recordAudit({
    actorId: created[0].id,
    actorLabel: created[0].email,
    action: "auth.register",
    entity: "user",
    entityId: created[0].id,
  });

  redirect("/portal");
}

export async function logoutAction() {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  await clearSessionCookie();
  if (user) {
    await recordAudit({ actorId: user.id, actorLabel: user.email, action: "auth.logout", entity: "user", entityId: user.id });
  }
  redirect("/");
}
