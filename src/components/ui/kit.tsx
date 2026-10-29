"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

/* ---------------- Reveal on scroll ---------------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as "div";
  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={`reveal ${visible ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}

/* ---------------- Section shell ---------------- */

export function Section({
  id,
  index,
  children,
  className = "",
  tone = "default",
}: {
  id: string;
  index: number;
  children: ReactNode;
  className?: string;
  tone?: "default" | "panel";
}) {
  return (
    <section
      id={id}
      className={`relative flex min-h-screen items-center px-4 py-24 sm:px-6 ${tone === "panel" ? "" : ""} ${className}`}
      data-depth={index}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="headline mt-3">{title}</h2>
      {subtitle ? <p className="lede mt-4">{subtitle}</p> : null}
    </div>
  );
}

/* ---------------- Panels ---------------- */

export function GlassPanel({
  children,
  className = "",
  interactive = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={`glass rounded-[22px] ${interactive ? "spatial-card" : ""} ${className}`}>{children}</div>
  );
}

export function MagneticLink({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  external?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const node = ref.current;
    if (!node || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.28;
    node.style.transform = `translate3d(${x}px, ${y - 2}px, 24px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const classes = `btn ${variant === "primary" ? "btn-primary sheen overflow-hidden" : "btn-ghost"} ${className}`;

  if (external) {
    return (
      <a ref={ref} href={href} className={classes} onPointerMove={onMove} onPointerLeave={reset} rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link ref={ref} href={href} className={classes} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </Link>
  );
}

/* ---------------- Form primitives ---------------- */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-mute">
        {label}
        {hint ? <span className="text-[10px] normal-case tracking-normal text-mute/70">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs" style={{ color: "#ff8a94" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; label: string; detail?: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`hairline rounded-2xl px-4 py-3 text-left transition-all duration-300 ${
              active ? "bg-white/10" : "bg-white/[0.02] hover:bg-white/[0.06]"
            }`}
            style={active ? { borderColor: "rgba(46,155,255,0.6)", boxShadow: "0 18px 40px -28px rgba(46,155,255,0.9)" } : undefined}
          >
            <span className="block text-sm font-medium">{option.label}</span>
            {option.detail ? <span className="mt-0.5 block text-xs text-mute">{option.detail}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "ok" | "warn" | "bad" }) {
  const map = {
    default: "border-line bg-white/5 text-mute",
    ok: "border-[#34d39b44] bg-[#34d39b14] text-[#7ff0c4]",
    warn: "border-[#f5b54444] bg-[#f5b54414] text-[#ffd79a]",
    bad: "border-[#ff5f6d44] bg-[#ff5f6d14] text-[#ffa3ab]",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${map[tone]}`}>
      {children}
    </span>
  );
}

export function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="mono text-2xl font-semibold" style={{ color: accent ?? "#e9edf9" }}>
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-mute">{label}</p>
    </div>
  );
}

export function ProgressBar({ value, accent = "#2e9bff" }: { value: number; accent?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: `linear-gradient(90deg, ${accent}, #9b5cff)` }}
      />
    </div>
  );
}
