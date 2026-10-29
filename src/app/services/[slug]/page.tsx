import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, getServices, getSiteConfig } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { PublicShell } from "@/components/site/PublicShell";
import { GlassPanel, MagneticLink, Reveal } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.title,
    description: service.tagline || service.description.slice(0, 155),
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.title} · SEVAYO`, description: service.tagline },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, config, brand, all] = await Promise.all([
    getService(slug),
    getSiteConfig(),
    resolveBrand(),
    getServices(),
  ]);

  if (!service) notFound();

  const others = all.filter((item) => item.slug !== service.slug).slice(0, 3);

  return (
    <PublicShell
      items={config.nav}
      company={config.company}
      social={config.social}
      tagline={brand.tagline}
      glow={service.accent}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.description,
            provider: { "@type": "Organization", name: brand.brandName },
            areaServed: "Worldwide",
          }),
        }}
      />

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <Link href="/services" className="text-xs uppercase tracking-[0.2em] text-mute transition hover:text-ink">
            ← All services
          </Link>
          <p className="eyebrow mt-6" style={{ color: service.accent }}>
            Service
          </p>
          <h1 className="headline mt-3 max-w-3xl">{service.title}</h1>
          <p className="lede mt-5">{service.description}</p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div className="grid gap-6">
            <Reveal>
              <GlassPanel className="p-7">
                <p className="eyebrow">Capabilities</p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {service.capabilities.map((capability) => (
                    <li key={capability} className="flex items-start gap-3 text-sm text-mute">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: service.accent }} />
                      {capability}
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            </Reveal>

            <Reveal>
              <GlassPanel className="p-7">
                <p className="eyebrow">How we execute</p>
                <ol className="mt-5 grid gap-5">
                  {service.process.map((step, i) => (
                    <li key={step.title} className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-5">
                      <span className="mono text-xs tracking-[0.24em]" style={{ color: service.accent }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-mute">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </GlassPanel>
            </Reveal>

            <Reveal>
              <GlassPanel className="p-7">
                <p className="eyebrow">Why it matters</p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="rounded-2xl border border-line bg-white/[0.03] p-4 text-sm text-mute">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            </Reveal>
          </div>

          <div className="grid gap-6">
            <Reveal delay={80}>
              <GlassPanel className="p-7">
                <p className="eyebrow">Technologies</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {service.technologies.map((tech) => (
                    <li key={tech} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-mute">
                      {tech}
                    </li>
                  ))}
                </ul>
                <Link href="/#technology" className="mt-5 inline-block text-xs uppercase tracking-[0.2em] text-mute hover:text-ink">
                  See the ecosystem →
                </Link>
              </GlassPanel>
            </Reveal>

            <Reveal delay={140}>
              <GlassPanel className="p-7">
                <p className="eyebrow">Engagement</p>
                <dl className="mt-4 grid gap-3">
                  {service.engagement.map((item) => (
                    <div key={item.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-xs uppercase tracking-[0.16em] text-mute">{item.label}</dt>
                      <dd className="mono text-sm text-ink">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <MagneticLink href="/contact" className="mt-6 w-full justify-center">
                  Start Your Project
                </MagneticLink>
              </GlassPanel>
            </Reveal>

            <Reveal delay={200}>
              <GlassPanel className="p-7">
                <p className="eyebrow">Related services</p>
                <ul className="mt-4 grid gap-3">
                  {others.map((item) => (
                    <li key={item.id}>
                      <Link href={`/services/${item.slug}`} className="group flex items-center justify-between gap-4">
                        <span className="text-sm text-mute transition group-hover:text-ink">{item.title}</span>
                        <span className="text-mute transition group-hover:translate-x-1">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            </Reveal>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
