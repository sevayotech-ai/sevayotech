import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjects, getSiteConfig } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { PublicShell } from "@/components/site/PublicShell";
import { Badge, GlassPanel, MagneticLink, Reveal } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Case study not found" };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.title} · SEVAYO case study`,
      description: project.summary,
      images: project.heroMediaUrl ? [{ url: project.heroMediaUrl }] : undefined,
    },
  };
}

const STAGES = [
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Solution" },
  { key: "architecture", label: "Architecture" },
  { key: "technology", label: "Technology" },
  { key: "screens", label: "Screens" },
  { key: "results", label: "Results" },
];

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, config, brand, all] = await Promise.all([
    getProject(slug),
    getSiteConfig(),
    resolveBrand(),
    getProjects(),
  ]);

  if (!project) notFound();
  const next = all.find((item) => item.slug !== project.slug);

  return (
    <PublicShell
      items={config.nav}
      company={config.company}
      social={config.social}
      tagline={brand.tagline}
      glow={project.accent}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            about: project.category,
            description: project.summary,
            creator: { "@type": "Organization", name: brand.brandName },
            dateCreated: project.year,
          }),
        }}
      />

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <Link href="/work" className="text-xs uppercase tracking-[0.2em] text-mute transition hover:text-ink">
            ← All work
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge>{project.category}</Badge>
            <span className="mono text-[11px] text-mute">{project.year}</span>
          </div>
          <h1 className="headline mt-4 max-w-3xl">{project.title}</h1>
          <p className="lede mt-5">{project.summary}</p>
        </Reveal>

        <Reveal>
          <div className="glass mt-12 overflow-hidden rounded-[26px]">
            {project.heroMediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.heroMediaUrl} alt={project.title} className="h-[46vh] w-full object-cover" />
            ) : null}
          </div>
        </Reveal>

        <ol className="mt-10 flex flex-wrap gap-2">
          {STAGES.map((stage, i) => (
            <li key={stage.key}>
              <a
                href={`#${stage.key}`}
                className="hairline inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-2 text-[12px] text-mute transition hover:bg-white/[0.08] hover:text-ink"
              >
                <span className="mono" style={{ color: project.accent }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {stage.label}
              </a>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6">
          <Reveal>
            <GlassPanel id="problem" className="scroll-mt-32 p-8">
              <p className="eyebrow">01 — Problem</p>
              <p className="mt-4 text-[15px] leading-relaxed text-ink/90">{project.problem}</p>
            </GlassPanel>
          </Reveal>

          <Reveal>
            <GlassPanel id="solution" className="scroll-mt-32 p-8">
              <p className="eyebrow">02 — Solution</p>
              <p className="mt-4 text-[15px] leading-relaxed text-ink/90">{project.solution}</p>
            </GlassPanel>
          </Reveal>

          <Reveal>
            <GlassPanel id="architecture" className="scroll-mt-32 p-8">
              <p className="eyebrow">03 — Architecture</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {project.architecture.map((layer, i) => (
                  <div key={layer.layer} className="rounded-2xl border border-line bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                      <span className="mono text-[11px]" style={{ color: project.accent }}>
                        L{i + 1}
                      </span>
                      <p className="text-sm font-medium">{layer.layer}</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{layer.detail}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal>
            <GlassPanel id="technology" className="scroll-mt-32 p-8">
              <p className="eyebrow">04 — Technology</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <li key={tech} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-mute">
                    {tech}
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </Reveal>

          <Reveal>
            <GlassPanel id="screens" className="scroll-mt-32 p-8">
              <p className="eyebrow">05 — Screens</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {project.screens.map((screen) => (
                  <div key={screen.label} className="overflow-hidden rounded-2xl border border-line bg-white/[0.02]">
                    <div
                      className="h-28"
                      style={{
                        background: `linear-gradient(135deg, ${project.accent}33, transparent 60%), radial-gradient(80% 80% at 20% 10%, ${project.accent}22, transparent)`,
                      }}
                    />
                    <div className="p-4">
                      <p className="text-sm font-medium">{screen.label}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{screen.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal>
            <GlassPanel id="results" className="scroll-mt-32 p-8">
              <p className="eyebrow">06 — Results</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {project.outcome.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-line bg-white/[0.03] p-6">
                    <p className="mono text-3xl font-semibold" style={{ color: project.accent }}>
                      {item.value}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-mute">{item.label}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </Reveal>
        </div>

        <Reveal>
          <div className="glass mt-16 flex flex-col items-start gap-6 rounded-[26px] p-9 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="title">Facing something similar?</h2>
              <p className="mt-2 text-sm text-mute">We&apos;ll map your version of this problem in a 45-minute call.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {next ? (
                <MagneticLink href={`/work/${next.slug}`} variant="ghost">
                  Next case study
                </MagneticLink>
              ) : null}
              <MagneticLink href="/contact">Start Your Project</MagneticLink>
            </div>
          </div>
        </Reveal>
      </div>
    </PublicShell>
  );
}
