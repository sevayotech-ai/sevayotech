import type { Metadata } from "next";
import { getHomePayload, sectionText } from "@/lib/content";
import { resolveBrand } from "@/lib/branding";
import { SiteNav, SiteFooter } from "@/components/site/SiteNav";
import { HomeExperience, type HomeData } from "@/components/home/HomeExperience";

export const dynamic = "force-dynamic";

/** Fallbacks only — the live values come from the CMS. */
const DEFAULT_IDEA_STAGES = [
  { label: "Idea", detail: "A thought, a frustration, an opportunity. We write it down precisely." },
  { label: "Requirements", detail: "Scoped, prioritised, testable. Risk named before code." },
  { label: "Design", detail: "Flows, interface system and motion language — buildable, not decorative." },
  { label: "Development", detail: "Typed end-to-end. Working software every two weeks." },
  { label: "Testing", detail: "Automated suites, load, accessibility and security review." },
  { label: "Deployment", detail: "Reproducible pipelines, observability, staged rollout." },
  { label: "Product", detail: "Live, measured, maintained. Your idea is now software." },
];

const DEFAULT_PROCESS_STAGES = [
  { step: "01", title: "Discover", detail: "Stakeholder interviews, constraints, success metrics." },
  { step: "02", title: "Define", detail: "Architecture brief, scope, phased milestones, risks." },
  { step: "03", title: "Design", detail: "Flows, interface system, motion and accessibility spec." },
  { step: "04", title: "Build", detail: "Typed, reviewed code in vertical slices. Demo every two weeks." },
  { step: "05", title: "Test", detail: "Unit, integration, load, a11y and security validation." },
  { step: "06", title: "Launch", detail: "Reproducible pipelines, staged rollout, observability." },
  { step: "07", title: "Support", detail: "SLOs, monitoring, dependency upgrades, improvement cycle." },
];

export async function generateMetadata(): Promise<Metadata> {
  const { sections } = await getHomePayload();
  const hero = sectionText(sections.hero);
  return {
    title: hero.title || "SEVAYO — Ideas Into Software",
    description: hero.subtitle,
  };
}

export default async function HomePage() {
  const [{ sections, services, projects, tech, quotes, faqList, config }, brand] = await Promise.all([
    getHomePayload(),
    resolveBrand(),
  ]);

  const hero = sectionText(sections.hero);
  const intro = sectionText(sections.intro);
  const servicesCopy = sectionText(sections.services);
  const ideaCopy = sectionText(sections.idea);
  const processCopy = sectionText(sections.process);
  const about = sectionText(sections.about);
  const contact = sectionText(sections.contact);
  const ideaData = (sections.idea?.data ?? {}) as { stages?: { label: string; detail: string }[] };
  const processData = (sections.process?.data ?? {}) as { stages?: { title: string; detail: string }[] };

  const data: HomeData = {
    hero: {
      eyebrow: hero.eyebrow || "Software development & technology company",
      title: hero.title || "Ideas Into Software",
      subtitle: hero.subtitle || "",
      ctas: (hero.body || "Start Your Project|Explore SEVAYO").split("|"),
    },
    intro: { eyebrow: intro.eyebrow, title: intro.title, subtitle: intro.subtitle },
    servicesCopy: { eyebrow: servicesCopy.eyebrow, title: servicesCopy.title, subtitle: servicesCopy.subtitle },
    ideaCopy: { eyebrow: ideaCopy.eyebrow, title: ideaCopy.title, subtitle: ideaCopy.subtitle },
    processCopy: { eyebrow: processCopy.eyebrow, title: processCopy.title, subtitle: processCopy.subtitle },
    aboutCopy: {
      eyebrow: about.eyebrow,
      title: about.title,
      subtitle: about.subtitle,
      bullets: (about.body || "").split("|").filter(Boolean),
    },
    contactCopy: { eyebrow: contact.eyebrow, title: contact.title, subtitle: contact.subtitle },
    ideaStages: ideaData.stages?.length ? ideaData.stages : DEFAULT_IDEA_STAGES,
    processStages: processData.stages?.length
      ? processData.stages.map((stage, index) => ({
          step: String(index + 1).padStart(2, "0"),
          title: stage.title,
          detail: stage.detail,
        }))
      : DEFAULT_PROCESS_STAGES,
    stats: config.stats,
    services: services.map((service) => ({
      id: service.id,
      slug: service.slug,
      title: service.title,
      tagline: service.tagline,
      description: service.description,
      shape: service.shape,
      accent: service.accent,
      capabilities: service.capabilities,
    })),
    projects: projects.map((project) => ({
      slug: project.slug,
      title: project.title,
      category: project.category,
      summary: project.summary,
      image: project.heroMediaUrl ?? undefined,
      accent: project.accent,
      technologies: project.technologies,
      outcome: project.outcome,
    })),
    tech: tech.map((node) => ({
      name: node.name,
      color: node.color,
      category: node.category,
      description: node.description,
      orbit: node.orbit,
    })),
    quotes: quotes.map((quote) => ({
      quote: quote.quote,
      author: quote.author,
      role: quote.role,
      company: quote.company,
    })),
    faqs: faqList.map((faq) => ({ question: faq.question, answer: faq.answer })),
  };

  const worldConfig = {
    services: data.services.map((s) => ({ id: s.id, title: s.title, shape: s.shape, accent: s.accent })),
    projects: data.projects.map((p) => ({ slug: p.slug, title: p.title, accent: p.accent, image: p.image })),
    tech: data.tech.map((t) => ({ name: t.name, color: t.color, category: t.category, orbit: t.orbit })),
    accent: brand.accent,
    accent2: brand.accent2,
    warm: brand.particles === "warm" || brand.particles === "festive",
  };

  return (
    <>
      <SiteNav items={config.nav} />
      <HomeExperience data={data} config={worldConfig} />
      <SiteFooter
        items={config.nav}
        company={config.company}
        social={config.social}
        tagline={`${brand.tagline} — ${config.company.address}`}
      />
    </>
  );
}
