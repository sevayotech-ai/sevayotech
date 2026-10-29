import type { Metadata } from "next";
import { getMailSettings, getSections, getSiteConfig, sectionText } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { PublicShell } from "@/components/site/PublicShell";
import { StartProjectWizard } from "@/components/forms/StartProjectWizard";
import { Reveal } from "@/components/ui/kit";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Start your project",
    description: "Tell SEVAYO about your idea. Five steps, one business day response, written architecture brief.",
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const [config, brand, sections, mail] = await Promise.all([
    getSiteConfig(),
    resolveBrand(),
    getSections("contact"),
    getMailSettings(),
  ]);
  const copy = sectionText(sections.hero);

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
          <p className="eyebrow">{copy.eyebrow || "Project workspace"}</p>
          <h1 className="headline mt-3 max-w-3xl">
            {copy.title || "Let's build"} <span className="accent-text">your idea</span>.
          </h1>
          <p className="lede mt-5">
            {copy.subtitle ||
              "This is the same workspace our clients use. Five short steps, then a senior engineer reviews your brief and replies with next steps — not a sales script."}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-mute">
            Briefs are emailed to {mail.to}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <Reveal>
            <StartProjectWizard />
          </Reveal>

          <div className="grid gap-4">
            <Reveal delay={80}>
              <div className="glass rounded-[22px] p-6">
                <p className="eyebrow">Direct line</p>
                <ul className="mt-4 grid gap-3 text-sm">
                  <li>
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-mute">Email</span>
                    <a href={`mailto:${config.company.email}`} className="text-ink transition hover:text-primary">
                      {config.company.email}
                    </a>
                  </li>
                  <li>
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-mute">Phone</span>
                    <span className="text-ink">{config.company.phone}</span>
                  </li>
                  <li>
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-mute">Hours</span>
                    <span className="text-ink">{config.company.hours}</span>
                  </li>
                  <li>
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-mute">Base</span>
                    <span className="text-ink">{config.company.address}</span>
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="glass rounded-[22px] p-6">
                <p className="eyebrow">What happens next</p>
                <ol className="mt-4 grid gap-4 text-sm">
                  {[
                    "We read your brief and reply with clarifying questions.",
                    "45-minute discovery call — constraints, risks, success metrics.",
                    "Written architecture brief with phased milestones and pricing.",
                  ].map((item, i) => (
                    <li key={item} className="flex gap-3">
                      <span className="mono text-xs" style={{ color: brand.accent }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-mute">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div className="glass rounded-[22px] p-6">
                <p className="eyebrow">Already a client?</p>
                <p className="mt-3 text-sm text-mute">
                  Sign in to your workspace to see milestones, requirements, documents and invoices.
                </p>
                <a href="/login" className="btn btn-ghost mt-5 !py-2.5 !text-[13px]">
                  Client Login
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
