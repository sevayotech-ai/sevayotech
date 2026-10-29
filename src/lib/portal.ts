import "server-only";
import { and, desc, eq, inArray, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  clients,
  documents,
  ideas,
  invoices,
  meetings,
  messages,
  milestones,
  notifications,
  payments,
  projectTasks,
  projects,
  requirements,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function getClientContext() {
  const user = await requireUser();

  const clientRows = await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1);
  const client = clientRows[0] ?? null;

  const projectRows = client
    ? await db.select().from(projects).where(eq(projects.clientId, client.id)).orderBy(desc(projects.createdAt))
    : [];

  return { user, client, projects: projectRows };
}

export async function getUnreadCount(userId: string) {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return rows.length;
}

export async function getPortalData(clientId: string | null, userId: string) {
  const projectIds = clientId
    ? (await db.select({ id: projects.id }).from(projects).where(eq(projects.clientId, clientId))).map((p) => p.id)
    : [];

  const [taskRows, milestoneRows, requirementRows, ideaRows, documentRows, messageRows, meetingRows, invoiceRows, notificationRows] =
    await Promise.all([
      projectIds.length ? db.select().from(projectTasks).where(inArray(projectTasks.projectId, projectIds)) : [],
      projectIds.length ? db.select().from(milestones).where(inArray(milestones.projectId, projectIds)) : [],
      projectIds.length ? db.select().from(requirements).where(inArray(requirements.projectId, projectIds)) : [],
      db.select().from(ideas).where(or(eq(ideas.userId, userId), isNull(ideas.projectId))),
      projectIds.length ? db.select().from(documents).where(inArray(documents.projectId, projectIds)) : [],
      projectIds.length
        ? db.select().from(messages).where(inArray(messages.projectId, projectIds)).orderBy(messages.createdAt)
        : db.select().from(messages).where(or(eq(messages.authorId, userId), isNull(messages.projectId))),
      projectIds.length ? db.select().from(meetings).where(inArray(meetings.projectId, projectIds)) : [],
      clientId ? db.select().from(invoices).where(eq(invoices.clientId, clientId)) : [],
      db
        .select()
        .from(notifications)
        .where(or(eq(notifications.userId, userId), eq(notifications.audience, "client")))
        .orderBy(desc(notifications.createdAt)),
    ]);

  const invoiceIds = invoiceRows.map((invoice) => invoice.id);
  const paymentRows = invoiceIds.length
    ? await db.select().from(payments).where(inArray(payments.invoiceId, invoiceIds))
    : [];

  return {
    tasks: taskRows,
    milestones: milestoneRows,
    requirements: requirementRows,
    ideas: ideaRows,
    documents: documentRows,
    messages: messageRows,
    meetings: meetingRows,
    invoices: invoiceRows,
    payments: paymentRows,
    notifications: notificationRows,
  };
}

export type PortalData = Awaited<ReturnType<typeof getPortalData>>;
export type PortalProject = Awaited<ReturnType<typeof getClientContext>>["projects"][number];
