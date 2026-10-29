"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { SceneContainer, type WorldConfig } from "@/components/three/SceneContainer";
import { useSceneObserver } from "@/components/three/xr";
import { Badge, GlassPanel, MagneticLink, Reveal, Section, SectionHeading } from "@/components/ui/kit";
import { BrandEventBadge } from "@/components/site/BrandLogo";
import { useBrand } from "@/components/site/BrandProvider";

export type HomeData = {
  hero: { eyebrow: string; title: string; subtitle: string; ctas: string[] };
  intro: { eyebrow: string; title: string; subtitle: string };
  servicesCopy: { eyebrow: string; title: string; subtitle: string };
  ideaCopy: { eyebrow: string; title: string; subtitle: string };
  processCopy: { eyebrow: string; title: string; subtitle: string };
  aboutCopy: { eyebrow: string; title: string; subtitle: string; bullets: string[] };
  contactCopy: { eyebrow: string; title: string; subtitle: string };
  stats: { label: string; value: string }[];
  ideaStages: { label: string; detail: string }[];
  processStages: { step: string; title: string; detail: string }[];
  services: {
    id: string;
    slug: string;
    title: string;
    tagline: string;
    description: string;
    shape: string;
    accent: string;
    capabilities: string[];
  }[];
  projects: {
    slug: string;
    title: string;
    category: string;
    summary: string;
    image?: string;
    accent: string;
    technologies: string[];
    outcome: { label: string; value: string }[];
  }[];
  tech: { name: string; color: string; category: string; description: string; orbit: number }[];
  quotes: { quote: string; author: string; role: string; company: string }[];
  faqs: { question: string; answer: string }[];
};

function track(name: string, meta: Record<string, unknown> = {}) {
  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, path: window.location.pathname, meta }),
      keepalive: true,
    });
  } catch {
    /* analytics must never break UX */
  }
}

/* ================================================================
   Home experience
   ================================================================ */

export function HomeExperience({ data, config }: { data: HomeData; config: WorldConfig }) {
  const brand = useBrand();
  const [activeService, setActiveService] = useState(0);
  const [activeTech, setActiveTech] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const ideaRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ideaRef, offset: ["start end", "end start"] });
  const morph = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);
  const [ideaStage, setIdeaStage] = useState(0);

  const stages = data.ideaStages.length ? data.ideaStages : [{ label: "Idea", detail: "" }];

  useEffect(() => {
    const unsubscribe = morph.on("change", (value) => {
      setIdeaStage(Math.min(stages.length - 1, Math.floor(value * stages.length)));
    });
    return () => unsubscribe();
  }, [morph, stages.length]);

  useSceneObserver("hero");
  useSceneObserver("services");

  const heroTitle = brand.event?.heroTitle || data.hero.title;
  const heroSubtitle = brand.event?.heroSubtitle || data.hero.subtitle;
  const [primaryCta, secondaryCta] = data.hero.ctas.length ? data.hero.ctas : ["Start Your Project", "Explore SEVAYO"];

  return (
    <>
      {/* 3D universe — persistent, behind all content */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <SceneContainer
          config={config}
          activeService={activeService}
          activeTech={activeTech}
          activeProject={activeProject}
          onService={(index) => setActiveService(index)}
          onTech={(name) => setActiveTech((current) => (current === name ? null : name))}
          onProject={(index) => setActiveProject(index)}
        />
      </div>

      <ProgressRail />

      <main id="main" className="pointer-events-none relative z-10">
        {/* ---------------- HERO ---------------- */}
        <Section id="hero" index={0} className="min-h-[100svh]">
          <div className="pointer-events-none pt-28 text-center sm:pt-32">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto flex max-w-4xl flex-col items-center"
            >
              <div className="pointer-events-auto flex items-center gap-3">
                <BrandEventBadge />
                <span className="eyebrow">{data.hero.eyebrow}</span>
              </div>
              <h1 className="display mt-6">
                <span className="accent-text">{heroTitle}</span>
              </h1>
              <p className="lede mx-auto mt-6 text-center">{heroSubtitle}</p>
              <div className="pointer-events-auto mt-9 flex flex-wrap items-center justify-center gap-3">
                <MagneticLink href="/contact">{primaryCta}</MagneticLink>
                <MagneticLink href="#services" variant="ghost">
                  {secondaryCta}
                </MagneticLink>
              </div>
              <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                {data.stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="mono text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-mute">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-mute/70">Scroll to travel</p>
            <div className="mx-auto mt-3 h-10 w-px bg-gradient-to-b from-white/50 to-transparent" />
          </div>
        </Section>

        {/* ---------------- INTRO / TRUST ---------------- */}
        <Section id="intro" index={1}>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">{data.intro.eyebrow}</p>
              <h2 className="headline mt-3">{data.intro.title}</h2>
              <p className="lede mt-5">{data.intro.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <MagneticLink href="/process" variant="ghost">
                  See how we work
                </MagneticLink>
                <MagneticLink href="/work" variant="ghost">
                  Explore our work
                </MagneticLink>
              </div>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Architecture first", body: "Decisions written down before a line of code, with trade-offs you can challenge." },
                { title: "Working software", body: "Vertical slices you can click every two weeks. No big reveal at the end." },
                { title: "Own everything", body: "Your repositories, your infrastructure, your IP — from day one." },
                { title: "Built to operate", body: "Observability, SLOs and a support plan that outlasts the launch." },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 90}>
                  <GlassPanel interactive className="h-full p-5">
                    <h3 className="title text-[15px]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{item.body}</p>
                  </GlassPanel>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        {/* ---------------- SERVICES ---------------- */}
        <Section id="services" index={2}>
          <Reveal>
            <SectionHeading eyebrow={data.servicesCopy.eyebrow} title={data.servicesCopy.title} subtitle={data.servicesCopy.subtitle} />
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.services.map((service, i) => (
              <Reveal key={service.id} delay={i * 70}>
                <Link
                  href={`/services/${service.slug}`}
                  onPointerEnter={() => setActiveService(i)}
                  onFocus={() => setActiveService(i)}
                  onClick={() => track("service_view", { slug: service.slug })}
                  className="glass spatial-card group pointer-events-auto block h-full rounded-[22px] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold"
                      style={{ background: `${service.accent}1f`, color: service.accent, boxShadow: `0 0 30px -12px ${service.accent}` }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-mute transition group-hover:text-ink">
                      Open →
                    </span>
                  </div>
                  <h3 className="title mt-5">{service.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{service.tagline}</p>
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {service.capabilities.slice(0, 3).map((cap) => (
                      <li key={cap} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-mute">
                        {cap}
                      </li>
                    ))}
                  </ul>
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ---------------- IDEA → SOFTWARE ---------------- */}
        <div ref={ideaRef} id="idea" className="pointer-events-none relative flex min-h-[220vh] items-start">
          <div className="sticky top-0 flex min-h-screen w-full items-center px-4 sm:px-6">
            <div className="mx-auto w-full max-w-6xl">
              <p className="eyebrow">{data.ideaCopy.eyebrow}</p>
              <h2 className="headline mt-3 max-w-2xl">{data.ideaCopy.title}</h2>
              <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="pointer-events-auto">
                  <ul className="grid gap-2">
                    {stages.map((stage, i) => {
                      const active = i === ideaStage;
                      return (
                        <li
                          key={`${stage.label}-${i}`}
                          className={`hairline rounded-2xl px-4 py-3 transition-all duration-500 ${
                            active ? "bg-white/[0.08]" : "bg-white/[0.02]"
                          }`}
                          style={active ? { borderColor: `${brand.accent}66` } : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-1.5 w-1.5 rounded-full transition-all duration-500"
                              style={{
                                background: active ? brand.accent : "rgba(255,255,255,0.25)",
                                boxShadow: active ? `0 0 12px ${brand.accent}` : "none",
                              }}
                            />
                            <span className={`text-sm ${active ? "text-ink" : "text-mute"}`}>{stage.label}</span>
                          </div>
                          <AnimatePresence initial={false}>
                            {active ? (
                              <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden pl-4 text-sm leading-relaxed text-mute"
                              >
                                <span className="block pt-2">{stage.detail}</span>
                              </motion.p>
                            ) : null}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="pointer-events-auto hidden lg:block">
                  <GlassPanel className="p-6">
                    <p className="eyebrow">
                      Stage {String(ideaStage + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
                    </p>
                    <p className="title mt-3">{stages[ideaStage]?.label}</p>
                    <p className="mt-3 text-sm leading-relaxed text-mute">{stages[ideaStage]?.detail}</p>
                    <div className="mt-6 h-px w-full" style={{ background: `linear-gradient(90deg, ${brand.accent}, transparent)` }} />
                    <p className="mt-6 text-xs uppercase tracking-[0.24em] text-mute">
                      {ideaStage >= stages.length - 1 ? "Ideas Into Software" : "Keep scrolling"}
                    </p>
                  </GlassPanel>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- TECHNOLOGY ---------------- */}
        <Section id="technology" index={4}>
          <Reveal>
            <SectionHeading
              eyebrow="Technology ecosystem"
              title="One connected stack, chosen deliberately"
              subtitle="Hover a node to inspect it. The ecosystem you see behind this panel is the same one we build on."
            />
          </Reveal>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="pointer-events-auto flex flex-wrap gap-2">
              {data.tech.map((node) => {
                const active = activeTech === node.name;
                return (
                  <button
                    key={node.name}
                    type="button"
                    onPointerEnter={() => setActiveTech(node.name)}
                    onFocus={() => setActiveTech(node.name)}
                    onClick={() => setActiveTech((current) => (current === node.name ? null : node.name))}
                    className="hairline rounded-full px-3.5 py-2 text-[13px] transition-all duration-300"
                    style={{
                      background: active ? `${node.color}1f` : "rgba(255,255,255,0.03)",
                      borderColor: active ? `${node.color}66` : "rgba(255,255,255,0.09)",
                      color: active ? node.color : undefined,
                      transform: active ? "translateY(-2px)" : undefined,
                    }}
                  >
                    {node.name}
                  </button>
                );
              })}
            </div>
            <GlassPanel className="pointer-events-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTech ?? "empty"}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTech ? (
                    <>
                      <p className="eyebrow">{data.tech.find((t) => t.name === activeTech)?.category}</p>
                      <h3 className="title mt-2">{activeTech}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-mute">
                        {data.tech.find((t) => t.name === activeTech)?.description}
                      </p>
                      <p className="mt-5 mono text-[11px] uppercase tracking-[0.2em] text-mute">
                        orbit ring {data.tech.find((t) => t.name === activeTech)?.orbit} · production-ready
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="eyebrow">Ecosystem</p>
                      <h3 className="title mt-2">Select a technology node</h3>
                      <p className="mt-3 text-sm leading-relaxed text-mute">
                        We stay deliberately opinionated: a small number of proven tools, deeply understood, rather than a
                        different stack on every project.
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </GlassPanel>
          </div>
        </Section>

        {/* ---------------- WORK ---------------- */}
        <Section id="work" index={5}>
          <Reveal>
            <SectionHeading
              eyebrow="Selected work"
              title="Products in production, not mockups"
              subtitle="Each panel is a shipped system. Open a case study for the architecture and the outcome."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {data.projects.map((project, i) => (
              <Reveal key={project.slug} delay={i * 80}>
                <Link
                  href={`/work/${project.slug}`}
                  onPointerEnter={() => setActiveProject(i)}
                  onFocus={() => setActiveProject(i)}
                  onClick={() => track("portfolio_view", { slug: project.slug })}
                  className="glass spatial-card pointer-events-auto block overflow-hidden rounded-[22px]"
                >
                  <div className="relative h-52 overflow-hidden">
                    {project.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover opacity-70 transition duration-700 hover:scale-105 hover:opacity-90"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, #04050a 92%)` }} />
                    <span className="absolute left-4 top-4">
                      <Badge>{project.category}</Badge>
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="title">{project.title}</h3>
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
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <li key={tech} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-mute">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ---------------- PROCESS ---------------- */}
        <Section id="process" index={6}>
          <Reveal>
            <SectionHeading eyebrow={data.processCopy.eyebrow} title={data.processCopy.title} subtitle={data.processCopy.subtitle} />
          </Reveal>
          <ol className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.processStages.map((stage, i) => (
              <Reveal as="li" key={stage.step} delay={i * 60}>
                <GlassPanel interactive className="h-full p-5">
                  <p className="mono text-xs tracking-[0.3em]" style={{ color: brand.accent }}>
                    {stage.step}
                  </p>
                  <h3 className="title mt-3 text-[15px]">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{stage.detail}</p>
                </GlassPanel>
              </Reveal>
            ))}
          </ol>
        </Section>

        {/* ---------------- PROOF + ABOUT ---------------- */}
        <Section id="about" index={7}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <Reveal>
              <p className="eyebrow">{data.aboutCopy.eyebrow}</p>
              <h2 className="headline mt-3">{data.aboutCopy.title}</h2>
              <p className="lede mt-5">{data.aboutCopy.subtitle}</p>
              <ul className="mt-6 grid gap-2">
                {data.aboutCopy.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-sm text-mute">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand.accent }} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="grid gap-4">
              {data.quotes.slice(0, 3).map((quote, i) => (
                <Reveal key={quote.author} delay={i * 90}>
                  <GlassPanel className="pointer-events-auto p-6">
                    <p className="text-sm leading-relaxed text-ink/90">&ldquo;{quote.quote}&rdquo;</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-mute">
                      {quote.author} · {quote.role}
                      {quote.company ? ` · ${quote.company}` : ""}
                    </p>
                  </GlassPanel>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-3 md:grid-cols-2">
            {data.faqs.map((faq, i) => (
              <Reveal key={faq.question} delay={i * 60}>
                <div className="glass pointer-events-auto rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setOpenFaq((current) => (current === i ? null : i))}
                    aria-expanded={openFaq === i}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-medium">{faq.question}</span>
                    <span className="text-mute">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-mute">{faq.answer}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ---------------- CONTACT ---------------- */}
        <Section id="contact" index={8} className="min-h-[100svh]">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow">{data.contactCopy.eyebrow}</p>
              <h2 className="display mt-4 accent-text">{data.contactCopy.title}</h2>
              <p className="lede mx-auto mt-6 text-center">{data.contactCopy.subtitle}</p>
              <div className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-3">
                <MagneticLink href="/contact">{primaryCta}</MagneticLink>
                <MagneticLink href="/register" variant="ghost">
                  Create client account
                </MagneticLink>
              </div>
              <p className="mt-10 text-xs uppercase tracking-[0.24em] text-mute/70">
                Discovery call · Written architecture brief · Fixed first phase
              </p>
            </div>
          </Reveal>
        </Section>
      </main>
    </>
  );
}

function ProgressRail() {
  const [active, setActive] = useState("hero");
  const ids = ["hero", "intro", "services", "technology", "work", "process", "about", "contact"];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.35 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pointer-events-none fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
      {ids.map((id) => (
        <span
          key={id}
          className="h-1.5 w-1.5 rounded-full transition-all duration-500"
          style={{
            background: active === id ? "#2e9bff" : "rgba(255,255,255,0.22)",
            boxShadow: active === id ? "0 0 12px #2e9bff" : "none",
            transform: active === id ? "scale(1.7)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}
