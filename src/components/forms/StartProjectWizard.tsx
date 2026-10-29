"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { submitProjectAction, type LeadState } from "@/app/actions/leads";
import { ChoiceGrid, Field } from "@/components/ui/kit";
import { useBrand } from "@/components/site/BrandProvider";

const STEPS = [
  { key: "projectType", title: "What are you building?", caption: "Pick the closest shape — we'll refine it together." },
  { key: "idea", title: "Tell us about your idea.", caption: "Two or three sentences is enough. What does it do, and for whom?" },
  { key: "timeline", title: "What's your timeline?", caption: "When do you want this live?" },
  { key: "budget", title: "What's your budget range?", caption: "Honest ranges get honest scoping. Nothing is committed here." },
  { key: "contact", title: "How can we reach you?", caption: "A written response within one business day." },
] as const;

const PROJECT_TYPES = [
  { value: "web-platform", label: "Web platform", detail: "Portal, SaaS, dashboard" },
  { value: "mobile-app", label: "Mobile app", detail: "iOS + Android" },
  { value: "ai-automation", label: "AI & automation", detail: "Agents, RAG, workflows" },
  { value: "custom-software", label: "Custom software", detail: "Internal tools, ERP" },
  { value: "cloud-devops", label: "Cloud & DevOps", detail: "Infra, CI/CD, migration" },
  { value: "not-sure", label: "Not sure yet", detail: "Help me shape it" },
];

const TIMELINES = [
  { value: "asap", label: "As soon as possible", detail: "Start within weeks" },
  { value: "1-3-months", label: "1–3 months", detail: "Planned start" },
  { value: "3-6-months", label: "3–6 months", detail: "Exploring" },
  { value: "flexible", label: "Flexible", detail: "Right time > fast time" },
];

const BUDGETS = [
  { value: "undecided", label: "Not decided", detail: "Need guidance" },
  { value: "25k-75k", label: "₹20L – ₹65L", detail: "Focused MVP" },
  { value: "75k-150k", label: "₹65L – ₹1.3Cr", detail: "Full product" },
  { value: "150k+", label: "₹1.3Cr+", detail: "Platform / multi-team" },
];

export function StartProjectWizard() {
  const brand = useBrand();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitProjectAction, null);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    projectType: "web-platform",
    idea: "",
    timeline: "1-3-months",
    budget: "25k-75k",
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      document.body.dataset.cursorBusy = "1";
      const timer = window.setTimeout(() => delete document.body.dataset.cursorBusy, 2200);
      return () => window.clearTimeout(timer);
    }
  }, [state?.ok]);


  const update = <K extends keyof typeof values>(key: K, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const canAdvance =
    (step === 0 && values.projectType) ||
    (step === 1 && values.idea.trim().length >= 20) ||
    step === 2 ||
    step === 3 ||
    (step === 4 && values.name.trim().length >= 2 && /.+@.+\..+/.test(values.email));

  if (state?.ok) {
    return (
      <div className="glass-strong relative overflow-hidden rounded-[28px] p-10 text-center">
        <motion.div
          className="mx-auto grid h-24 w-24 place-items-center rounded-full"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 14 }}
          style={{ background: `${brand.accent}1f`, boxShadow: `0 0 70px -18px ${brand.accent}` }}
        >
          <motion.svg viewBox="0 0 48 48" className="h-12 w-12" fill="none">
            <motion.path
              d="M12 25l8 8 16-17"
              stroke={brand.accent}
              strokeWidth={3.5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            />
          </motion.svg>
        </motion.div>
        <h2 className="headline mt-8 text-3xl">Your idea is in our workspace.</h2>
        <p className="lede mx-auto mt-4 text-center">
          Reference <span className="mono text-ink">{state.reference}</span>. A senior engineer will reply within one
          business day with next steps and a discovery slot.
        </p>
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${brand.accent}, transparent)` }}
        />
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="glass-strong relative overflow-hidden rounded-[28px] p-6 sm:p-9">
      {/* choice steps live in React state, so they must be mirrored into the payload */}
      <input type="hidden" name="projectType" value={values.projectType} />
      <input type="hidden" name="timeline" value={values.timeline} />
      <input type="hidden" name="budget" value={values.budget} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Step {step + 1} / {STEPS.length}</p>
          <h2 className="title mt-2 text-xl">{STEPS[step].title}</h2>
          <p className="mt-1 text-sm text-mute">{STEPS[step].caption}</p>
        </div>
        <div className="hidden gap-1.5 sm:flex">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === step ? 28 : 12,
                background: i <= step ? brand.accent : "rgba(255,255,255,0.16)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 min-h-[240px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={STEPS[step].key}
            initial={{ opacity: 0, x: 40, rotateY: 8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -40, rotateY: -8 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 1200 }}
          >
            {step === 0 ? (
              <ChoiceGrid
                options={PROJECT_TYPES}
                value={values.projectType}
                onChange={(value) => update("projectType", value)}
              />
            ) : null}

            {step === 1 ? (
              <Field label="Your idea" hint={`${values.idea.trim().length}/20 min`}>
                <textarea
                  name="idea"
                  rows={6}
                  required
                  value={values.idea}
                  onChange={(event) => update("idea", event.target.value)}
                  className="field resize-none"
                  placeholder="We run 14 depots and dispatch still happens on spreadsheets..."
                />
              </Field>
            ) : null}

            {step === 2 ? <ChoiceGrid options={TIMELINES} value={values.timeline} onChange={(v) => update("timeline", v)} /> : null}
            {step === 3 ? <ChoiceGrid options={BUDGETS} value={values.budget} onChange={(v) => update("budget", v)} /> : null}

            {step === 4 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    name="name"
                    required
                    value={values.name}
                    onChange={(event) => update("name", event.target.value)}
                    className="field"
                    placeholder="Rhea Malhotra"
                  />
                </Field>
                <Field label="Email">
                  <input
                    name="email"
                    type="email"
                    required
                    value={values.email}
                    onChange={(event) => update("email", event.target.value)}
                    className="field"
                    placeholder="you@company.com"
                  />
                </Field>
                <Field label="Company" hint="optional">
                  <input
                    name="company"
                    value={values.company}
                    onChange={(event) => update("company", event.target.value)}
                    className="field"
                    placeholder="Atlas Logistics"
                  />
                </Field>
                <Field label="Phone" hint="optional">
                  <input
                    name="phone"
                    value={values.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    className="field"
                    placeholder="+91 …"
                  />
                </Field>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {state?.error ? (
        <p className="mt-4 rounded-xl border border-[#ff5f6d44] bg-[#ff5f6d14] px-4 py-3 text-sm" style={{ color: "#ffa3ab" }}>
          {state.error}
        </p>
      ) : null}
      {state?.fieldErrors
        ? Object.entries(state.fieldErrors).map(([field, message]) =>
            message ? (
              <p key={field} className="mt-2 text-xs" style={{ color: "#ffa3ab" }}>
                {field}: {message}
              </p>
            ) : null,
          )
        : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn btn-ghost !py-2.5 !text-[13px]"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canAdvance && setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="btn btn-primary sheen !py-2.5 !text-[13px]"
          >
            Continue →
          </button>
        ) : (
          <button type="submit" disabled={!canAdvance || pending} className="btn btn-primary sheen !py-2.5 !text-[13px]">
            {pending ? "Sending…" : "Start My Project"}
          </button>
        )}
      </div>

      <div
        className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `${brand.accent}22` }}
      />
    </form>
  );
}
