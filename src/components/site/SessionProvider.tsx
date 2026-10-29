"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";

export type SessionInfo = {
  loggedIn: boolean;
  role: string;
  name: string;
  /** Where the brand logo should take an authenticated user. */
  homeHref: string;
};

const SessionContext = createContext<SessionInfo>({
  loggedIn: false,
  role: "guest",
  name: "",
  homeHref: "/",
});

export function SessionProvider({ value, children }: { value: SessionInfo; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionInfo {
  return useContext(SessionContext);
}

/**
 * Brand home link. A signed-in user always lands on their own home screen
 * (portal or admin console) — never logged out, never dumped on marketing.
 */
export function BrandHomeLink({
  children,
  className = "",
  fallback = "/",
}: {
  children: ReactNode;
  className?: string;
  fallback?: string;
}) {
  const session = useSession();
  const href = session.loggedIn ? session.homeHref : fallback;
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/**
 * LogoutButton — always asks for confirmation, works in the portal sidebar,
 * the admin console, the profile page and anywhere else it is rendered.
 */
export function LogoutButton({
  label = "Sign out",
  className = "",
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          `w-full rounded-xl border border-line text-mute transition hover:text-ink ${compact ? "px-3 py-1.5 text-[12px]" : "px-3 py-2 text-[12px]"}`
        }
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm sign out"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ perspective: 1200 }}
            className="glass-strong w-full max-w-sm rounded-[26px] p-7"
          >
            <div
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-xl"
              style={{ background: "rgba(255,95,109,0.12)", color: "#ff8a94" }}
            >
              ⏻
            </div>
            <h2 className="title mt-5 text-center text-xl">Sign out of SEVAYO?</h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-mute">
              You&apos;ll be returned to the public website. Your project data, messages and documents stay exactly as
              they are.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="btn btn-ghost flex-1 justify-center !py-2.5 !text-[13px]"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className="btn btn-primary flex-1 justify-center !py-2.5 !text-[13px]"
                style={{ background: "linear-gradient(120deg,#ff8a94,#ff5f6d)", color: "#1a0508" }}
              >
                {pending ? "Signing out…" : "Yes, sign out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
