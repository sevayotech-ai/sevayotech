import type { Metadata } from "next";
import Link from "next/link";
import { getSections, getServices, getSiteConfig, sectionText } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { PublicShell } from "@/components/site/PublicShell";
import { GlassPanel, MagneticLink, Reveal } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Services",
    description:
      "Web development, mobile applications, AI & automation, cloud & DevOps, UI/UX and custom software — engineered by SEVAYO.",
    alternates: { canonical: "/services" },
  };
}

export default async function ServicesPage() {
  const [services, config, sections, brand] = await Promise.all([
    getServices(),
    getSiteConfig(),
    getSections("services"),
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
          <p className="eyebrow">{copy.eyebrow || "Capabilities"}</p>
          <h1 className="headline mt-3 max-w-3xl">
            {copy.title || "A connected service ecosystem"}
          </h1>
          <p className="lede mt-5">
            {copy.subtitle ||
              "Each capability is a live node in the SEVAYO environment. Open one to see how we execute it end to end."}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 70}>
              <Link href={`/services/${service.slug}`} className="glass spatial-card block h-full rounded-[22px] p-6">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-semibold"
                  style={{ background: `${service.accent}1f`, color: service.accent, boxShadow: `0 0 34px -14px ${service.accent}` }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="title mt-5">{service.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mute">{service.tagline}</p>
                <ul className="mt-5 grid gap-1.5">
                  {service.capabilities.slice(0, 5).map((capability) => (
                    <li key={capability} className="flex items-start gap-2 text-[13px] text-mute">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: service.accent }} />
                      {capability}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-mute">Open service →</p>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <GlassPanel className="mt-16 flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {cta.eyebrow ? <p className="eyebrow">{cta.eyebrow}</p> : null}
              <h2 className="title">{cta.title || "Not sure which capability you need?"}</h2>
              <p className="mt-2 text-sm text-mute">
                {cta.subtitle || "Start with the outcome. We'll map the shortest path from your idea to production software."}
              </p>
            </div>
            <MagneticLink href="/contact">Start Your Project</MagneticLink>
          </GlassPanel>
        </Reveal>
      </div>
    </PublicShell>
  );
}

