import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users, type User } from "@/db/schema";

const COOKIE = "sevayo_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function secret(): string {
  return (
    process.env.SEVAYO_SESSION_SECRET ??
    process.env.DATABASE_URL ??
    "sevayo-development-secret"
  );
}

/* ------------------------- passwords ------------------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ------------------------- sessions ------------------------- */

type Payload = { uid: string; role: string; exp: number };

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createToken(user: Pick<User, "id" | "role">, remember = false): string {
  const payload: Payload = {
    uid: user.id,
    role: user.role,
    exp: Date.now() + (remember ? MAX_AGE : 60 * 60 * 12) * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token: string | undefined): Payload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: Pick<User, "id" | "role">, remember = false) {
  const store = await cookies();
  store.set(COOKIE, createToken(user, remember), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? MAX_AGE : 60 * 60 * 12,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  company: string | null;
  jobTitle: string | null;
  phone: string | null;
  timezone: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const payload = readToken(store.get(COOKIE)?.value);
    if (!payload) return null;
    const rows = await db.select().from(users).where(eq(users.id, payload.uid)).limit(1);
    const user = rows[0];
    if (!user || user.status !== "active") return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions ?? [],
      company: user.company,
      jobTitle: user.jobTitle,
      phone: user.phone,
      timezone: user.timezone,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

/* ------------------------- RBAC ------------------------- */

export const PERMISSIONS = [
  "users.manage",
  "clients.manage",
  "projects.manage",
  "leads.manage",
  "cms.manage",
  "media.manage",
  "branding.manage",
  "events.manage",
  "finance.manage",
  "settings.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [...PERMISSIONS],
  client: [],
};

export function can(user: Pick<SessionUser, "role" | "permissions"> | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === "admin") {
    if (user.permissions.length === 0) return true;
    return user.permissions.includes(permission);
  }
  return user.permissions.includes(permission);
}

export async function assertPermission(permission: Permission): Promise<SessionUser> {
  const user = await requireAdmin();
  if (!can(user, permission)) throw new Error(`FORBIDDEN:${permission}`);
  return user;
}

/* ------------------------- request metadata ------------------------- */

export async function requestMeta() {
  try {
    const h = await headers();
    return {
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local",
      userAgent: h.get("user-agent") ?? "unknown",
    };
  } catch {
    return { ip: "local", userAgent: "unknown" };
  }
}

export async function recordAudit(input: {
  actorId?: string | null;
  actorLabel?: string;
  action: string;
  entity?: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const { ip, userAgent } = await requestMeta();
  try {
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel ?? "system",
      action: input.action,
      entity: input.entity ?? "system",
      entityId: input.entityId ?? null,
      meta: input.meta ?? {},
      ip,
      userAgent,
    });
  } catch {
    /* audit is best-effort, never break the request */
  }
}

/* ------------------------- rate limiting ------------------------- */

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 12, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
