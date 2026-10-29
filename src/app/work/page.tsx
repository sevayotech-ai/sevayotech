import type { Metadata } from "next";
import Link from "next/link";
import { getProjects, getSections, getSiteConfig, sectionText } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { PublicShell } from "@/components/site/PublicShell";
import { Badge, GlassPanel, MagneticLink, Reveal } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Work",
    description: "SEVAYO case studies: enterprise platforms, hospitality products, AI systems and mobile products in production.",
    alternates: { canonical: "/work" },
  };
}

export default async function WorkPage() {
  const [projects, config, sections, brand] = await Promise.all([
    getProjects(),
    getSiteConfig(),
    getSections("work"),
    resolveBrand(),
  ]);
  const copy = sectionText(sections.hero);
  const cta = sectionText(sections.cta);

  return (
    <PublicShell
      items={config.nav}
      company={config.company}
      social={config.social}
      tagline={brand.tagline}
      glow={brand.accent}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <p className="eyebrow">{copy.eyebrow || "Portfolio"}</p>
          <h1 className="headline mt-3 max-w-3xl">{copy.title || "Products in production, not mockups"}</h1>
          <p className="lede mt-5">
            {copy.subtitle ||
              "Every panel below is a shipped system with real users. Open a case study to read the architecture, the trade-offs and the outcome."}
        </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={i * 90}>
              <Link href={`/work/${project.slug}`} className="glass spatial-card block h-full overflow-hidden rounded-[22px]">
                <div className="relative h-60 overflow-hidden">
                  {project.heroMediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.heroMediaUrl}
                      alt={project.title}
                      className="h-full w-full object-cover opacity-75 transition duration-700 hover:scale-105 hover:opacity-95"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(4,5,10,0.1), #04050a 94%)" }} />
                  <span className="absolute left-4 top-4">
                    <Badge>{project.category}</Badge>
                  </span>
                  <span className="absolute right-4 top-4 mono text-[11px] text-mute">{project.year}</span>
                </div>
                <div className="p-6">
                  <h2 className="title">{project.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{project.summary}</p>
                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                    {project.outcome.slice(0, 3).map((item) => (
                      <div key={item.label}>
                        <p className="mono text-base font-semibold" style={{ color: project.accent }}>
                          {item.value}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-mute">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <GlassPanel className="mt-16 flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {cta.eyebrow ? <p className="eyebrow">{cta.eyebrow}</p> : null}
              <h2 className="title">{cta.title || "Your product could be the next panel here."}</h2>
              <p className="mt-2 text-sm text-mute">
                {cta.subtitle || "Tell us the problem. We'll tell you the shortest safe path."}
              </p>
            </div>
            <MagneticLink href="/contact">Start Your Project</MagneticLink>
          </GlassPanel>
        </Reveal>
      </div>
    </PublicShell>
  );
}
