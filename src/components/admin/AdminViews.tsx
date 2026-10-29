"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useState, type ReactNode } from "react";
import {
  createAnnouncementAction,
  createServiceAction,
  createTeamUserAction,
  createProjectAction,
  deleteAnnouncementAction,
  deleteBrandingEventAction,
  deleteFaqAction,
  deleteProjectAction,
  deleteServiceAction,
  deleteTestimonialAction,
  deleteTechnologyAction,
  setEventStatusAction,
  setUserRoleAction,
  updateLeadAction,
  updateMailSettingsAction,
  updateProjectAction,
  updateSectionAction,
  updateServiceAction,
  updateSiteSettingsAction,
  updateJourneyAction,
  uploadMediaAction,
  upsertFaqAction,
  upsertTechnologyAction,
  upsertTestimonialAction,
} from "@/app/actions/admin";
import { LogoutButton } from "@/components/site/SessionProvider";
import { Badge, Field, GlassPanel, StatTile } from "@/components/ui/kit";
import { BrandLogo } from "@/components/site/BrandLogo";
import { BrandMarkFlat } from "@/components/three/LiteBackdrop";
import { logoutAction } from "@/app/actions/auth";
import { BrandStudio } from "./BrandingStudio";

const SECTIONS = [
  { key: "", label: "Overview" },
  { key: "leads", label: "Leads" },
  { key: "projects", label: "Projects" },
  { key: "content", label: "CMS" },
  { key: "branding", label: "Branding" },
  { key: "media", label: "Media" },
  { key: "users", label: "Users" },
  { key: "audit", label: "Audit & Analytics" },
  { key: "profile", label: "Profile" },
];

export type AdminData = {
  user: { name: string; email: string; role: string };
  brand: {
    logoUrl: string;
    iconUrl: string;
    accent: string;
    accent2: string;
    mode: string;
    version: number;
    eventName: string | null;
    tagline: string;
  };
  stats: { label: string; value: string }[];
  analytics: { name: string; count: number }[];
  popular: { path: string; count: number }[];
  leads: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    projectType: string;
    idea: string;
    timeline: string;
    budget: string;
    status: string;
    score: number;
  }[];
  projects: { id: string; name: string; stage: string; status: string; progress: number; health: string }[];
  sections: { id: string; pageKey: string; sectionKey: string; eyebrow: string; title: string; subtitle: string; body: string }[];
  services: {
    id: string; title: string; tagline: string; description: string; accent: string; shape: string; published: boolean;
    capabilities: string[]; technologies: string[]; benefits: string[];
    process: { title: string; detail: string }[]; engagement: { label: string; value: string }[];
  }[];
  portfolio: {
    id: string; title: string; slug: string; summary: string; category: string; year: string; accent: string;
    heroMediaUrl: string | null; published: boolean; technologies: string[]; problem: string; solution: string;
    architecture: { layer: string; detail: string }[]; screens: { label: string; detail: string }[];
    outcome: { label: string; value: string }[];
  }[];
  faqs: { id: string; question: string; answer: string }[];
  testimonials: { id: string; quote: string; author: string; role: string; company: string }[];
  technologies: { id: string; name: string; category: string; description: string; color: string; orbit: number }[];
  announcements: { id: string; message: string }[];
  journeys: {
    idea: { label: string; detail: string }[];
    process: { title: string; detail: string }[];
  };
  mail: { to: string; fromName: string; enabled: boolean };
  media: { id: string; name: string; mimeType: string; sizeBytes: number; createdAt: string }[];
  users: { id: string; name: string; email: string; role: string; status: string; createdAt: string }[];
  audit: { id: string; actorLabel: string; action: string; entity: string; createdAt: string; ip: string | null }[];
  branding: {
    assets: { id: string; name: string; type: string; fileUrl: string; variant: string; context: string }[];
    events: {
      id: string;
      name: string;
      kind: string;
      status: string;
      priority: number;
      startAt: string;
      endAt: string;
      timezone: string;
      accentColor: string | null;
      announcement: string | null;
      heroTitle: string | null;
      heroSubtitle: string | null;
      particles: string;
      logoUrl: string | null;
    }[];
    settings: { mode: string; version: number; defaultLogoUrl: string | null; tagline: string };
  };
  site: {
    company: { name: string; email: string; phone: string; address: string; hours: string };
    social: { label: string; href: string }[];
    nav: { label: string; href: string }[];
    seo: { title: string; description: string; keywords: string; canonical: string };
  };
};

export function AdminShell({ data, children }: { data: AdminData; children: ReactNode }) {
  const pathname = usePathname();
  const current = pathname.replace(/^\/admin\/?/, "").split("/")[0];

  return (
    <div className="relative z-10 flex min-h-screen">
      <aside className="glass-strong fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col justify-between p-5 lg:flex">
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <Link href="/admin" className="block px-2">
            <BrandLogo context="admin" height={26} />
          </Link>
          <p className="mt-6 px-2 text-[10px] uppercase tracking-[0.28em] text-mute">Admin console</p>
          <nav className="mt-3 grid gap-0.5">
            {SECTIONS.map((section) => {
              const active = current === section.key;
              return (
                <Link
                  key={section.key || "overview"}
                  href={`/admin${section.key ? `/${section.key}` : ""}`}
                  className={`rounded-xl px-3 py-2.5 text-[13px] transition ${
                    active ? "text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
                  }`}
                  style={active ? { background: "rgba(255,255,255,0.07)", boxShadow: `inset 2px 0 0 ${data.brand.accent}` } : undefined}
                >
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-4 shrink-0 border-t border-line pt-4">
          <Link href="/admin/profile" className="mb-3 block rounded-2xl border border-line bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
            <p className="truncate text-sm font-medium">{data.user.name}</p>
            <p className="truncate text-[11px] text-mute">{data.user.email}</p>
            <p className="mt-2 mono text-[10px] uppercase tracking-[0.18em]" style={{ color: data.brand.accent }}>
              {data.user.role} · v{data.brand.version}
            </p>
          </Link>
          <Link href="/portal" className="mb-2 block rounded-xl border border-line px-3 py-2 text-center text-[12px] text-mute hover:text-ink">
            Client portal
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:pl-[250px]">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 overflow-x-auto px-4 py-3 lg:hidden no-scrollbar">
          {SECTIONS.map((section) => (
            <Link
              key={section.key || "overview"}
              href={`/admin${section.key ? `/${section.key}` : ""}`}
              className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-[12px] text-mute"
            >
              {section.label}
            </Link>
          ))}
        </header>
        <main className="min-w-0 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

function Head({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="headline mt-2 text-3xl">{title}</h1>
      {subtitle ? <p className="lede mt-3">{subtitle}</p> : null}
    </div>
  );
}

function Feedback({ state }: { state: { ok?: boolean; error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error) return <p className="text-sm" style={{ color: "#ffa3ab" }}>{state.error}</p>;
  if (state.message) return <p className="text-sm" style={{ color: "#7ff0c4" }}>{state.message}</p>;
  return null;
}

export function AdminOverview({ data }: { data: AdminData }) {
  return (
    <>
      <Head eyebrow="Overview" title="Operations at a glance" subtitle="Leads, delivery, content and analytics — the functional core of SEVAYO." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} accent={data.brand.accent} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-6">
          <p className="eyebrow">Brand state</p>
          <div className="mt-5 flex items-center gap-5">
            <BrandMarkFlat size={72} />
            <div className="grid gap-1 text-sm">
              <p>Mode: <span className="mono text-ink">{data.brand.mode}</span></p>
              <p>Version: <span className="mono text-ink">{data.brand.version}</span></p>
              <p>Active event: <span className="text-ink">{data.brand.eventName ?? "none (standard identity)"}</span></p>
              <p>Accent: <span className="mono" style={{ color: data.brand.accent }}>{data.brand.accent}</span></p>
            </div>
          </div>
          <Link href="/admin/branding" className="btn btn-ghost mt-6 !py-2.5 !text-[13px]">
            Open branding studio →
          </Link>
        </GlassPanel>

        <GlassPanel className="p-6">
          <p className="eyebrow">Tracked events</p>
          <ul className="mt-4 grid gap-2">
            {data.analytics.slice(0, 6).map((row) => (
              <li key={row.name} className="flex items-center justify-between text-sm">
                <span className="text-mute">{row.name}</span>
                <span className="mono">{row.count}</span>
              </li>
            ))}
            {data.analytics.length === 0 ? <li className="text-sm text-mute">No events captured yet.</li> : null}
          </ul>
        </GlassPanel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassPanel className="p-6">
          <p className="eyebrow">Latest leads</p>
          <ul className="mt-4 grid gap-3">
            {data.leads.slice(0, 4).map((lead) => (
              <li key={lead.id} className="rounded-2xl border border-line bg-white/[0.03] p-4">
                <p className="text-sm font-medium">{lead.name} · {lead.company ?? "—"}</p>
                <p className="mt-1 text-xs text-mute">{lead.projectType} · {lead.timeline} · {lead.budget}</p>
              </li>
            ))}
            {data.leads.length === 0 ? <li className="text-sm text-mute">No leads yet.</li> : null}
          </ul>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="eyebrow">Popular pages</p>
          <ul className="mt-4 grid gap-2">
            {data.popular.slice(0, 6).map((row) => (
              <li key={row.path} className="flex items-center justify-between text-sm">
                <span className="mono text-mute">{row.path}</span>
                <span className="mono">{row.count}</span>
              </li>
            ))}
            {data.popular.length === 0 ? <li className="text-sm text-mute">No page views yet.</li> : null}
          </ul>
        </GlassPanel>
      </div>
    </>
  );
}

export function AdminLeads({ data }: { data: AdminData }) {
  return (
    <>
      <Head eyebrow="Pipeline" title="Leads" subtitle="Every project brief submitted through the workspace, scored by timeline and budget signals." />
      <div className="grid gap-3">
        {data.leads.map((lead) => (
          <GlassPanel key={lead.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-[260px] flex-1">
                <p className="text-sm font-medium">{lead.name} · {lead.company ?? "Independent"}</p>
                <p className="mono mt-1 text-[11px] text-mute">{lead.email}</p>
                <p className="mt-3 text-sm leading-relaxed text-mute">{lead.idea}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{lead.projectType}</Badge>
                  <Badge>{lead.timeline}</Badge>
                  <Badge>{lead.budget}</Badge>
                  <Badge tone={lead.score > 40 ? "ok" : "warn"}>score {lead.score}</Badge>
                </div>
              </div>
              <form action={updateLeadAction} className="grid gap-2">
                <input type="hidden" name="id" value={lead.id} />
                <select name="status" defaultValue={lead.status} className="field !py-2 !text-[13px]">
                  {["new", "qualified", "proposal", "won", "lost"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <textarea name="notes" rows={2} placeholder="Internal notes" className="field !py-2 !text-[13px]" />
                <button type="submit" className="btn btn-ghost !py-2 !text-[12px]">Update</button>
              </form>
            </div>
          </GlassPanel>
        ))}
        {data.leads.length === 0 ? <p className="text-sm text-mute">No leads yet.</p> : null}
      </div>
    </>
  );
}

export function AdminProjects({ data }: { data: AdminData }) {
  return (
    <>
      <Head eyebrow="Delivery" title="Projects" subtitle="Active engagements, stage and health." />
      <div className="grid gap-3">
        {data.projects.map((project) => (
          <GlassPanel key={project.id} className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm font-medium">{project.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-mute">{project.stage} · {project.status}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-40">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: data.brand.accent }} />
                </div>
              </div>
              <Badge tone={project.health === "on-track" ? "ok" : "warn"}>{project.health}</Badge>
            </div>
          </GlassPanel>
        ))}
        {data.projects.length === 0 ? <p className="text-sm text-mute">No projects yet.</p> : null}
      </div>
    </>
  );
}

export function AdminContent({ data }: { data: AdminData }) {
  const [tab, setTab] = useState<"pages" | "journeys" | "services" | "work" | "faq" | "testimonials" | "tech" | "settings">("pages");

  return (
    <>
      <Head eyebrow="CMS" title="Content management" subtitle="Everything on the public website is editable here — no deployment required." />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["pages", "journeys", "services", "work", "faq", "testimonials", "tech", "settings"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full border px-4 py-2 text-[13px] capitalize transition ${
              tab === key ? "border-white/25 bg-white/10 text-ink" : "border-line text-mute hover:text-ink"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "pages" ? (
        <div className="grid gap-4">
          {data.sections.map((section) => (
            <SectionEditor key={section.id} section={section} />
          ))}
          {data.sections.length === 0 ? <p className="text-sm text-mute">No page sections found.</p> : null}
          <div className="grid gap-4 xl:grid-cols-2">
            <AnnouncementEditor />
            <MailEditor data={data} />
          </div>
          {data.announcements.length ? (
            <GlassPanel className="p-6">
              <p className="eyebrow">Live announcements</p>
              <ul className="mt-4 grid gap-2">
                {data.announcements.map((announcement) => (
                  <li key={announcement.id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-mute">{announcement.message}</span>
                    <form action={deleteAnnouncementAction}>
                      <input type="hidden" name="id" value={announcement.id} />
                      <button type="submit" className="btn btn-ghost !py-1.5 !text-[12px]">remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          ) : null}
        </div>
      ) : null}

      {tab === "journeys" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <JourneyEditor
            sectionKey="idea"
            heading='Idea → Software pipeline'
            hint="One stage per line as: Label | detail"
            rows={data.journeys.idea.map((stage) => `${stage.label} | ${stage.detail}`)}
          />
          <JourneyEditor
            sectionKey="process"
            heading="Process path"
            hint="One stage per line as: Title | detail (steps are numbered automatically)"
            rows={data.journeys.process.map((stage) => `${stage.title} | ${stage.detail}`)}
          />
        </div>
      ) : null}

      {tab === "services" ? (
        <div className="grid gap-4">
          <ServiceCreator />
          {data.services.map((service) => (
            <ServiceEditor key={service.id} service={service} />
          ))}
        </div>
      ) : null}

      {tab === "work" ? (
        <div className="grid gap-4">
          <ProjectCreator />
          {data.portfolio.map((project) => (
            <PortfolioEditor key={project.id} project={project} />
          ))}
        </div>
      ) : null}

      {tab === "faq" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <FaqEditor />
          {data.faqs.map((faq) => (
            <GlassPanel key={faq.id} className="p-6">
              <form action={async (formData: FormData) => { await deleteFaqAction(formData); }} className="float-right">
                <input type="hidden" name="id" value={faq.id} />
                <button type="submit" className="btn btn-ghost !py-1.5 !text-[12px]">delete</button>
              </form>
              <p className="eyebrow">Question</p>
              <p className="mt-2 text-sm font-medium">{faq.question}</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">{faq.answer}</p>
              <FaqEditor faq={faq} />
            </GlassPanel>
          ))}
        </div>
      ) : null}

      {tab === "testimonials" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <TestimonialEditor />
          {data.testimonials.map((testimonial) => (
            <GlassPanel key={testimonial.id} className="p-6">
              <p className="text-sm leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-mute">
                {testimonial.author} · {testimonial.role} {testimonial.company ? `· ${testimonial.company}` : ""}
              </p>
              <TestimonialEditor testimonial={testimonial} />
            </GlassPanel>
          ))}
        </div>
      ) : null}

      {tab === "tech" ? (
        <div className="grid gap-4">
          <TechnologyEditor />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.technologies.map((tech) => (
              <GlassPanel key={tech.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{tech.name}</span>
                  <form action={deleteTechnologyAction}>
                    <input type="hidden" name="id" value={tech.id} />
                    <button type="submit" className="btn btn-ghost !py-1 !text-[11px]">✕</button>
                  </form>
                </div>
                <p className="mt-2 text-[12px] text-mute">{tech.description}</p>
                <TechnologyEditor technology={tech} />
              </GlassPanel>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "settings" ? <SiteSettingsEditor data={data} /> : null}
    </>
  );
}

function SectionEditor({ section }: { section: AdminData["sections"][number] }) {
  const [state, action, pending] = useActionState(updateSectionAction, null);
  return (
    <GlassPanel className="p-6">
      <p className="eyebrow">{section.pageKey} / {section.sectionKey}</p>
      <form action={action} className="mt-4 grid gap-3">
        <input type="hidden" name="id" value={section.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Eyebrow"><input name="eyebrow" defaultValue={section.eyebrow} className="field" /></Field>
          <Field label="Title"><input name="title" defaultValue={section.title} className="field" /></Field>
        </div>
        <Field label="Subtitle"><textarea name="subtitle" rows={2} defaultValue={section.subtitle} className="field resize-none" /></Field>
        <Field label="Body / list" hint="pipe-separated"><textarea name="body" rows={2} defaultValue={section.body} className="field resize-none" /></Field>
        <Feedback state={state} />
        <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
          {pending ? "Saving…" : "Publish section"}
        </button>
      </form>
    </GlassPanel>
  );
}

const SHAPES = ["browser", "phone", "neural", "cloud", "layers", "modules"];

function ServiceEditor({ service }: { service: AdminData["services"][number] }) {
  const [state, action, pending] = useActionState(updateServiceAction, null);
  return (
    <GlassPanel className="p-6">
      <form action={action} className="grid gap-3">
        <input type="hidden" name="id" value={service.id} />
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label="Title"><input name="title" defaultValue={service.title} className="field" /></Field>
          <Field label="Accent"><input name="accent" defaultValue={service.accent} className="field" /></Field>
          <Field label="3D shape">
            <select name="shape" defaultValue={service.shape} className="field">
              {SHAPES.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Tagline"><input name="tagline" defaultValue={service.tagline} className="field" /></Field>
        <Field label="Description"><textarea name="description" rows={3} defaultValue={service.description} className="field resize-none" /></Field>
        <Field label="Capabilities" hint="one per line"><textarea name="capabilities" rows={4} defaultValue={service.capabilities.join("\n")} className="field resize-none" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Technologies" hint="one per line"><textarea name="technologies" rows={3} defaultValue={service.technologies.join("\n")} className="field resize-none" /></Field>
          <Field label="Benefits" hint="one per line"><textarea name="benefits" rows={3} defaultValue={service.benefits.join("\n")} className="field resize-none" /></Field>
        </div>
        <Field label="Process" hint="Title | detail per line"><textarea name="process" rows={3} defaultValue={service.process.map((p) => `${p.title} | ${p.detail}`).join("\n")} className="field resize-none" /></Field>
        <Field label="Engagement" hint="Label | value per line"><textarea name="engagement" rows={2} defaultValue={service.engagement.map((e) => `${e.label} | ${e.value}`).join("\n")} className="field resize-none" /></Field>
        <label className="flex items-center gap-2 text-sm text-mute">
          <input type="checkbox" name="published" defaultChecked={service.published} className="h-4 w-4" /> Published
        </label>
        <Feedback state={state} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
            {pending ? "Publishing…" : "Publish service"}
          </button>
          <form action={deleteServiceAction}>
            <input type="hidden" name="id" value={service.id} />
            <button type="submit" className="btn btn-ghost !py-2.5 !text-[13px]" style={{ color: "#ffa3ab" }}>Delete</button>
          </form>
        </div>
      </form>
    </GlassPanel>
  );
}

function ServiceCreator() {
  const [state, action, pending] = useActionState(createServiceAction, null);
  return (
    <GlassPanel className="p-6">
      <p className="eyebrow">Add a service</p>
      <form action={action} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Title"><input name="title" required className="field" placeholder="Data Engineering" /></Field>
          <Field label="URL slug" hint="optional"><input name="slug" className="field" placeholder="data-engineering" /></Field>
          <Field label="3D shape">
            <select name="shape" className="field">{SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </Field>
        </div>
        <Field label="Tagline"><input name="tagline" className="field" /></Field>
        <Field label="Description"><textarea name="description" rows={2} className="field resize-none" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Capabilities" hint="one per line"><textarea name="capabilities" rows={3} className="field resize-none" /></Field>
          <Field label="Technologies" hint="one per line"><textarea name="technologies" rows={3} className="field resize-none" /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Accent colour"><input name="accent" defaultValue="#2e9bff" className="field" /></Field>
          <Feedback state={state} />
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
          {pending ? "Creating…" : "Create service"}
        </button>
      </form>
    </GlassPanel>
  );
}

function PortfolioEditor({ project }: { project: AdminData["portfolio"][number] }) {
  const [state, action, pending] = useActionState(updateProjectAction, null);
  return (
    <GlassPanel className="p-6">
      <form action={action} className="grid gap-3">
        <input type="hidden" name="id" value={project.id} />
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Title"><input name="title" defaultValue={project.title} className="field" /></Field>
          <Field label="Category"><input name="category" defaultValue={project.category} className="field" /></Field>
          <Field label="Year"><input name="year" defaultValue={project.year} className="field" /></Field>
          <Field label="Accent"><input name="accent" defaultValue={project.accent} className="field" /></Field>
        </div>
        <Field label="Summary"><textarea name="summary" rows={2} defaultValue={project.summary} className="field resize-none" /></Field>
        <Field label="Cover image URL"><input name="heroMediaUrl" defaultValue={project.heroMediaUrl ?? ""} className="field" /></Field>
        <Field label="Technologies" hint="one per line"><textarea name="technologies" rows={2} defaultValue={project.technologies.join("\n")} className="field resize-none" /></Field>
        <Field label="Problem"><textarea name="problem" rows={3} defaultValue={project.problem} className="field resize-none" /></Field>
        <Field label="Solution"><textarea name="solution" rows={3} defaultValue={project.solution} className="field resize-none" /></Field>
        <Field label="Architecture" hint="Layer | detail per line"><textarea name="architecture" rows={3} defaultValue={project.architecture.map((a) => `${a.layer} | ${a.detail}`).join("\n")} className="field resize-none" /></Field>
        <Field label="Screens" hint="Label | detail per line"><textarea name="screens" rows={3} defaultValue={project.screens.map((s) => `${s.label} | ${s.detail}`).join("\n")} className="field resize-none" /></Field>
        <Field label="Outcome" hint="Label: value per line"><textarea name="outcome" rows={3} defaultValue={project.outcome.map((o) => `${o.label}: ${o.value}`).join("\n")} className="field resize-none" /></Field>
        <label className="flex items-center gap-2 text-sm text-mute">
          <input type="checkbox" name="published" defaultChecked={project.published} className="h-4 w-4" /> Published
        </label>
        <Feedback state={state} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
            {pending ? "Publishing…" : "Publish case study"}
          </button>
          <a href={`/work/${project.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost !py-2.5 !text-[13px]">View live</a>
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn btn-ghost !py-2.5 !text-[13px]" style={{ color: "#ffa3ab" }}>Delete</button>
          </form>
        </div>
      </form>
    </GlassPanel>
  );
}

function ProjectCreator() {
  const [state, action, pending] = useActionState(createProjectAction, null);
  return (
    <GlassPanel className="p-6">
      <p className="eyebrow">Add work / case study</p>
      <form action={action} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Title"><input name="title" required className="field" placeholder="Helios Booking Suite" /></Field>
          <Field label="URL slug" hint="optional"><input name="slug" className="field" /></Field>
          <Field label="Category"><input name="category" defaultValue="Platform" className="field" /></Field>
          <Field label="Year"><input name="year" defaultValue={String(new Date().getFullYear())} className="field" /></Field>
        </div>
        <Field label="Summary"><textarea name="summary" rows={2} className="field resize-none" /></Field>
        <Field label="Cover image URL" hint="optional"><input name="heroMediaUrl" className="field" placeholder="https://…" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Technologies" hint="one per line"><textarea name="technologies" rows={2} className="field resize-none" /></Field>
          <Field label="Outcome" hint="Label: value per line"><textarea name="outcome" rows={2} className="field resize-none" placeholder="Conversion: +24%" /></Field>
        </div>
        <Field label="Problem"><textarea name="problem" rows={2} className="field resize-none" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Accent colour"><input name="accent" defaultValue="#2e9bff" className="field" /></Field>
          <Feedback state={state} />
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
          {pending ? "Adding…" : "Add to portfolio"}
        </button>
      </form>
    </GlassPanel>
  );
}

function FaqEditor({ faq }: { faq?: AdminData["faqs"][number] }) {
  const [state, action, pending] = useActionState(upsertFaqAction, null);
  return (
    <form action={action} className="mt-4 grid gap-3 border-t border-line pt-4">
      {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
      <Field label={faq ? "Edit question" : "New question"}>
        <input name="question" defaultValue={faq?.question ?? ""} required className="field" />
      </Field>
      <Field label="Answer">
        <textarea name="answer" rows={3} defaultValue={faq?.answer ?? ""} required className="field resize-none" />
      </Field>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn btn-ghost justify-self-start !py-2 !text-[12px]">
        {faq ? "Save changes" : "Add FAQ"}
      </button>
    </form>
  );
}

function TestimonialEditor({ testimonial }: { testimonial?: AdminData["testimonials"][number] }) {
  const [state, action, pending] = useActionState(upsertTestimonialAction, null);
  return (
    <form action={action} className="mt-4 grid gap-3 border-t border-line pt-4">
      {testimonial ? <input type="hidden" name="id" value={testimonial.id} /> : null}
      <Field label="Quote"><textarea name="quote" rows={3} defaultValue={testimonial?.quote ?? ""} required className="field resize-none" /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Author"><input name="author" defaultValue={testimonial?.author ?? ""} required className="field" /></Field>
        <Field label="Role"><input name="role" defaultValue={testimonial?.role ?? ""} className="field" /></Field>
        <Field label="Company"><input name="company" defaultValue={testimonial?.company ?? ""} className="field" /></Field>
      </div>
      <Feedback state={state} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn btn-ghost !py-2 !text-[12px]">
          {testimonial ? "Save changes" : "Add testimonial"}
        </button>
        {testimonial ? (
          <span />
        ) : null}
      </div>
      {testimonial ? (
        <span />
      ) : null}
    </form>
  );
}

function TechnologyEditor({ technology }: { technology?: AdminData["technologies"][number] }) {
  const [state, action, pending] = useActionState(upsertTechnologyAction, null);
  return (
    <form action={action} className="mt-4 grid gap-3">
      {technology ? <input type="hidden" name="id" value={technology.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Name"><input name="name" defaultValue={technology?.name ?? ""} required className="field" /></Field>
        <Field label="Category"><input name="category" defaultValue={technology?.category ?? "Core"} className="field" /></Field>
        <Field label="Colour"><input name="color" defaultValue={technology?.color ?? "#2e9bff"} className="field" /></Field>
        <Field label="Orbit"><input name="orbit" type="number" min={1} max={4} defaultValue={technology?.orbit ?? 1} className="field" /></Field>
      </div>
      <Field label="Description"><textarea name="description" rows={2} defaultValue={technology?.description ?? ""} className="field resize-none" /></Field>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn btn-ghost justify-self-start !py-2 !text-[12px]">
        {technology ? "Save node" : "Add technology node"}
      </button>
    </form>
  );
}

function JourneyEditor({
  sectionKey,
  heading,
  hint,
  rows,
}: {
  sectionKey: "idea" | "process";
  heading: string;
  hint: string;
  rows: string[];
}) {
  const [state, action, pending] = useActionState(updateJourneyAction, null);
  return (
    <GlassPanel className="p-6">
      <p className="eyebrow">{heading}</p>
      <p className="mt-2 text-xs text-mute">{hint}</p>
      <form action={action} className="mt-4 grid gap-3">
        <input type="hidden" name="sectionKey" value={sectionKey} />
        <Field label="Stages">
          <textarea
            name="stages"
            rows={9}
            defaultValue={rows.join("\n")}
            className="field resize-none mono !text-[12px]"
            placeholder={sectionKey === "idea" ? "Idea | A thought written down precisely" : "Discover | Stakeholder interviews"}
          />
        </Field>
        <Feedback state={state} />
        <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
          {pending ? "Publishing…" : "Publish journey"}
        </button>
      </form>
    </GlassPanel>
  );
}

function MailEditor({ data }: { data: AdminData }) {
  const [state, action, pending] = useActionState(updateMailSettingsAction, null);
  return (
    <GlassPanel className="p-6">
      <p className="eyebrow">Contact notifications</p>
      <p className="mt-2 text-xs leading-relaxed text-mute">
        Every project brief is emailed here. Set <span className="mono">SEVAYO_SMTP_HOST</span>,{" "}
        <span className="mono">SEVAYO_SMTP_USER</span> and <span className="mono">SEVAYO_SMTP_PASS</span> to enable real
        delivery; until then messages are stored and logged, never lost.
      </p>
      <form action={action} className="mt-4 grid gap-3">
        <Field label="Deliver to"><input name="to" type="email" defaultValue={data.mail.to} className="field" /></Field>
        <Field label="From name"><input name="fromName" defaultValue={data.mail.fromName} className="field" /></Field>
        <label className="flex items-center gap-2 text-sm text-mute">
          <input type="checkbox" name="enabled" defaultChecked={data.mail.enabled} className="h-4 w-4" /> Email notifications enabled
        </label>
        <Feedback state={state} />
        <button type="submit" disabled={pending} className="btn btn-ghost justify-self-start !py-2.5 !text-[13px]">Save notifications</button>
      </form>
    </GlassPanel>
  );
}

function AnnouncementEditor() {
  const [state, action, pending] = useActionState(createAnnouncementAction, null);
  return (
    <GlassPanel className="p-6">
      <p className="eyebrow">Announcement bar</p>
      <form action={action} className="mt-4 grid gap-3">
        <Field label="Message"><input name="message" className="field" placeholder="SEVAYO is onboarding 3 new builds this quarter." /></Field>
        <Field label="Link" hint="optional"><input name="href" className="field" placeholder="/contact" /></Field>
        <Feedback state={state} />
        <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">Publish announcement</button>
      </form>
    </GlassPanel>
  );
}

function SiteSettingsEditor({ data }: { data: AdminData }) {
  const [state, action, pending] = useActionState(updateSiteSettingsAction, null);
  return (
    <GlassPanel className="p-6">
      <form action={action} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company name"><input name="companyName" defaultValue={data.site.company.name} className="field" /></Field>
          <Field label="Email"><input name="email" defaultValue={data.site.company.email} className="field" /></Field>
          <Field label="Phone"><input name="phone" defaultValue={data.site.company.phone} className="field" /></Field>
          <Field label="Hours"><input name="hours" defaultValue={data.site.company.hours} className="field" /></Field>
        </div>
        <Field label="Address"><input name="address" defaultValue={data.site.company.address} className="field" /></Field>
        <Field label="Navigation" hint="Label|href per line">
          <textarea name="nav" rows={4} defaultValue={data.site.nav.map((n) => `${n.label}|${n.href}`).join("\n")} className="field resize-none" />
        </Field>
        <Field label="Social" hint="Label|href per line">
          <textarea name="social" rows={3} defaultValue={data.site.social.map((s) => `${s.label}|${s.href}`).join("\n")} className="field resize-none" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="SEO title"><input name="seoTitle" defaultValue={data.site.seo.title} className="field" /></Field>
          <Field label="Canonical"><input name="canonical" defaultValue={data.site.seo.canonical} className="field" /></Field>
        </div>
        <Field label="SEO description"><textarea name="seoDescription" rows={2} defaultValue={data.site.seo.description} className="field resize-none" /></Field>
        <Field label="SEO keywords"><input name="seoKeywords" defaultValue={data.site.seo.keywords} className="field" /></Field>
        <Field label="Hero stats" hint="Label | value per line">
          <textarea name="stats" rows={4} defaultValue={data.stats.map((s) => `${s.label} | ${s.value}`).join("\n")} className="field resize-none" />
        </Field>
        <Feedback state={state} />
        <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">Publish settings</button>
      </form>
    </GlassPanel>
  );
}

export function AdminMedia({ data }: { data: AdminData }) {
  const [state, action, pending] = useActionState(uploadMediaAction, null);
  return (
    <>
      <Head eyebrow="Library" title="Media" subtitle="Uploads are validated (MIME + size, SVG sanitised) and stored in the database, then served immutably." />
      <GlassPanel className="p-6">
        <form action={action} className="grid gap-3">
          <Field label="File" hint="PNG, JPEG, WEBP, GIF or SVG · max 3 MB">
            <input type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" required className="field" />
          </Field>
          <Feedback state={state} />
          <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
            {pending ? "Uploading…" : "Upload media"}
          </button>
        </form>
      </GlassPanel>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.media.map((asset) => (
          <a key={asset.id} href={`/api/media/${asset.id}`} target="_blank" rel="noreferrer" className="glass rounded-2xl p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${asset.id}`} alt={asset.name} className="h-28 w-full rounded-xl object-contain" />
            <p className="mt-3 truncate text-[12px]">{asset.name}</p>
            <p className="mono text-[10px] text-mute">{Math.round(asset.sizeBytes / 1024)} KB · {asset.mimeType}</p>
          </a>
        ))}
      </div>
    </>
  );
}

export function AdminUsers({ data }: { data: AdminData }) {
  const [state, action, pending] = useActionState(createTeamUserAction, null);
  return (
    <>
      <Head eyebrow="Access control" title="Users & roles" subtitle="RBAC: admins manage branding, CMS, finances and users; clients get a workspace only." />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div className="grid gap-3">
          {data.users.map((user) => (
            <GlassPanel key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="mono text-[11px] text-mute">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={user.role === "admin" ? "ok" : "default"}>{user.role}</Badge>
                <form action={setUserRoleAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={user.id} />
                  <select name="role" defaultValue={user.role} className="field !w-auto !py-1.5 !text-[12px]">
                    <option value="client">client</option>
                    <option value="admin">admin</option>
                  </select>
                  <button type="submit" className="btn btn-ghost !py-1.5 !text-[12px]">Set</button>
                </form>
              </div>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel className="p-6">
          <p className="eyebrow">Add user</p>
          <form action={action} className="mt-4 grid gap-3">
            <Field label="Name"><input name="name" required className="field" /></Field>
            <Field label="Email"><input name="email" type="email" required className="field" /></Field>
            <Field label="Company" hint="optional"><input name="company" className="field" /></Field>
            <Field label="Temporary password"><input name="password" type="password" required minLength={8} className="field" /></Field>
            <Field label="Role">
              <select name="role" className="field"><option value="client">client</option><option value="admin">admin</option></select>
            </Field>
            <Feedback state={state} />
            <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">Create user</button>
          </form>
        </GlassPanel>
      </div>
    </>
  );
}

export function AdminAudit({ data }: { data: AdminData }) {
  return (
    <>
      <Head eyebrow="Governance" title="Audit log & analytics" subtitle="Who changed what, and how the website is performing." />
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel className="p-6">
          <p className="eyebrow">Recent audit entries</p>
          <ul className="mt-4 grid gap-3">
            {data.audit.map((entry) => (
              <li key={entry.id} className="border-b border-line pb-3 last:border-0">
                <p className="text-sm">{entry.action}</p>
                <p className="mono mt-1 text-[10px] text-mute">
                  {entry.actorLabel} · {entry.entity} · {new Date(entry.createdAt).toLocaleString("en-IN")} · {entry.ip}
                </p>
              </li>
            ))}
            {data.audit.length === 0 ? <li className="text-sm text-mute">No entries yet.</li> : null}
          </ul>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="eyebrow">Conversions</p>
          <ul className="mt-4 grid gap-2">
            {data.analytics.map((row) => (
              <li key={row.name} className="flex items-center justify-between text-sm">
                <span className="text-mute">{row.name}</span>
                <span className="mono">{row.count}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>
    </>
  );
}

export function AdminBranding({ data }: { data: AdminData }) {
  const [modeState, modeAction] = useActionState(
    async (_prev: { ok?: boolean; error?: string; message?: string } | null, formData: FormData) => {
      const { setBrandingModeAction } = await import("@/app/actions/admin");
      return setBrandingModeAction(_prev, formData);
    },
    null,
  );
  const [eventState, eventAction] = useActionState(
    async (_prev: { ok?: boolean; error?: string; message?: string } | null, formData: FormData) => {
      const { createBrandingEventAction } = await await import("@/app/actions/admin");
      return createBrandingEventAction(_prev, formData);
    },
    null,
  );
  const [uploadState, uploadAction] = useActionState(
    async (_prev: { ok?: boolean; error?: string; message?: string } | null, formData: FormData) => {
      const { uploadBrandAssetAction } = await import("@/app/actions/admin");
      return uploadBrandAssetAction(_prev, formData);
    },
    null,
  );

  return (
    <>
      <Head
        eyebrow="Branding engine"
        title="3D branding studio"
        subtitle="Upload assets, preview them live in 3D, schedule events and publish — no deployment, with a standard fallback guaranteed."
      />

      <BrandStudio
        accent={data.brand.accent}
        accent2={data.brand.accent2}
        standardLogo={data.branding.settings.defaultLogoUrl ?? data.brand.iconUrl}
        activeLogo={data.brand.logoUrl}
        mode={data.brand.mode}
        version={data.brand.version}
        eventName={data.brand.eventName}
      />

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <GlassPanel className="p-6">
          <p className="eyebrow">Upload brand asset</p>
          <form action={uploadAction} className="mt-4 grid gap-3">
            <Field label="Asset name"><input name="name" required className="field" placeholder="Diwali wordmark" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <select name="type" className="field">
                  {["logo", "icon", "favicon", "banner", "hero"].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label="Variant">
                <select name="variant" className="field">
                  {["dark", "light", "mono", "event"].map((variant) => (
                    <option key={variant} value={variant}>{variant}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="File" hint="PNG, JPEG, WEBP, SVG · max 3 MB">
              <input type="file" name="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required className="field" />
            </Field>
            <Feedback state={uploadState} />
            <button type="submit" className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">Upload asset</button>
          </form>
        </GlassPanel>

        <GlassPanel className="p-6">
          <p className="eyebrow">Branding mode</p>
          <form action={modeAction} className="mt-4 grid gap-3">
            <Field label="Mode">
              <select name="mode" defaultValue={data.branding.settings.mode} className="field">
                <option value="auto">automatic (events + standard fallback)</option>
                <option value="manual">manual override</option>
              </select>
            </Field>
            <Field label="Manual logo">
              <select name="activeLogoId" className="field" defaultValue="">
                <option value="">— none —</option>
                {data.branding.assets.filter((asset) => asset.type === "logo").map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </Field>
            <Feedback state={modeState} />
            <button type="submit" className="btn btn-ghost justify-self-start !py-2.5 !text-[13px]">Apply branding mode</button>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Resolution order: manual override → highest-priority active event → standard SEVAYO identity.
          </p>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-4 p-6">
        <p className="eyebrow">Schedule a brand event</p>
        <form action={eventAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Event name"><input name="name" required className="field" placeholder="Diwali" /></Field>
            <Field label="Kind">
              <select name="kind" className="field">
                {["diwali", "newyear", "christmas", "anniversary", "independence", "republic", "campaign", "custom"].map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </select>
            </Field>
            <Field label="Event logo">
              <select name="logoAssetId" className="field" defaultValue="">
                <option value="">standard logo</option>
                {data.branding.assets.filter((asset) => asset.type === "logo" || asset.type === "icon").map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Start"><input name="startAt" type="datetime-local" required className="field" /></Field>
            <Field label="End"><input name="endAt" type="datetime-local" required className="field" /></Field>
            <Field label="Timezone"><input name="timezone" defaultValue="Asia/Kolkata" className="field" /></Field>
            <Field label="Priority"><input name="priority" type="number" min={1} max={100} defaultValue={20} className="field" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Accent"><input name="accentColor" defaultValue="#ffb347" className="field" /></Field>
            <Field label="Hero title" hint="optional"><input name="heroTitle" className="field" /></Field>
            <Field label="Particles">
              <select name="particles" className="field">
                {["default", "warm", "cool", "festive", "none"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Announcement"><input name="announcement" className="field" /></Field>
          <Field label="Description"><textarea name="description" rows={2} className="field resize-none" /></Field>
          <Feedback state={eventState} />
          <button type="submit" className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">Schedule event</button>
        </form>
      </GlassPanel>

      <div className="mt-4 grid gap-3">
        {data.branding.events.map((event) => (
          <GlassPanel key={event.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{event.name}</p>
                  <Badge tone={event.status === "active" ? "ok" : event.status === "disabled" ? "bad" : "default"}>{event.status}</Badge>
                  <Badge>priority {event.priority}</Badge>
                  <Badge>{event.kind}</Badge>
                </div>
                <p className="mono mt-2 text-[11px] text-mute">
                  {new Date(event.startAt).toLocaleString("en-IN")} → {new Date(event.endAt).toLocaleString("en-IN")} · {event.timezone}
                </p>
                {event.announcement ? <p className="mt-2 text-sm text-mute">{event.announcement}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {["scheduled", "active", "disabled"].map((status) => (
                  <form key={status} action={setEventStatusAction}>
                    <input type="hidden" name="id" value={event.id} />
                    <input type="hidden" name="status" value={status} />
                    <button type="submit" className="btn btn-ghost !py-1.5 !text-[12px]">{status}</button>
                  </form>
                ))}
                <form action={deleteBrandingEventAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <button type="submit" className="btn btn-ghost !py-1.5 !text-[12px]" style={{ color: "#ffa3ab" }}>delete</button>
                </form>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </>
  );
}
