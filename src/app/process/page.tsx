import type { Metadata } from "next";
import { getSections, getSiteConfig, sectionText } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { PublicShell } from "@/components/site/PublicShell";
import { ProcessJourney } from "@/components/home/ProcessJourney";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Process",
    description:
      "Seven stages from idea to production: discover, define, design, build, test, launch, support. SEVAYO's delivery process explained.",
    alternates: { canonical: "/process" },
  };
}

/** Fallback only — stages are edited in Admin → CMS → Journeys. */
const FALLBACK_STAGES = [
  { title: "Discover", detail: "Stakeholder interviews, system constraints, success metrics. We leave with a written problem statement, not a hunch." },
  { title: "Define", detail: "Architecture brief, scope boundaries, phased milestones, named risks and a fixed first-phase price." },
  { title: "Design", detail: "Flows, interface system, motion language, accessibility spec. Prototypes tested with real users." },
  { title: "Build", detail: "Typed, reviewed code delivered in vertical slices. You click working software every two weeks." },
  { title: "Test", detail: "Unit, integration, load, accessibility and security validation — automated in CI, not at the end." },
  { title: "Launch", detail: "Reproducible pipelines, staged rollout, observability dashboards and rollback paths." },
  { title: "Support", detail: "SLOs, monitoring, dependency upgrades and a monthly improvement cycle driven by usage data." },
];

export default async function ProcessPage() {
  const [config, sections, brand] = await Promise.all([getSiteConfig(), getSections("process"), resolveBrand()]);
  const copy = sectionText(sections.hero);
  const stored = (sections.hero?.data ?? {}) as { stages?: { title: string; detail: string }[] };
  const source = stored.stages?.length ? stored.stages : FALLBACK_STAGES;
  const stages = source.map((stage, index) => ({
    step: String(index + 1).padStart(2, "0"),
    title: stage.title,
    detail: stage.detail,
  }));

  return (
    <PublicShell
      items={config.nav}
      company={config.company}
      social={config.social}
      tagline={brand.tagline}
      glow={brand.accent}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <p className="eyebrow">{copy.eyebrow || "Process"}</p>
        <h1 className="headline mt-3 max-w-3xl">{copy.title || "Seven stages, zero ambiguity"}</h1>
        <p className="lede mt-5">
          {copy.subtitle || "The camera travels the path below exactly as your project does. Each stage has an owner, an output and a definition of done."}
        </p>
      </div>

      <ProcessJourney stages={stages} accent={brand.accent} accent2={brand.accent2} />
    </PublicShell>
  );
}
