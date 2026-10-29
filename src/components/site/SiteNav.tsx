"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { useBrand } from "./BrandProvider";
import { BrandHomeLink, LogoutButton, useSession } from "./SessionProvider";

type NavItem = { label: string; href: string };

export function SiteNav({ items }: { items: NavItem[] }) {
  const brand = useBrand();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4 transition-all duration-500 sm:pt-5 ${
          scrolled ? "-translate-y-0.5" : ""
        }`}
      >
        <nav
          aria-label="Primary"
          className={`glass flex w-full max-w-6xl items-center gap-2 rounded-full px-3 py-2 transition-all duration-500 ${
            scrolled ? "shadow-[0_24px_70px_-40px_rgba(0,0,0,1)]" : ""
          }`}
        >
          <BrandHomeLink
            fallback="/"
            className="group flex shrink-0 items-center gap-2 rounded-full px-2 py-1 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <BrandLogo context="header" height={30} />
          </BrandHomeLink>

          <ul className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHovered(item.href)}
                    onMouseLeave={() => setHovered(null)}
                    aria-current={active ? "page" : undefined}
                    className={`relative block rounded-full px-3.5 py-2 text-[13px] transition-all duration-300 ${
                      active ? "text-ink" : "text-mute hover:text-ink"
                    }`}
                    style={
                      hovered === item.href
                        ? {
                            transform: "translateZ(14px) translateY(-2px)",
                            background: "rgba(255,255,255,0.07)",
                            boxShadow: "0 12px 30px -18px rgba(46,155,255,0.9)",
                          }
                        : undefined
                    }
                  >
                    {item.label}
                    {active ? (
                      <span
                        className="absolute inset-x-3 -bottom-0.5 h-px"
                        style={{ background: brand.accent, boxShadow: `0 0 10px ${brand.accent}` }}
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <SessionArea />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Toggle navigation"
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className="absolute left-0 h-px w-4 bg-current transition-transform duration-300"
                  style={{ top: open ? 6 : 1, transform: open ? "rotate(45deg)" : "none" }}
                />
                <span
                  className="absolute left-0 h-px w-4 bg-current transition-transform duration-300"
                  style={{ top: open ? 6 : 11, transform: open ? "rotate(-45deg)" : "none" }}
                />
              </span>
            </button>
          </div>
        </nav>

        {open ? (
          <div className="glass-strong absolute inset-x-4 top-[76px] rounded-3xl p-4 lg:hidden">
            <ul className="grid gap-1">
              {[...items, { label: "Client Login", href: "/login" }].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-2xl px-4 py-3 text-sm text-mute transition hover:bg-white/5 hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

    </>
  );
}

export function SiteFooter({
  items,
  company,
  social,
  tagline,
}: {
  items: NavItem[];
  company: { name: string; email: string; phone: string; address: string; hours: string };
  social: { label: string; href: string }[];
  tagline: string;
}) {
  const brand = useBrand();
  return (
    <footer className="relative z-20 mt-24 border-t border-line px-4 pb-10 pt-14">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo context="footer" height={30} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mute">{tagline}</p>
          <p className="mt-4 text-sm text-mute">
            {company.email} · {company.phone}
          </p>
          <p className="mt-1 text-xs text-mute/80">{company.address}</p>
          <p className="mt-1 text-xs text-mute/80">{company.hours}</p>
        </div>
        <div>
          <h2 className="eyebrow">Navigate</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-mute transition hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="text-mute transition hover:text-ink">
                Client Login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="eyebrow">Elsewhere</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {social.map((item) => (
              <li key={item.label}>
                <a href={item.href} rel="noreferrer noopener" target="_blank" className="text-mute transition hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="btn btn-ghost mt-6 !py-2 !text-[13px]">
            Start Your Project
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-line pt-6 text-xs text-mute/70 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {brand.brandName}. All rights reserved.
        </p>
        <p className="mono">
          branding v{brand.version} · {brand.mode}
          {brand.event ? ` · ${brand.event.kind}` : ""}
        </p>
      </div>
    </footer>
  );
}

export function LoadingVeil({ message = "Preparing your workspace..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-void/80 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-20 w-20">
          <span className="absolute inset-0 rounded-full border border-white/10" />
          <span className="absolute inset-0 animate-spin rounded-full border-t-2" style={{ borderColor: "#2e9bff" }} />
          <span className="absolute inset-3 rounded-full bg-primary/20 blur-md" />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-mute">{message}</p>
      </div>
    </div>
  );
}

/** Header auth area — adapts to the signed-in state. */
function SessionArea() {
  const session = useSession();
  const brand = useBrand();

  if (!session.loggedIn) {
    return (
      <>
        <Link
          href="/login"
          className="hidden rounded-full px-3.5 py-2 text-[13px] text-mute transition hover:text-ink sm:block"
        >
          Client Login
        </Link>
        <Link href="/contact" className="btn btn-primary sheen overflow-hidden !px-4 !py-2 !text-[13px]">
          Start Your Project
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href={session.homeHref}
        className="hidden rounded-full border border-line px-3.5 py-2 text-[13px] text-mute transition hover:text-ink sm:block"
      >
        {session.role === "admin" ? "Admin console" : "My workspace"}
      </Link>
      <Link href="/contact" className="btn btn-primary sheen overflow-hidden !px-4 !py-2 !text-[13px]">
        Start Your Project
      </Link>
      <div className="hidden items-center gap-2 lg:flex">
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
          style={{ background: `${brand.accent}22`, color: brand.accent }}
          title={session.name}
        >
          {session.name.slice(0, 1).toUpperCase()}
        </span>
        <LogoutButton label="Logout" compact className="rounded-full border border-line px-3 py-1.5 text-[12px] text-mute transition hover:text-ink" />
      </div>
    </>
  );
}
