import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ *
 * Identity, RBAC
 * ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("client"), // admin | client
    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
    phone: text("phone"),
    company: text("company"),
    jobTitle: text("job_title"),
    avatarMediaId: uuid("avatar_media_id"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    status: text("status").notNull().default("active"), // active | suspended
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_key").on(t.email)],
);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  company: text("company"),
  industry: text("industry"),
  website: text("website"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  data: text("data").notNull(), // base64 payload (stored in DB -> survives redeploys)
  alt: text("alt"),
  folder: text("folder").notNull().default("general"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * CMS
 * ------------------------------------------------------------------ */

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  shape: text("shape").notNull().default("browser"), // browser | phone | neural | cloud | layers | modules
  accent: text("accent").notNull().default("#2E9BFF"),
  capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
  technologies: jsonb("technologies").$type<string[]>().notNull().default([]),
  process: jsonb("process").$type<{ title: string; detail: string }[]>().notNull().default([]),
  benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
  engagement: jsonb("engagement").$type<{ label: string; value: string }[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const portfolioProjects = pgTable("portfolio_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Platform"),
  summary: text("summary").notNull().default(""),
  heroMediaUrl: text("hero_media_url"),
  accent: text("accent").notNull().default("#2E9BFF"),
  technologies: jsonb("technologies").$type<string[]>().notNull().default([]),
  problem: text("problem").notNull().default(""),
  solution: text("solution").notNull().default(""),
  architecture: jsonb("architecture").$type<{ layer: string; detail: string }[]>().notNull().default([]),
  screens: jsonb("screens").$type<{ label: string; detail: string }[]>().notNull().default([]),
  outcome: jsonb("outcome").$type<{ label: string; value: string }[]>().notNull().default([]),
  year: text("year").notNull().default("2025"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const technologies = pgTable("technologies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Core"),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("#2E9BFF"),
  orbit: integer("orbit").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  quote: text("quote").notNull(),
  author: text("author").notNull(),
  role: text("role").notNull().default(""),
  company: text("company").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const cmsSections = pgTable(
  "cms_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageKey: text("page_key").notNull(),
    sectionKey: text("section_key").notNull(),
    eyebrow: text("eyebrow"),
    title: text("title").notNull().default(""),
    subtitle: text("subtitle").notNull().default(""),
    body: text("body").notNull().default(""),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cms_sections_page_section_key").on(t.pageKey, t.sectionKey)],
);

export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by"),
  },
  (t) => [uniqueIndex("site_settings_key_key").on(t.key)],
);

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  href: text("href"),
  tone: text("tone").notNull().default("default"),
  active: boolean("active").notNull().default(true),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Branding engine
 * ------------------------------------------------------------------ */

export const brandAssets = pgTable("brand_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull().default("logo"), // logo | icon | favicon | banner | hero
  variant: text("variant").notNull().default("dark"), // dark | light | mono | event
  context: text("context").notNull().default("standard"), // standard | header | mobile | login | portal | admin | email | campaign
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  isStandard: boolean("is_standard").notNull().default(false),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brandingEvents = pgTable("branding_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  kind: text("kind").notNull().default("custom"), // diwali | newyear | christmas | anniversary | independence | republic | campaign | custom
  logoAssetId: uuid("logo_asset_id"),
  faviconAssetId: uuid("favicon_asset_id"),
  bannerAssetId: uuid("banner_asset_id"),
  heroAssetId: uuid("hero_asset_id"),
  accentColor: text("accent_color"),
  announcement: text("announcement"),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  particles: text("particles").notNull().default("default"), // default | warm | cool | festive | none
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  priority: integer("priority").notNull().default(10),
  status: text("status").notNull().default("scheduled"), // draft | scheduled | active | expired | disabled
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brandingSettings = pgTable(
  "branding_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    defaultLogoId: uuid("default_logo_id"),
    defaultIconId: uuid("default_icon_id"),
    defaultFaviconId: uuid("default_favicon_id"),
    activeLogoId: uuid("active_logo_id"),
    mode: text("mode").notNull().default("auto"), // auto | manual
    brandName: text("brand_name").notNull().default("SEVAYO"),
    tagline: text("tagline").notNull().default("Ideas Into Software"),
    version: integer("version").notNull().default(1),
    updatedBy: uuid("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("branding_settings_singleton_key").on(t.id)],
);

export const brandingAudit = pgTable("branding_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  actorLabel: text("actor_label").notNull().default("system"),
  action: text("action").notNull(),
  eventId: uuid("event_id"),
  previous: jsonb("previous").$type<Record<string, unknown>>().notNull().default({}),
  next: jsonb("next").$type<Record<string, unknown>>().notNull().default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Delivery pipeline
 * ------------------------------------------------------------------ */

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  projectType: text("project_type").notNull().default("custom-software"),
  idea: text("idea").notNull().default(""),
  timeline: text("timeline").notNull().default("flexible"),
  budget: text("budget").notNull().default("undecided"),
  source: text("source").notNull().default("website"),
  status: text("status").notNull().default("new"), // new | qualified | proposal | won | lost
  score: integer("score").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id"),
  leadId: uuid("lead_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  stage: text("stage").notNull().default("discover"), // discover|define|design|build|test|launch|support
  status: text("status").notNull().default("active"), // active | paused | completed
  health: text("health").notNull().default("on-track"),
  progress: integer("progress").notNull().default(0),
  accent: text("accent").notNull().default("#2E9BFF"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  status: text("status").notNull().default("todo"), // todo | doing | review | done
  priority: text("priority").notNull().default("normal"),
  assignee: text("assignee").notNull().default("SEVAYO Team"),
  phase: text("phase").notNull().default("build"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  status: text("status").notNull().default("upcoming"), // upcoming | active | done
  progress: integer("progress").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  code: text("code").notNull().default("REQ-001"),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  priority: text("priority").notNull().default("must"),
  status: text("status").notNull().default("proposed"), // proposed | agreed | building | done
  authorLabel: text("author_label").notNull().default("SEVAYO"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  projectId: uuid("project_id"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("captured"), // captured | reviewing | scoped | converted
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  name: text("name").notNull(),
  category: text("category").notNull().default("spec"),
  mediaId: uuid("media_id"),
  externalUrl: text("external_url"),
  sizeLabel: text("size_label").notNull().default("—"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  authorId: uuid("author_id"),
  authorLabel: text("author_label").notNull().default("SEVAYO"),
  audience: text("audience").notNull().default("client"), // client | admin
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  title: text("title").notNull(),
  agenda: text("agenda").notNull().default(""),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMins: integer("duration_mins").notNull().default(30),
  joinUrl: text("join_url"),
  status: text("status").notNull().default("scheduled"),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id"),
  projectId: uuid("project_id"),
  number: text("number").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("draft"), // draft | sent | paid | overdue
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  lineItems: jsonb("line_items").$type<{ label: string; amountCents: number }[]>().notNull().default([]),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("INR"),
  method: text("method").notNull().default("bank-transfer"),
  reference: text("reference").notNull().default(""),
  status: text("status").notNull().default("succeeded"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  audience: text("audience").notNull().default("client"), // client | admin
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  kind: text("kind").notNull().default("info"),
  href: text("href"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  actorLabel: text("actor_label").notNull().default("system"),
  action: text("action").notNull(),
  entity: text("entity").notNull().default("system"),
  entityId: text("entity_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  path: text("path").notNull().default("/"),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type PortfolioProject = typeof portfolioProjects.$inferSelect;
export type Technology = typeof technologies.$inferSelect;
export type CmsSection = typeof cmsSections.$inferSelect;
export type BrandAsset = typeof brandAssets.$inferSelect;
export type BrandingEvent = typeof brandingEvents.$inferSelect;
export type BrandingSettings = typeof brandingSettings.$inferSelect;
export type Project = typeof projects.$inferSelect;
