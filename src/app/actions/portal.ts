"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ideas, messages, notifications, requirements, users } from "@/db/schema";
import { hashPassword, rateLimit, recordAudit, requireUser, type SessionUser } from "@/lib/auth";

const ideaSchema = z.object({
  title: z.string().min(4, "Give the idea a short title"),
  description: z.string().min(10, "Add a little more detail"),
});

const messageSchema = z.object({ body: z.string().min(2, "Write a message"), projectId: z.string().uuid().optional() });

async function clientGuard(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "client" && user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export async function createIdeaAction(_prev: { error?: string } | null, formData: FormData) {
  try {
    const user = await clientGuard();
    const parsed = ideaSchema.safeParse({
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid idea" };
    if (!rateLimit(`idea:${user.id}`, 10, 60_000)) return { error: "Slow down a moment." };

    await db.insert(ideas).values({
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      status: "captured",
    });
    await db.insert(notifications).values({
      audience: "admin",
      title: "New client idea captured",
      body: `${user.name}: ${parsed.data.title}`,
      kind: "idea",
      href: "/admin/ideas",
    });
    await recordAudit({ actorId: user.id, actorLabel: user.email, action: "idea.created", entity: "idea" });
    revalidatePath("/portal/ideas");
    revalidatePath("/portal");
    return { error: undefined };
  } catch {
    return { error: "Could not save your idea. Please try again." };
  }
}

export async function sendMessageAction(_prev: { error?: string } | null, formData: FormData) {
  try {
    const user = await clientGuard();
    const parsed = messageSchema.safeParse({
      body: String(formData.get("body") ?? "").trim(),
      projectId: String(formData.get("projectId") ?? "") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message" };

    await db.insert(messages).values({
      projectId: parsed.data.projectId ?? null,
      authorId: user.id,
      authorLabel: user.name,
      audience: "admin",
      body: parsed.data.body,
    });
    await db.insert(notifications).values({
      audience: "admin",
      title: "New client message",
      body: `${user.name}: ${parsed.data.body.slice(0, 80)}`,
      kind: "message",
      href: "/admin/messages",
    });
    revalidatePath("/portal/messages");
    return { error: undefined };
  } catch {
    return { error: "Message failed to send." };
  }
}

export async function updateRequirementStatusAction(formData: FormData) {
  const user = await clientGuard();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "proposed");
  if (!id) return;
  const allowed = ["proposed", "agreed", "building", "done"];
  if (!allowed.includes(status)) return;

  await db
    .update(requirements)
    .set({ status })
    .where(and(eq(requirements.id, id), eq(requirements.status, "proposed")));
  await recordAudit({ actorId: user.id, actorLabel: user.email, action: "requirement.status", entity: "requirement", entityId: id, meta: { status } });
  revalidatePath("/portal/requirements");
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, user.id));
  revalidatePath("/portal/notifications");
  revalidatePath("/portal");
}

export async function updateProfileAction(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  try {
    const user = await clientGuard();
    const name = String(formData.get("name") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const jobTitle = String(formData.get("jobTitle") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (name.length < 2) return { error: "Name is too short" };
    if (password && password.length < 8) return { error: "Password must be at least 8 characters" };

    await db
      .update(users)
      .set({
        name,
        company: company || null,
        phone: phone || null,
        jobTitle: jobTitle || null,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await recordAudit({ actorId: user.id, actorLabel: user.email, action: "profile.updated", entity: "user", entityId: user.id });
    revalidatePath("/portal/profile");
    return { ok: true, error: undefined };
  } catch {
    return { error: "Could not update your profile." };
  }
}
