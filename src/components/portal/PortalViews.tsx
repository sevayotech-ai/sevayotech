"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createIdeaAction, markNotificationsReadAction, sendMessageAction, updateProfileAction, updateRequirementStatusAction } from "@/app/actions/portal";
import { LogoutButton } from "@/components/site/SessionProvider";
import { Badge, Field, GlassPanel, ProgressBar, StatTile } from "@/components/ui/kit";
import { useBrand } from "@/components/site/BrandProvider";
import type { PortalData, PortalProject } from "@/lib/portal";

type User = { id: string; name: string; email: string; company: string | null; phone: string | null; jobTitle: string | null; role: string };

const STAGE_LABEL: Record<string, string> = {
  discover: "Discover",
  define: "Define",
  design: "Design",
  build: "Build",
  test: "Test",
  launch: "Launch",
  support: "Support",
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
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

export function OverviewView({
  user,
  projects,
  data,
}: {
  user: User;
  projects: PortalProject[];
  data: PortalData;
}) {
  const brand = useBrand();
  const active = projects.find((p) => p.status === "active") ?? projects[0];
  const paid = data.payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const outstanding = data.invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);

  return (
    <>
      <Head eyebrow="Overview" title={`Welcome back, ${user.name.split(" ")[0]}`} subtitle="Your delivery command center — stage, health, money and communication in one place." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active projects" value={String(projects.filter((p) => p.status === "active").length)} accent={brand.accent} />
        <StatTile label="Open requirements" value={String(data.requirements.filter((r) => r.status !== "done").length)} />
        <StatTile label="Paid to date" value={money(paid, "INR")} accent="#34d39b" />
        <StatTile label="Outstanding" value={money(outstanding, "INR")} accent={outstanding > 0 ? "#f5b544" : "#34d39b"} />
      </div>

      {active ? (
        <GlassPanel className="mt-6 p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Current stage</p>
              <h2 className="title mt-2 text-2xl">{active.name}</h2>
              <p className="mt-2 max-w-xl text-sm text-mute">{active.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={active.health === "on-track" ? "ok" : active.health === "at-risk" ? "warn" : "bad"}>
                {active.health}
              </Badge>
              <Badge>{STAGE_LABEL[active.stage] ?? active.stage}</Badge>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-mute">
              <span>Delivery progress</span>
              <span className="mono">{active.progress}%</span>
            </div>
            <ProgressBar value={active.progress} accent={active.accent} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {data.milestones
              .filter((milestone) => milestone.projectId === active.id)
              .slice(0, 3)
              .map((milestone) => (
                <div key={milestone.id} className="rounded-2xl border border-line bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">{milestone.title}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-mute">{milestone.status}</p>
                  <div className="mt-3">
                    <ProgressBar value={milestone.progress} accent={active.accent} />
                  </div>
                </div>
              ))}
          </div>
          <Link href={`/portal/projects/${active.id}`} className="btn btn-ghost mt-6 !py-2.5 !text-[13px]">
            Open project space →
          </Link>
        </GlassPanel>
      ) : (
        <GlassPanel className="mt-6 p-8 text-center">
          <h2 className="title">No project yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-mute">
            Capture your first idea and our team will turn it into a scoped, phased plan.
          </p>
          <Link href="/portal/ideas" className="btn btn-primary mt-6 !py-2.5 !text-[13px]">
            Add an idea
          </Link>
        </GlassPanel>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassPanel className="p-6">
          <p className="eyebrow">Recent activity</p>
          <ul className="mt-4 grid gap-3">
            {data.notifications.slice(0, 5).map((notification) => (
              <li key={notification.id} className="flex gap-3 border-b border-line pb-3 last:border-0">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: brand.accent }} />
                <div>
                  <p className="text-sm">{notification.title}</p>
                  <p className="text-xs text-mute">{notification.body}</p>
                </div>
              </li>
            ))}
            {data.notifications.length === 0 ? <li className="text-sm text-mute">Nothing yet.</li> : null}
          </ul>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="eyebrow">Upcoming meetings</p>
          <ul className="mt-4 grid gap-3">
            {data.meetings.slice(0, 4).map((meeting) => (
              <li key={meeting.id} className="rounded-2xl border border-line bg-white/[0.03] p-4">
                <p className="text-sm font-medium">{meeting.title}</p>
                <p className="mt-1 text-xs text-mute">
                  {new Date(meeting.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                  {meeting.durationMins} min
                </p>
              </li>
            ))}
            {data.meetings.length === 0 ? <li className="text-sm text-mute">No meetings scheduled.</li> : null}
          </ul>
        </GlassPanel>
      </div>
    </>
  );
}

export function ProjectsView({ projects, data }: { projects: PortalProject[]; data: PortalData }) {
  return (
    <>
      <Head eyebrow="My projects" title="Project spaces" subtitle="Each project has its own environment: requirements, design, build, test, deploy, documents and communication." />
      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <Link key={project.id} href={`/portal/projects/${project.id}`} className="glass spatial-card block rounded-[22px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="title">{project.name}</h2>
                <p className="mt-2 text-sm text-mute">{project.description}</p>
              </div>
              <Badge tone={project.status === "active" ? "ok" : "default"}>{project.status}</Badge>
            </div>
            <div className="mt-5">
              <ProgressBar value={project.progress} accent={project.accent} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
              <div>
                <p className="mono text-sm">{data.tasks.filter((t) => t.projectId === project.id).length}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-mute">Tasks</p>
              </div>
              <div>
                <p className="mono text-sm">{data.requirements.filter((r) => r.projectId === project.id).length}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-mute">Requirements</p>
              </div>
              <div>
                <p className="mono text-sm">{data.documents.filter((d) => d.projectId === project.id).length}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-mute">Documents</p>
              </div>
            </div>
          </Link>
        ))}
        {projects.length === 0 ? <p className="text-sm text-mute">No projects yet.</p> : null}
      </div>
    </>
  );
}

export function IdeasView({ data }: { data: PortalData }) {
  const [state, action, pending] = useActionState<{ error?: string } | null, FormData>(createIdeaAction, null);

  return (
    <>
      <Head eyebrow="Ideas" title="Capture the thought before it fades" subtitle="Everything starts here. Ideas become requirements, requirements become milestones." />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <GlassPanel className="p-6">
          <form action={action} className="grid gap-4">
            <Field label="Idea title">
              <input name="title" required className="field" placeholder="Predictive maintenance alerts" />
            </Field>
            <Field label="What should it do?">
              <textarea name="description" rows={5} required className="field resize-none" placeholder="Use vehicle sensor feeds to pre-empt breakdown windows…" />
            </Field>
            {state?.error ? <p className="text-sm" style={{ color: "#ffa3ab" }}>{state.error}</p> : null}
            <button type="submit" disabled={pending} className="btn btn-primary justify-center">
              {pending ? "Saving…" : "Capture idea"}
            </button>
          </form>
        </GlassPanel>

        <div className="grid gap-3">
          {data.ideas.map((idea) => (
            <GlassPanel key={idea.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm font-medium">{idea.title}</h3>
                <Badge tone={idea.status === "converted" ? "ok" : idea.status === "reviewing" ? "warn" : "default"}>
                  {idea.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-mute">{idea.description}</p>
              <p className="mt-3 mono text-[11px] text-mute">{new Date(idea.createdAt).toLocaleDateString("en-IN")}</p>
            </GlassPanel>
          ))}
          {data.ideas.length === 0 ? <p className="text-sm text-mute">No ideas captured yet.</p> : null}
        </div>
      </div>
    </>
  );
}

export function RequirementsView({ data }: { data: PortalData }) {
  return (
    <>
      <Head eyebrow="Requirements" title="Agreed scope, in writing" subtitle="Mark a requirement as agreed once it matches your understanding. Everything else stays open." />
      <div className="grid gap-3">
        {data.requirements.map((requirement) => (
          <GlassPanel key={requirement.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-[240px] flex-1">
                <p className="mono text-[11px] text-mute">{requirement.code}</p>
                <h3 className="mt-1 text-sm font-medium">{requirement.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{requirement.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={requirement.priority === "must" ? "warn" : "default"}>{requirement.priority}</Badge>
                <Badge tone={requirement.status === "done" ? "ok" : requirement.status === "building" ? "warn" : "default"}>
                  {requirement.status}
                </Badge>
                {requirement.status === "proposed" ? (
                  <form action={updateRequirementStatusAction}>
                    <input type="hidden" name="id" value={requirement.id} />
                    <input type="hidden" name="status" value="agreed" />
                    <button type="submit" className="btn btn-ghost !px-3 !py-1.5 !text-[12px]">
                      Agree
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </GlassPanel>
        ))}
        {data.requirements.length === 0 ? <p className="text-sm text-mute">No requirements yet.</p> : null}
      </div>
    </>
  );
}

export function TasksView({ data, projects }: { data: PortalData; projects: PortalProject[] }) {
  const columns = [
    { key: "todo", label: "To do" },
    { key: "doing", label: "In progress" },
    { key: "review", label: "In review" },
    { key: "done", label: "Done" },
  ];
  return (
    <>
      <Head eyebrow="Tasks" title="Delivery board" subtitle="Exactly what the team is working on right now." />
      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.key} className="glass rounded-[22px] p-4">
            <p className="eyebrow">{column.label}</p>
            <ul className="mt-4 grid gap-2">
              {data.tasks
                .filter((task) => task.status === column.key)
                .map((task) => (
                  <li key={task.id} className="rounded-2xl border border-line bg-white/[0.03] p-4">
                    <p className="text-sm">{task.title}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-mute">
                      {projects.find((p) => p.id === task.projectId)?.name ?? "Project"} · {task.assignee}
                    </p>
                  </li>
                ))}
              {data.tasks.filter((task) => task.status === column.key).length === 0 ? (
                <li className="text-xs text-mute">Empty</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

export function MilestonesView({ data }: { data: PortalData }) {
  return (
    <>
      <Head eyebrow="Milestones" title="Where the project stands" subtitle="Each milestone has an owner, a date and a definition of done." />
      <div className="grid gap-3">
        {data.milestones.map((milestone) => (
          <GlassPanel key={milestone.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium">{milestone.title}</h3>
              <Badge tone={milestone.status === "done" ? "ok" : milestone.status === "active" ? "warn" : "default"}>
                {milestone.status}
              </Badge>
            </div>
            {milestone.detail ? <p className="mt-2 text-sm text-mute">{milestone.detail}</p> : null}
            <div className="mt-4">
              <ProgressBar value={milestone.progress} />
            </div>
            <p className="mt-3 mono text-[11px] text-mute">
              {milestone.dueAt ? `Due ${new Date(milestone.dueAt).toLocaleDateString("en-IN")}` : "No date"}
            </p>
          </GlassPanel>
        ))}
        {data.milestones.length === 0 ? <p className="text-sm text-mute">No milestones yet.</p> : null}
      </div>
    </>
  );
}

export function DocumentsView({ data }: { data: PortalData }) {
  return (
    <>
      <Head eyebrow="Documents" title="Everything in writing" subtitle="Architecture briefs, design tokens, recordings and specs." />
      <div className="grid gap-3 md:grid-cols-2">
        {data.documents.map((document) => (
          <a
            key={document.id}
            href={document.externalUrl ?? (document.mediaId ? `/api/media/${document.mediaId}` : "#")}
            target="_blank"
            rel="noreferrer"
            className="glass spatial-card flex items-center gap-4 rounded-[22px] p-5"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-line text-xs">▤</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{document.name}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-mute">
                {document.category} · {document.sizeLabel}
              </p>
            </div>
          </a>
        ))}
        {data.documents.length === 0 ? <p className="text-sm text-mute">No documents shared yet.</p> : null}
      </div>
    </>
  );
}

export function MessagesView({ data, projects }: { data: PortalData; projects: PortalProject[] }) {
  const [state, action, pending] = useActionState<{ error?: string } | null, FormData>(sendMessageAction, null);
  const projectId = projects[0]?.id;

  return (
    <>
      <Head eyebrow="Messages" title="Direct line to your team" subtitle="Every decision lives in writing — searchable, attributable, permanent." />
      <GlassPanel className="p-6">
        <ul className="grid gap-4">
          {data.messages.map((message) => (
            <li key={message.id} className={`flex gap-3 ${message.audience === "client" ? "justify-end" : ""}`}>
              <div
                className={`max-w-[80%] rounded-2xl border p-4 ${
                  message.audience === "client" ? "border-line bg-white/[0.06]" : "border-line bg-white/[0.02]"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-mute">{message.authorLabel}</p>
                <p className="mt-2 text-sm leading-relaxed">{message.body}</p>
                <p className="mt-2 mono text-[10px] text-mute">{new Date(message.createdAt).toLocaleString("en-IN")}</p>
              </div>
            </li>
          ))}
          {data.messages.length === 0 ? <li className="text-sm text-mute">No messages yet.</li> : null}
        </ul>

        <form action={action} className="mt-6 grid gap-3 border-t border-line pt-6">
          <input type="hidden" name="projectId" value={projectId ?? ""} />
          <Field label="Write a message">
            <textarea name="body" rows={3} required className="field resize-none" placeholder="Ask anything about the build…" />
          </Field>
          {state?.error ? <p className="text-sm" style={{ color: "#ffa3ab" }}>{state.error}</p> : null}
          <button type="submit" disabled={pending} className="btn btn-primary justify-self-start !py-2.5 !text-[13px]">
            {pending ? "Sending…" : "Send message"}
          </button>
        </form>
      </GlassPanel>
    </>
  );
}

export function MeetingsView({ data }: { data: PortalData }) {
  return (
    <>
      <Head eyebrow="Meetings" title="Scheduled sessions" subtitle="Reviews, planning and security checkpoints." />
      <div className="grid gap-3 md:grid-cols-2">
        {data.meetings.map((meeting) => (
          <GlassPanel key={meeting.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium">{meeting.title}</h3>
              <Badge tone={meeting.status === "completed" ? "ok" : "default"}>{meeting.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-mute">{meeting.agenda}</p>
            <p className="mt-3 mono text-[11px] text-mute">
              {new Date(meeting.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
              {meeting.durationMins} min
            </p>
            {meeting.joinUrl ? (
              <a href={meeting.joinUrl} target="_blank" rel="noreferrer" className="btn btn-ghost mt-4 !py-2 !text-[12px]">
                Join link
              </a>
            ) : null}
          </GlassPanel>
        ))}
        {data.meetings.length === 0 ? <p className="text-sm text-mute">Nothing scheduled.</p> : null}
      </div>
    </>
  );
}

export function InvoicesView({ data }: { data: PortalData }) {
  return (
    <>
      <Head eyebrow="Invoices" title="Billing history" subtitle="Phase-based invoicing — you always know what a phase cost." />
      <div className="grid gap-3">
        {data.invoices.map((invoice) => (
          <GlassPanel key={invoice.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mono text-sm">{invoice.number}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                  Issued {new Date(invoice.issuedAt).toLocaleDateString("en-IN")}
                  {invoice.dueAt ? ` · Due ${new Date(invoice.dueAt).toLocaleDateString("en-IN")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="mono text-lg">{money(invoice.amountCents, invoice.currency)}</p>
                <Badge tone={invoice.status === "paid" ? "ok" : invoice.status === "overdue" ? "bad" : "warn"}>
                  {invoice.status}
                </Badge>
              </div>
            </div>
            <ul className="mt-4 grid gap-2 border-t border-line pt-4">
              {invoice.lineItems.map((item) => (
                <li key={item.label} className="flex justify-between text-sm text-mute">
                  <span>{item.label}</span>
                  <span className="mono">{money(item.amountCents, invoice.currency)}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        ))}
        {data.invoices.length === 0 ? <p className="text-sm text-mute">No invoices yet.</p> : null}
      </div>
    </>
  );
}

export function PaymentsView({ data }: { data: PortalData }) {
  const invoiceNumber = (id: string) => data.invoices.find((invoice) => invoice.id === id)?.number ?? "—";
  return (
    <>
      <Head eyebrow="Payments" title="Payments received" subtitle="Bank transfers, references and settlement dates." />
      <div className="grid gap-3">
        {data.payments.map((payment) => (
          <GlassPanel key={payment.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium">{invoiceNumber(payment.invoiceId)}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                {payment.method} · {payment.reference}
              </p>
            </div>
            <div className="text-right">
              <p className="mono text-lg" style={{ color: "#7ff0c4" }}>
                {money(payment.amountCents, payment.currency)}
              </p>
              <p className="text-[11px] text-mute">{new Date(payment.paidAt).toLocaleDateString("en-IN")}</p>
            </div>
          </GlassPanel>
        ))}
        {data.payments.length === 0 ? <p className="text-sm text-mute">No payments recorded.</p> : null}
      </div>
    </>
  );
}

export function NotificationsView({ data }: { data: PortalData }) {
  return (
    <>
      <Head eyebrow="Notifications" title="Everything you missed" subtitle="Stage changes, documents, invoices and replies." />
      <form action={markNotificationsReadAction} className="mb-5">
        <button type="submit" className="btn btn-ghost !py-2 !text-[12px]">
          Mark all as read
        </button>
      </form>
      <div className="grid gap-3">
        {data.notifications.map((notification) => (
          <GlassPanel key={notification.id} className={`p-5 ${notification.readAt ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="mt-1 text-sm text-mute">{notification.body}</p>
              </div>
              <p className="mono shrink-0 text-[10px] text-mute">{new Date(notification.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
          </GlassPanel>
        ))}
        {data.notifications.length === 0 ? <p className="text-sm text-mute">Nothing here.</p> : null}
      </div>
    </>
  );
}

export function ProfileView({ user }: { user: User }) {
  const [state, action, pending] = useActionState<{ error?: string; ok?: boolean } | null, FormData>(updateProfileAction, null);

  return (
    <>
      <Head eyebrow="Profile" title="Your details" subtitle="Used on invoices, documents and meeting invitations." />
      <GlassPanel className="max-w-2xl p-7">
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input name="name" defaultValue={user.name} required className="field" />
          </Field>
          <Field label="Company">
            <input name="company" defaultValue={user.company ?? ""} className="field" />
          </Field>
          <Field label="Job title">
            <input name="jobTitle" defaultValue={user.jobTitle ?? ""} className="field" />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={user.phone ?? ""} className="field" />
          </Field>
          <Field label="New password" hint="leave blank to keep current">
            <input name="password" type="password" className="field" placeholder="••••••••" />
          </Field>
          <div className="sm:col-span-2">
            {state?.ok ? <p className="mb-3 text-sm" style={{ color: "#7ff0c4" }}>Profile updated.</p> : null}
            {state?.error ? <p className="mb-3 text-sm" style={{ color: "#ffa3ab" }}>{state.error}</p> : null}
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
          <div className="glass rounded-2xl p-5 sm:col-span-2">
            <p className="eyebrow">Session</p>
            <p className="mt-2 text-sm text-mute">
              Signing out ends this session on this device only. Your project data stays exactly as it is.
            </p>
            <div className="mt-4">
              <LogoutButton className="btn btn-ghost !py-2.5 !text-[13px]" />
            </div>
          </div>
        </form>
      </GlassPanel>
    </>
  );
}

export function ProjectSpaceView({
  project,
  data,
}: {
  project: PortalProject;
  data: PortalData;
}) {
  const areas = [
    { key: "requirements", label: "Requirements", count: data.requirements.filter((r) => r.projectId === project.id).length },
    { key: "tasks", label: "Tasks", count: data.tasks.filter((t) => t.projectId === project.id).length },
    { key: "milestones", label: "Milestones", count: data.milestones.filter((m) => m.projectId === project.id).length },
    { key: "documents", label: "Documents", count: data.documents.filter((d) => d.projectId === project.id).length },
    { key: "messages", label: "Communication", count: data.messages.filter((m) => m.projectId === project.id).length },
    { key: "meetings", label: "Meetings", count: data.meetings.filter((m) => m.projectId === project.id).length },
  ];

  return (
    <>
      <div
        className="relative overflow-hidden rounded-[26px] border border-line p-8"
        style={{ background: `radial-gradient(120% 90% at 20% 0%, ${project.accent}22, transparent 60%), rgba(255,255,255,0.02)` }}
      >
        <p className="eyebrow">Project space</p>
        <h1 className="headline mt-2 text-4xl">{project.name}</h1>
        <p className="lede mt-3">{project.description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge tone={project.health === "on-track" ? "ok" : "warn"}>{project.health}</Badge>
          <Badge>{STAGE_LABEL[project.stage] ?? project.stage}</Badge>
          <Badge>{project.progress}% complete</Badge>
        </div>
        <div className="mt-6 max-w-md">
          <ProgressBar value={project.progress} accent={project.accent} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <Link key={area.key} href={`/portal/${area.key}`} className="glass spatial-card rounded-[22px] p-6">
            <p className="text-sm font-medium">{area.label}</p>
            <p className="mono mt-4 text-2xl" style={{ color: project.accent }}>
              {area.count}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-mute">items</p>
          </Link>
        ))}
      </div>
    </>
  );
}
