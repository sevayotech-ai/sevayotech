import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  brandAssets,
  brandingEvents,
  brandingSettings,
  clients,
  cmsSections,
  documents,
  faqs,
  ideas,
  invoices,
  leads,
  mediaAssets,
  meetings,
  messages,
  milestones,
  notifications,
  payments,
  portfolioProjects,
  projectTasks,
  projects,
  requirements,
  services,
  siteSettings,
  technologies,
  testimonials,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { STANDARD_MARK_SVG, STANDARD_WORDMARK_SVG } from "@/lib/branding";

const SEED_VERSION = "sevayo-3";

let running: Promise<void> | null = null;

export async function ensureSeed(): Promise<void> {
  if (running) return running;
  running = run().catch((error) => {
    console.error("[sevayo] seed failed", error);
    running = null; // allow a retry on the next request (e.g. DB not ready yet)
  });
  return running;
}

async function run() {
  const existing = await db
    .select()
    .from(siteSettings)
    .where(sql`${siteSettings.key} = 'seed'`);

  if (existing[0] && (existing[0].value as { version?: string })?.version === SEED_VERSION) {
    return;
  }

  /* ---------------- media: standard brand assets ---------------- */
  const mark = await db
    .insert(mediaAssets)
    .values({
      name: "sevayo-mark.svg",
      mimeType: "image/svg+xml",
      sizeBytes: STANDARD_MARK_SVG.length,
      data: Buffer.from(STANDARD_MARK_SVG).toString("base64"),
      alt: "SEVAYO mark",
      folder: "brand",
    })
    .returning();

  const wordmark = await db
    .insert(mediaAssets)
    .values({
      name: "sevayo-wordmark.svg",
      mimeType: "image/svg+xml",
      sizeBytes: STANDARD_WORDMARK_SVG.length,
      data: Buffer.from(STANDARD_WORDMARK_SVG).toString("base64"),
      alt: "SEVAYO wordmark",
      folder: "brand",
    })
    .returning();

  const markUrl = `/api/media/${mark[0].id}`;
  const wordUrl = `/api/media/${wordmark[0].id}`;

  const brandRows = await db
    .insert(brandAssets)
    .values([
      {
        name: "SEVAYO Standard Wordmark",
        type: "logo",
        variant: "dark",
        context: "standard",
        fileUrl: wordUrl,
        thumbnailUrl: markUrl,
        metadata: { accent: "#2e9bff", format: "svg" },
        isStandard: true,
      },
      {
        name: "SEVAYO Standard Icon",
        type: "icon",
        variant: "dark",
        context: "standard",
        fileUrl: markUrl,
        thumbnailUrl: markUrl,
        metadata: { accent: "#2e9bff", format: "svg" },
        isStandard: true,
      },
      {
        name: "SEVAYO Favicon",
        type: "favicon",
        variant: "dark",
        context: "standard",
        fileUrl: markUrl,
        thumbnailUrl: markUrl,
        metadata: {},
        isStandard: true,
      },
    ])
    .returning();

  const standardLogo = brandRows.find((b) => b.type === "logo")!;
  const standardIcon = brandRows.find((b) => b.type === "icon")!;
  const standardFavicon = brandRows.find((b) => b.type === "favicon")!;

  await db.insert(brandingSettings).values({
    defaultLogoId: standardLogo.id,
    defaultIconId: standardIcon.id,
    defaultFaviconId: standardFavicon.id,
    mode: "auto",
    brandName: "SEVAYO",
    tagline: "Ideas Into Software",
    version: 1,
  });

  const year = new Date().getFullYear();
  await db.insert(brandingEvents).values([
    {
      name: "Diwali — Festival of Light",
      slug: "diwali",
      description: "Warm particle field, temporary wordmark treatment and a respectful announcement.",
      kind: "diwali",
      logoAssetId: standardLogo.id,
      faviconAssetId: standardFavicon.id,
      accentColor: "#ffb347",
      announcement: "Shubh Deepavali from the SEVAYO team — may your ideas shine bright.",
      heroTitle: "Ideas Into Software",
      heroSubtitle: "Building through the festival of light.",
      particles: "warm",
      startAt: new Date(`${year + 1}-11-08T00:00:00.000Z`),
      endAt: new Date(`${year + 1}-11-16T23:59:59.000Z`),
      timezone: "Asia/Kolkata",
      priority: 50,
      status: "scheduled",
    },
    {
      name: "New Year — Fresh Ideas",
      slug: "new-year",
      description: "Cool winter accent with a celebratory hero treatment.",
      kind: "newyear",
      logoAssetId: standardLogo.id,
      accentColor: "#7cf7ff",
      announcement: `SEVAYO turns the page — new year, new products. Let's build yours.`,
      particles: "cool",
      startAt: new Date(`${year + 1}-12-28T00:00:00.000Z`),
      endAt: new Date(`${year + 2}-01-07T23:59:59.000Z`),
      timezone: "Asia/Kolkata",
      priority: 40,
      status: "scheduled",
    },
  ]);

  await db.insert(announcements).values({
    message: "SEVAYO is onboarding 3 new product builds this quarter — book a discovery slot.",
    href: "/contact",
    tone: "default",
    active: true,
  });

  /* ---------------- CMS: home sections ---------------- */
  await db
    .insert(cmsSections)
    .values([
    {
      pageKey: "home",
      sectionKey: "hero",
      eyebrow: "Software development & technology company",
      title: "Ideas Into Software",
      subtitle:
        "SEVAYO designs and engineers the systems behind ambitious products — web, mobile, AI and cloud — from first sketch to production scale.",
      body: "Start Your Project|Explore SEVAYO",
    },
    {
      pageKey: "home",
      sectionKey: "intro",
      eyebrow: "Why SEVAYO",
      title: "An engineering partner, not a vendor queue.",
      subtitle:
        "We take ownership of outcomes. Architecture decisions are written down, trade-offs are explicit, and every phase ends with working software in your hands.",
      body: "",
    },
    {
      pageKey: "home",
      sectionKey: "services",
      eyebrow: "Capabilities",
      title: "A connected service ecosystem",
      subtitle: "Each capability is a live node in the SEVAYO environment. Open one to see how we execute it.",
      body: "",
    },
    {
      pageKey: "home",
      sectionKey: "idea",
      eyebrow: "The SEVAYO method",
      title: "Idea → Requirements → Design → Code → Product",
      subtitle:
        "Scroll and watch a thought become a shipped product. This is the exact pipeline your project moves through.",
      body: "",
    },
    {
      pageKey: "home",
      sectionKey: "process",
      eyebrow: "Process",
      title: "Seven stages, zero ambiguity",
      subtitle: "You always know which stage you are in, what is happening, and what arrives next.",
      body: "",
    },
    {
      pageKey: "home",
      sectionKey: "about",
      eyebrow: "About",
      title: "Built by engineers who ship",
      subtitle:
        "SEVAYO is a remote-first product engineering company. We combine spatial design, rigorous backend architecture and production operations under one accountable team.",
      body:
        "48 products shipped|Remote-first, India & EU overlap|ISO-aligned delivery process",
    },
    {
      pageKey: "home",
      sectionKey: "contact",
      eyebrow: "Start",
      title: "Let's build your idea.",
      subtitle: "Five short steps. You'll have a written response within one business day.",
      body: "",
    },
      {
        pageKey: "home",
        sectionKey: "technology",
        eyebrow: "Technology ecosystem",
        title: "One connected stack, chosen deliberately",
        subtitle:
          "Hover a node to inspect it. The ecosystem you see behind this panel is the same one we build on.",
        body: "",
      },
      {
        pageKey: "home",
        sectionKey: "work",
        eyebrow: "Selected work",
        title: "Products in production, not mockups",
        subtitle:
          "Each panel is a shipped system. Open a case study for the architecture and the outcome.",
        body: "",
      },
      {
        pageKey: "home",
        sectionKey: "faq",
        eyebrow: "Questions",
        title: "Answers before you ask",
        subtitle: "The things founders and CTOs ask us first.",
        body: "",
      },
      {
        pageKey: "services",
        sectionKey: "hero",
        eyebrow: "Capabilities",
        title: "A connected service ecosystem",
        subtitle:
          "Each capability is a live node in the SEVAYO environment. Open one to see how we execute it end to end.",
        body: "",
      },
      {
        pageKey: "services",
        sectionKey: "cta",
        eyebrow: "Next step",
        title: "Not sure which capability you need?",
        subtitle:
          "Start with the outcome. We'll map the shortest path from your idea to production software.",
        body: "",
      },
      {
        pageKey: "work",
        sectionKey: "hero",
        eyebrow: "Portfolio",
        title: "Products in production, not mockups",
        subtitle:
          "Every panel is a shipped system with real users. Open a case study for the architecture, trade-offs and outcome.",
        body: "",
      },
      {
        pageKey: "work",
        sectionKey: "cta",
        eyebrow: "Next step",
        title: "Your product could be the next panel here.",
        subtitle: "Tell us the problem. We'll tell you the shortest safe path.",
        body: "",
      },
      {
        pageKey: "process",
        sectionKey: "hero",
        eyebrow: "Process",
        title: "Seven stages, zero ambiguity",
        subtitle:
          "The camera travels the path exactly as your project does. Each stage has an owner, an output and a definition of done.",
        body: "",
      },
      {
        pageKey: "contact",
        sectionKey: "hero",
        eyebrow: "Project workspace",
        title: "Let's build your idea.",
        subtitle:
          "This is the same workspace our clients use. Five short steps, then a senior engineer reviews your brief.",
        body: "Direct line|What happens next|Already a client?",
      },
      {
        pageKey: "login",
        sectionKey: "hero",
        eyebrow: "Client access",
        title: "Your workspace is exactly where you left it.",
        subtitle:
          "Track milestones, review requirements, read documents, message the team and see invoices — in one place.",
        body: "",
      },
      {
        pageKey: "footer",
        sectionKey: "about",
        eyebrow: "SEVAYO",
        title: "Ideas Into Software",
        subtitle: "A remote-first product engineering company building software that survives contact with reality.",
        body: "",
      },
    ])
    .onConflictDoNothing();

  /* ---------------- journey content (idea pipeline + process path) ---------------- */
  const ideaStages = [
    { label: "Idea", detail: "A thought, a frustration, an opportunity. We write it down precisely." },
    { label: "Requirements", detail: "Scoped, prioritised, testable. Risk named before code." },
    { label: "Design", detail: "Flows, interface system and motion language — buildable, not decorative." },
    { label: "Development", detail: "Typed end-to-end. Working software every two weeks." },
    { label: "Testing", detail: "Automated suites, load, accessibility and security review." },
    { label: "Deployment", detail: "Reproducible pipelines, observability, staged rollout." },
    { label: "Product", detail: "Live, measured, maintained. Your idea is now software." },
  ];
  const processStages = [
    { title: "Discover", detail: "Stakeholder interviews, constraints, success metrics." },
    { title: "Define", detail: "Architecture brief, scope, phased milestones, risks." },
    { title: "Design", detail: "Flows, interface system, motion and accessibility spec." },
    { title: "Build", detail: "Typed, reviewed code in vertical slices. Demo every two weeks." },
    { title: "Test", detail: "Unit, integration, load, a11y and security validation." },
    { title: "Launch", detail: "Reproducible pipelines, staged rollout, observability." },
    { title: "Support", detail: "SLOs, monitoring, dependency upgrades, improvement cycle." },
  ];

  await db
    .update(cmsSections)
    .set({ data: { stages: ideaStages } })
    .where(and(eq(cmsSections.pageKey, "home"), eq(cmsSections.sectionKey, "idea")));
  await db
    .update(cmsSections)
    .set({ data: { stages: processStages } })
    .where(and(eq(cmsSections.pageKey, "home"), eq(cmsSections.sectionKey, "process")));

  /* ---------------- services ---------------- */
  const existingServices = await db.select({ id: services.id }).from(services).limit(1);
  if (existingServices[0]) {
    await db
      .update(siteSettings)
      .set({ value: { version: SEED_VERSION } })
      .where(sql`${siteSettings.key} = 'seed'`);
    return;
  }

  await db.insert(services).values([
    {
      slug: "web-development",
      title: "Web Development",
      tagline: "Interfaces that hold up under real traffic.",
      description:
        "We build production web platforms — from marketing surfaces to data-heavy operational products — with an obsession for performance budgets, accessibility and long-term maintainability.",
      shape: "browser",
      accent: "#2e9bff",
      capabilities: [
        "Product & marketing sites",
        "Customer portals & dashboards",
        "Design systems",
        "Headless commerce",
        "Core Web Vitals engineering",
        "Accessibility (WCAG 2.2 AA)",
      ],
      technologies: ["Next.js", "React", "TypeScript", "Tailwind", "Three.js"],
      process: [
        { title: "Architecture", detail: "Routing, data flow, render strategy and edge boundaries defined before code." },
        { title: "Interface system", detail: "Composable components with tokens, states and documentation." },
        { title: "Hardening", detail: "Load, a11y, SEO and error-budget validation before launch." },
      ],
      benefits: ["Faster first paint", "Lower maintenance cost", "Rank-ready markup"],
      engagement: [{ label: "Typical build", value: "4–10 weeks" }, { label: "Team", value: "2–4 engineers" }],
      sortOrder: 1,
    },
    {
      slug: "mobile-applications",
      title: "Mobile Applications",
      tagline: "One codebase, native-feeling behaviour.",
      description:
        "Cross-platform mobile products with native modules where it matters — offline-first data, push, payments, biometrics and store-ready release pipelines.",
      shape: "phone",
      accent: "#35d6ff",
      capabilities: [
        "Flutter & React Native builds",
        "Offline-first sync",
        "Push & deep links",
        "In-app purchases",
        "App Store / Play release",
      ],
      technologies: ["Flutter", "React Native", "Expo", "Firebase"],
      process: [
        { title: "Motion & gesture spec", detail: "Every interaction defined for thumb-reach and reduced motion." },
        { title: "Device matrix", detail: "Low-end Android to flagship iOS validated on real hardware." },
        { title: "Release train", detail: "Staged rollout, crash telemetry, hotfix lane." },
      ],
      benefits: ["Single release pipeline", "Native-grade feel", "Store-compliant"],
      engagement: [{ label: "Typical build", value: "6–12 weeks" }, { label: "Team", value: "2–3 engineers" }],
      sortOrder: 2,
    },
    {
      slug: "ai-automation",
      title: "AI & Automation",
      tagline: "Reasoning wired into your operations.",
      description:
        "Retrieval systems, agents and workflow automation that actually ship — grounded on your data, evaluated for quality, and monitored in production.",
      shape: "neural",
      accent: "#9b5cff",
      capabilities: [
        "RAG & knowledge systems",
        "Agent workflows",
        "Document intelligence",
        "Model evaluation harnesses",
        "Cost & latency tuning",
      ],
      technologies: ["OpenAI", "Gemini", "Python", "FastAPI", "pgvector"],
      process: [
        { title: "Ground truth", detail: "Evaluation set built before a single prompt is written." },
        { title: "Retrieval design", detail: "Chunking, ranking and permission-aware context." },
        { title: "Guardrails", detail: "Injection defence, PII redaction, human-in-the-loop." },
      ],
      benefits: ["Measurable accuracy", "Predictable spend", "Auditable outputs"],
      engagement: [{ label: "Typical build", value: "3–8 weeks" }, { label: "Team", value: "1–3 engineers" }],
      sortOrder: 3,
    },
    {
      slug: "cloud-devops",
      title: "Cloud & DevOps",
      tagline: "Infrastructure that ships itself.",
      description:
        "Reproducible environments, CI/CD, observability and cost governance. Your team pushes code; the platform handles the rest.",
      shape: "cloud",
      accent: "#4cc4ff",
      capabilities: [
        "IaC & environment blueprints",
        "Zero-downtime delivery",
        "Observability & SLOs",
        "Cost governance",
        "Backup & DR drills",
      ],
      technologies: ["Docker", "Google Cloud", "DigitalOcean", "GitHub Actions"],
      process: [
        { title: "Baseline", detail: "Current cost, risk and failure modes mapped." },
        { title: "Automation", detail: "Pipelines, previews and rollback paths as code." },
        { title: "Operate", detail: "SLOs, alert routing and incident reviews." },
      ],
      benefits: ["Ship daily safely", "Reduced cloud spend", "Audit-ready"],
      engagement: [{ label: "Typical build", value: "2–6 weeks" }, { label: "Team", value: "1–2 engineers" }],
      sortOrder: 4,
    },
    {
      slug: "ui-ux",
      title: "UI / UX Design",
      tagline: "Clarity you can feel in the first five seconds.",
      description:
        "Research-led product design: flows, prototypes, motion language and accessible design systems that engineers can implement without guesswork.",
      shape: "layers",
      accent: "#c24bff",
      capabilities: [
        "Discovery & research",
        "Flow & wireframe systems",
        "High-fidelity UI",
        "Motion specification",
        "Design tokens",
      ],
      technologies: ["Figma", "Tokens Studio", "Framer", "Rive"],
      process: [
        { title: "Frame", detail: "Jobs, constraints and success metrics agreed." },
        { title: "Prototype", detail: "Interactive flows tested with real users." },
        { title: "Systemise", detail: "Tokens, states, motion and documentation handover." },
      ],
      benefits: ["Higher conversion", "Faster engineering", "Accessible by default"],
      engagement: [{ label: "Typical build", value: "2–5 weeks" }, { label: "Team", value: "1–2 designers" }],
      sortOrder: 5,
    },
    {
      slug: "custom-software",
      title: "Custom Software",
      tagline: "Systems shaped exactly to how you operate.",
      description:
        "ERP, internal tools, integrations and platforms that replace spreadsheet chaos with auditable, permission-aware workflows.",
      shape: "modules",
      accent: "#5b7cff",
      capabilities: [
        "Domain modelling",
        "Multi-tenant platforms",
        "ERP / CRM replacement",
        "Legacy migration",
        "Third-party integrations",
      ],
      technologies: ["Node.js", "PostgreSQL", "TypeScript", "Redis"],
      process: [
        { title: "Domain mapping", detail: "Processes and edge cases documented with your operators." },
        { title: "Vertical slices", detail: "Working software every two weeks, not a big reveal." },
        { title: "Handover", detail: "Docs, runbooks and training for your team." },
      ],
      benefits: ["Replaces manual work", "Own your IP", "Scales with you"],
      engagement: [{ label: "Typical build", value: "8–20 weeks" }, { label: "Team", value: "3–5 engineers" }],
      sortOrder: 6,
    },
  ]);

  /* ---------------- technologies ---------------- */
  const tech = [
    ["React", "Frontend", "#61dafb", "Component runtime powering our interface systems."],
    ["Next.js", "Frontend", "#e9edf9", "App Router, server components, edge rendering."],
    ["TypeScript", "Core", "#3178c6", "End-to-end type safety from schema to screen."],
    ["Flutter", "Mobile", "#45d1fd", "Single codebase, native-grade rendering."],
    ["Node.js", "Backend", "#68a063", "Event-driven services and realtime APIs."],
    ["Python", "Backend", "#ffd845", "Data, ML and automation tooling."],
    ["FastAPI", "Backend", "#05998b", "Typed high-throughput service layer."],
    ["PostgreSQL", "Data", "#4c9aff", "Primary datastore with vector extensions."],
    ["MySQL", "Data", "#f29111", "Managed relational workloads."],
    ["Docker", "Platform", "#2496ed", "Reproducible build artefacts."],
    ["Google Cloud", "Platform", "#ea8600", "Managed compute, storage and AI services."],
    ["DigitalOcean", "Platform", "#0080ff", "Predictable, cost-efficient infrastructure."],
    ["GitHub", "Workflow", "#e9edf9", "Source, review, actions and security scanning."],
    ["OpenAI", "AI", "#10a37f", "Reasoning, vision and speech models."],
    ["Gemini", "AI", "#9b5cff", "Multimodal reasoning for product features."],
  ] as const;

  await db.insert(technologies).values(
    tech.map(([name, category, color, description], i) => ({
      name,
      category,
      color,
      description,
      orbit: 1 + Math.floor(i / 5),
      sortOrder: i,
    })),
  );

  /* ---------------- portfolio ---------------- */
  const img = (id: string) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200`;

  await db.insert(portfolioProjects).values([
    {
      slug: "atlas-operations-cloud",
      title: "Atlas Operations Cloud",
      category: "Enterprise Platform",
      summary: "A unified operations cockpit for a 14-site logistics network, replacing six spreadsheets.",
      heroMediaUrl: img("27141316"),
      accent: "#2e9bff",
      technologies: ["Next.js", "TypeScript", "PostgreSQL", "Docker", "Google Cloud"],
      problem:
        "Fourteen depots ran dispatch on spreadsheets and WhatsApp. Leadership had no single view of capacity, so decisions were made hours after the moment they mattered.",
      solution:
        "A multi-tenant operations platform with live dispatch boards, role-based approvals, offline-tolerant mobile capture and an event-sourced audit trail.",
      architecture: [
        { layer: "Edge", detail: "Next.js server components with regional caching for sub-200ms dashboards." },
        { layer: "Services", detail: "Node.js domain services on Cloud Run with idempotent job queue." },
        { layer: "Data", detail: "PostgreSQL with row-level security per depot; nightly warehouse export." },
        { layer: "Ops", detail: "GitHub Actions → artifact registry → progressive rollout with automatic rollback." },
      ],
      screens: [
        { label: "Dispatch board", detail: "Drag-free, keyboard-first allocation with conflict detection." },
        { label: "Capacity forecast", detail: "14-day projection with scenario sliders." },
        { label: "Audit timeline", detail: "Every state change attributable to a human or a job." },
      ],
      outcome: [
        { label: "Dispatch time", value: "-63%" },
        { label: "Manual reporting", value: "Eliminated" },
        { label: "Go-live", value: "9 weeks" },
      ],
      year: "2025",
      sortOrder: 1,
    },
    {
      slug: "nova-guest-experience",
      title: "Nova Guest Experience",
      category: "Hospitality",
      summary: "Hotel booking and in-stay platform with a 38% lift in direct reservations.",
      heroMediaUrl: img("27141304"),
      accent: "#35d6ff",
      technologies: ["Next.js", "Flutter", "PostgreSQL", "Stripe", "Redis"],
      problem:
        "A 22-property group paid heavy OTA commission because their own booking flow converted at under 1%.",
      solution:
        "Rebuilt the booking journey around three decisions, added a companion in-stay app, and unified inventory with a channel manager integration.",
      architecture: [
        { layer: "Web", detail: "Server-rendered funnel with optimistic availability and edge caching." },
        { layer: "Mobile", detail: "Flutter companion app: mobile key, chat, and upsell offers." },
        { layer: "Integration", detail: "Channel manager webhooks reconciled into a single inventory ledger." },
      ],
      screens: [
        { label: "Room selection", detail: "Compare-by-benefit layout instead of a rate table." },
        { label: "In-stay console", detail: "Service requests, spa booking, and mobile key." },
        { label: "Revenue view", detail: "Direct vs OTA mix, per property and per room type." },
      ],
      outcome: [
        { label: "Direct bookings", value: "+38%" },
        { label: "Checkout completion", value: "+27%" },
        { label: "Support tickets", value: "-41%" },
      ],
      year: "2025",
      sortOrder: 2,
    },
    {
      slug: "sentinel-risk-intelligence",
      title: "Sentinel Risk Intelligence",
      category: "AI & Data",
      summary: "Retrieval-grounded risk assistant that reviews documents 11× faster than manual review.",
      heroMediaUrl: img("30530414"),
      accent: "#9b5cff",
      technologies: ["Python", "FastAPI", "OpenAI", "PostgreSQL", "pgvector"],
      problem:
        "An underwriting team of nine manually read policy documents and claims files, capping growth at their reading speed.",
      solution:
        "A permission-aware retrieval system with citation-first answers, an evaluation harness of 840 labelled cases, and human sign-off built into the flow.",
      architecture: [
        { layer: "Ingestion", detail: "OCR → structure extraction → chunking with provenance metadata." },
        { layer: "Retrieval", detail: "Hybrid BM25 + vector search with tenant-scoped filters." },
        { layer: "Reasoning", detail: "Model routing by task cost with deterministic fallbacks." },
        { layer: "Evaluation", detail: "Nightly regression on labelled set; alerts on accuracy drift." },
      ],
      screens: [
        { label: "Answer workspace", detail: "Citations inline; click any claim to see the source span." },
        { label: "Evaluation console", detail: "Accuracy, latency and cost per model route." },
      ],
      outcome: [
        { label: "Review speed", value: "11×" },
        { label: "Answer accuracy", value: "94.2%" },
        { label: "Cost per case", value: "-52%" },
      ],
      year: "2026",
      sortOrder: 3,
    },
    {
      slug: "orbit-field-workforce",
      title: "Orbit Field Workforce",
      category: "Mobile Product",
      summary: "Offline-first field service app used by 1,900 technicians across low-connectivity regions.",
      heroMediaUrl: img("2653362"),
      accent: "#5b7cff",
      technologies: ["Flutter", "Node.js", "PostgreSQL", "Firebase"],
      problem:
        "Technicians lost work orders in tunnels and rural zones; paperwork was re-entered at the depot every evening.",
      solution:
        "A conflict-aware offline sync engine, photo-based evidence capture, and signature collection that reconciles automatically when connectivity returns.",
      architecture: [
        { layer: "Client", detail: "Flutter with local SQLite queue and deterministic merge rules." },
        { layer: "Sync", detail: "Append-only operation log with server-side conflict resolution." },
        { layer: "Observability", detail: "Per-device sync health dashboard for the operations team." },
      ],
      screens: [
        { label: "Today route", detail: "Sequence-optimised job list with one-tap status." },
        { label: "Job evidence", detail: "Camera, meter readings and signature in a single flow." },
      ],
      outcome: [
        { label: "Data re-entry", value: "Removed" },
        { label: "Same-day closure", value: "+34%" },
        { label: "Devices live", value: "1,900" },
      ],
      year: "2025",
      sortOrder: 4,
    },
  ]);

  /* ---------------- testimonials + faq ---------------- */
  await db.insert(testimonials).values([
    {
      quote:
        "SEVAYO treated our operations problem like an engineering problem, not a feature list. Nine weeks in, dispatch was a third of what it used to be.",
      author: "Rhea Malhotra",
      role: "COO",
      company: "Atlas Logistics",
      sortOrder: 1,
    },
    {
      quote:
        "The clearest technical communication we've had from any partner. Every decision came with the trade-off written down.",
      author: "Daniel Osei",
      role: "VP Engineering",
      company: "Nova Hospitality Group",
      sortOrder: 2,
    },
    {
      quote:
        "They shipped an AI system we can actually audit. Accuracy is measured, not promised.",
      author: "Anika Rao",
      role: "Head of Underwriting",
      company: "Sentinel Assurance",
      sortOrder: 3,
    },
  ]);

  await db.insert(faqs).values([
    {
      question: "How does a SEVAYO engagement start?",
      answer:
        "With a 45-minute discovery call and a written architecture brief. You receive scope, phased milestones, a fixed first-phase price and the risks we see — before you commit to a full build.",
      sortOrder: 1,
    },
    {
      question: "Do you work with early-stage founders?",
      answer:
        "Yes. We shape an MVP around the single riskiest assumption, ship it in weeks, and instrument it so the next decision is evidence-based rather than opinion-based.",
      sortOrder: 2,
    },
    {
      question: "Who owns the code and the IP?",
      answer:
        "You do. Full repository access from day one, infrastructure in your accounts, and documentation handed over at every milestone.",
      sortOrder: 3,
    },
    {
      question: "How do you handle security and compliance?",
      answer:
        "Threat modelling at design time, secrets management, dependency scanning in CI, role-based access control, encrypted data at rest and in transit, plus an auditable action log for sensitive operations.",
      sortOrder: 4,
    },
    {
      question: "What happens after launch?",
      answer:
        "A support plan with defined SLOs: monitoring, incident response, dependency upgrades and a monthly improvement cycle tied to real usage data.",
      sortOrder: 5,
    },
  ]);

  await db
    .insert(siteSettings)
    .values([
    {
      key: "site",
      value: {
        company: {
          name: "SEVAYO",
          email: "hello@sevayo.dev",
          phone: "+91 90000 00000",
          address: "Remote-first · India · Serving EU & US time zones",
          hours: "Mon–Fri · 09:30–19:00 IST",
        },
        social: [
          { label: "LinkedIn", href: "https://www.linkedin.com" },
          { label: "GitHub", href: "https://github.com" },
          { label: "X", href: "https://x.com" },
        ],
        nav: [
          { label: "Work", href: "/work" },
          { label: "Services", href: "/services" },
          { label: "Process", href: "/process" },
          { label: "About", href: "/#about" },
          { label: "Contact", href: "/contact" },
        ],
        seo: {
          title: "SEVAYO — Ideas Into Software",
          description:
            "SEVAYO is a software development and technology company turning ideas into production-grade web, mobile, AI and cloud products.",
          keywords:
            "software development company, custom software engineering, AI automation, cloud devops, product design, SEVAYO",
          canonical: "https://sevayo.dev",
        },
        stats: [
          { label: "Products shipped", value: "48" },
          { label: "Delivery velocity", value: "2.4×" },
          { label: "Client retention", value: "94%" },
          { label: "Uptime managed", value: "99.98%" },
        ],
      },
    },
      { key: "mail", value: { to: "sevayo.tech@gmail.com", fromName: "SEVAYO Website", enabled: true } },
    ])
    .onConflictDoNothing();

  /* ---------------- people ---------------- */
  const adminRows = await db.select().from(users).where(eq(users.email, "admin@sevayo.dev")).limit(1);
  const admin = adminRows.length ? adminRows : await db
    .insert(users)
    .values({
      email: "admin@sevayo.dev",
      passwordHash: hashPassword("Sevayo@2026"),
      name: "Aarav Mehta",
      role: "admin",
      jobTitle: "Founder & Principal Engineer",
      company: "SEVAYO",
    })
    .returning();

  const clientRows = await db.select().from(users).where(eq(users.email, "client@atlas.dev")).limit(1);
  const clientUser = clientRows.length ? clientRows : await db
    .insert(users)
    .values({
      email: "client@atlas.dev",
      passwordHash: hashPassword("Client@2026"),
      name: "Rhea Malhotra",
      role: "client",
      jobTitle: "COO",
      company: "Atlas Logistics",
      phone: "+91 98200 11223",
    })
    .returning();

  const existingClient = await db.select().from(clients).where(eq(clients.userId, clientUser[0].id)).limit(1);
  const clientRow = existingClient.length ? existingClient : await db
    .insert(clients)
    .values({
      userId: clientUser[0].id,
      company: "Atlas Logistics",
      industry: "Logistics & Supply Chain",
      website: "https://atlas.example.com",
      notes: "Multi-site operations, 14 depots, security review required each quarter.",
    })
    .returning();

  await db.insert(leads).values([
    {
      name: "Kabir Shah",
      email: "kabir@fintrail.io",
      company: "Fintrail",
      projectType: "ai-automation",
      idea: "Automated KYC document review with human approval queue.",
      timeline: "1-3 months",
      budget: "25k-75k",
      status: "qualified",
      score: 78,
    },
    {
      name: "Meera Iyer",
      email: "meera@bloomcare.health",
      company: "Bloomcare",
      projectType: "mobile-applications",
      idea: "Patient companion app with appointment reminders and lab results.",
      timeline: "3-6 months",
      budget: "75k-150k",
      status: "new",
      score: 64,
    },
  ]);

  /* ---------------- delivery data ---------------- */
  const project = await db
    .insert(projects)
    .values({
      clientId: clientRow[0].id,
      name: "Atlas Operations Cloud",
      slug: "atlas-operations-cloud",
      description: "Unified dispatch, capacity and audit platform for 14 depots.",
      stage: "build",
      status: "active",
      health: "on-track",
      progress: 62,
      accent: "#2e9bff",
      dueAt: new Date(Date.now() + 45 * 864e5),
    })
    .returning();

  const pid = project[0].id;

  await db.insert(projectTasks).values([
    { projectId: pid, title: "Depot row-level security policies", status: "done", phase: "build", priority: "high", assignee: "Aarav M." },
    { projectId: pid, title: "Capacity forecast API + caching", status: "doing", phase: "build", priority: "high", assignee: "Ishaan K." },
    { projectId: pid, title: "Offline capture sync spec", status: "review", phase: "design", priority: "normal", assignee: "Nikita R." },
    { projectId: pid, title: "Load test 5k concurrent dispatch events", status: "todo", phase: "test", priority: "normal", assignee: "SEVAYO QA" },
  ]);

  await db.insert(milestones).values([
    { projectId: pid, title: "Discovery & architecture brief", status: "done", progress: 100, sortOrder: 1, dueAt: new Date(Date.now() - 60 * 864e5) },
    { projectId: pid, title: "Design system + dispatch board", status: "done", progress: 100, sortOrder: 2, dueAt: new Date(Date.now() - 30 * 864e5) },
    { projectId: pid, title: "Capacity & forecasting engine", status: "active", progress: 65, sortOrder: 3, dueAt: new Date(Date.now() + 12 * 864e5) },
    { projectId: pid, title: "Pilot at 3 depots", status: "upcoming", progress: 0, sortOrder: 4, dueAt: new Date(Date.now() + 34 * 864e5) },
    { projectId: pid, title: "Network-wide launch", status: "upcoming", progress: 0, sortOrder: 5, dueAt: new Date(Date.now() + 45 * 864e5) },
  ]);

  await db.insert(requirements).values([
    { projectId: pid, code: "REQ-001", title: "Depot-scoped access", detail: "Every record is scoped to a depot; supervisors may view only their own depot.", priority: "must", status: "done" },
    { projectId: pid, code: "REQ-002", title: "Conflict-free allocation", detail: "Two dispatchers cannot allocate the same vehicle without an explicit override.", priority: "must", status: "building" },
    { projectId: pid, code: "REQ-003", title: "Capacity forecast", detail: "14-day projection with per-depot and per-vehicle-class granularity.", priority: "should", status: "building" },
    { projectId: pid, code: "REQ-004", title: "Immutable audit timeline", detail: "Append-only event log exportable for compliance review.", priority: "must", status: "agreed" },
  ]);

  await db.insert(ideas).values([
    { userId: clientUser[0].id, projectId: pid, title: "Predictive maintenance alerts from telematics", description: "Use vehicle sensor feeds to pre-empt breakdown windows.", status: "reviewing" },
    { userId: clientUser[0].id, title: "Driver scorecards", description: "Monthly scorecard with fuel efficiency and route adherence.", status: "captured" },
  ]);

  await db.insert(documents).values([
    { projectId: pid, name: "Architecture brief v2.1.pdf", category: "architecture", sizeLabel: "2.4 MB" },
    { projectId: pid, name: "Design system tokens.json", category: "design", sizeLabel: "84 KB" },
    { projectId: pid, name: "Sprint-6 demo recording", category: "meeting", externalUrl: "https://example.com/demo", sizeLabel: "Link" },
  ]);

  await db.insert(messages).values([
    { projectId: pid, authorLabel: "Aarav Mehta", audience: "client", body: "Forecast engine is on staging — 3 depots loaded with real data. Feedback welcome before we roll to the rest." },
    { projectId: pid, authorId: clientUser[0].id, authorLabel: "Rhea Malhotra", audience: "admin", body: "Reviewed with the ops leads. Can we add a depot-level override for the weekend pattern?" },
    { projectId: pid, authorLabel: "Aarav Mehta", audience: "client", body: "Yes — scheduled as REQ-005, landing in the next increment." },
  ]);

  await db.insert(meetings).values([
    { projectId: pid, title: "Sprint 6 review", agenda: "Forecast engine walkthrough, depot override decision", scheduledAt: new Date(Date.now() + 3 * 864e5), durationMins: 45, joinUrl: "https://meet.example.com/sevayo-atlas" },
    { projectId: pid, title: "Security review", agenda: "Row-level security + audit export", scheduledAt: new Date(Date.now() + 9 * 864e5), durationMins: 60, status: "scheduled" },
  ]);

  const invoice = await db
    .insert(invoices)
    .values([
      { clientId: clientRow[0].id, projectId: pid, number: "SVY-2026-014", amountCents: 850000, status: "paid", issuedAt: new Date(Date.now() - 40 * 864e5), dueAt: new Date(Date.now() - 25 * 864e5), lineItems: [{ label: "Phase 1 — Architecture & design system", amountCents: 850000 }] },
      { clientId: clientRow[0].id, projectId: pid, number: "SVY-2026-021", amountCents: 1250000, status: "sent", issuedAt: new Date(Date.now() - 6 * 864e5), dueAt: new Date(Date.now() + 9 * 864e5), lineItems: [{ label: "Phase 2 — Capacity engine (50%)", amountCents: 1250000 }] },
    ])
    .returning();

  await db.insert(payments).values({
    invoiceId: invoice[0].id,
    amountCents: 850000,
    method: "bank-transfer",
    reference: "UTR-8842190",
    paidAt: new Date(Date.now() - 27 * 864e5),
  });

  await db.insert(notifications).values([
    { userId: clientUser[0].id, title: "Sprint 6 is on staging", body: "Capacity forecast engine deployed to the staging environment.", kind: "success", href: "/portal/projects" },
    { userId: clientUser[0].id, title: "Invoice SVY-2026-021 issued", body: "Due in 9 days.", kind: "info", href: "/portal/invoices" },
    { userId: admin[0].id, audience: "admin", title: "New lead: Fintrail", body: "AI document review, budget 25k–75k.", kind: "lead", href: "/admin/leads" },
  ]);

  await db.insert(siteSettings).values({ key: "seed", value: { version: SEED_VERSION } });
}
