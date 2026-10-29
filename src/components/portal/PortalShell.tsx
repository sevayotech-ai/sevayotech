"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/site/BrandLogo";
import { LogoutButton } from "@/components/site/SessionProvider";

const SECTIONS = [
  { key: "", label: "Overview", icon: "◈" },
  { key: "projects", label: "My Projects", icon: "▣" },
  { key: "ideas", label: "Ideas", icon: "✦" },
  { key: "requirements", label: "Requirements", icon: "≡" },
  { key: "tasks", label: "Tasks", icon: "✓" },
  { key: "milestones", label: "Milestones", icon: "◇" },
  { key: "documents", label: "Documents", icon: "▤" },
  { key: "messages", label: "Messages", icon: "✉" },
  { key: "meetings", label: "Meetings", icon: "◷" },
  { key: "payments", label: "Payments", icon: "₹" },
  { key: "invoices", label: "Invoices", icon: "▦" },
  { key: "notifications", label: "Notifications", icon: "◔" },
  { key: "profile", label: "Profile", icon: "◉" },
];

export function PortalShell({
  user,
  children,
  accent,
  unread,
}: {
  user: { name: string; email: string; company: string | null; role: string };
  children: ReactNode;
  accent: string;
  unread: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = pathname.replace(/^\/portal\/?/, "").split("/")[0];

  return (
    <div className="relative z-10 flex min-h-screen">
      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-40 w-[268px] flex-col justify-between overflow-hidden p-5 transition-transform duration-500 lg:translate-x-0 ${
          open ? "flex translate-x-0" : "hidden lg:flex"
        }`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <Link href="/portal" className="block px-2">
            <BrandLogo context="portal" height={28} />
          </Link>
          <p className="mt-6 px-2 text-[10px] uppercase tracking-[0.28em] text-mute">Client workspace</p>
          <nav className="mt-3 grid gap-0.5 pb-2">
            {SECTIONS.map((section) => {
              const active = current === section.key;
              return (
                <Link
                  key={section.key || "overview"}
                  href={`/portal${section.key ? `/${section.key}` : ""}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-300 ${
                    active ? "text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
                  }`}
                  style={
                    active
                      ? { background: "rgba(255,255,255,0.07)", boxShadow: `inset 2px 0 0 ${accent}` }
                      : undefined
                  }
                >
                  <span className="w-4 text-center text-xs" style={{ color: active ? accent : undefined }}>
                    {section.icon}
                  </span>
                  {section.label}
                  {section.key === "notifications" && unread > 0 ? (
                    <span className="ml-auto rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: `${accent}22`, color: accent }}>
                      {unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-4 shrink-0 border-t border-line pt-4">
          <Link
            href="/portal/profile"
            className="mb-3 block rounded-2xl border border-line bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
          >
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-mute">{user.company ?? user.email}</p>
          </Link>
          {user.role === "admin" ? (
            <Link href="/admin" className="mb-2 block rounded-xl border border-line px-3 py-2 text-center text-[12px] text-mute hover:text-ink">
              Admin console
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[268px]">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle workspace navigation"
            className="grid h-9 w-9 place-items-center rounded-xl border border-line"
          >
            ☰
          </button>
          <BrandLogo context="mobile" height={24} />
        </header>
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
