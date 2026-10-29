"use client";

import Link from "next/link";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { Field } from "@/components/ui/kit";
import { BrandLogo } from "@/components/site/BrandLogo";
import { BrandMarkFlat } from "@/components/three/LiteBackdrop";
import { useBrand } from "@/components/site/BrandProvider";
import { LogoutButton } from "@/components/site/SessionProvider";

export function AuthPanel({
  mode,
  session,
}: {
  mode: "login" | "register";
  session?: { name: string; email: string; role: string; homeHref: string } | null;
}) {
  const brand = useBrand();
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, null);

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_0.85fr]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block"
      >
        <BrandLogo context="login" height={38} />
        <h1 className="headline mt-10 max-w-lg">
          {mode === "login" ? "Your workspace is exactly where you left it." : "Create your SEVAYO workspace."}
        </h1>
        <p className="lede mt-5">
          {mode === "login"
            ? "Track milestones, review requirements, read documents, message the team and see invoices — in one place."
            : "Capture ideas, follow delivery stage by stage, and keep every decision in writing from day one."}
        </p>
        <div className="mt-12 flex items-center gap-8">
          <BrandMarkFlat size={92} />
          <ul className="grid gap-2 text-sm text-mute">
            <li>Live project stage &amp; health</li>
            <li>Requirements with agreed status</li>
            <li>Invoices, payments and documents</li>
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28, rotateY: 10 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ transformPerspective: 1200 }}
        className="glass-strong rounded-[28px] p-7 sm:p-9"
      >
        <div className="lg:hidden">
          <BrandLogo context="mobile" height={28} />
        </div>
        {session ? (
          <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: `${brand.accent}44`, background: `${brand.accent}0f` }}>
            <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: brand.accent }}>
              Already signed in
            </p>
            <p className="mt-2 text-sm">
              {session.name} <span className="text-mute">· {session.email}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={session.homeHref} className="btn btn-primary !py-2 !text-[12px]">
                Go to workspace →
              </a>
              <LogoutButton label="Logout" compact className="rounded-xl border border-line px-3 py-2 text-[12px] text-mute transition hover:text-ink" />
            </div>
          </div>
        ) : null}

        <p className="eyebrow mt-6 lg:mt-0">{mode === "login" ? "Client login" : "Create account"}</p>
        <h2 className="title mt-2 text-2xl">
          {mode === "login" ? "Sign in to continue" : "Start your workspace"}
        </h2>

        <form action={formAction} className="mt-7 grid gap-4">
          {mode === "register" ? (
            <>
              <Field label="Full name">
                <input name="name" required autoComplete="name" className="field" placeholder="Rhea Malhotra" />
              </Field>
              <Field label="Company" hint="optional">
                <input name="company" autoComplete="organization" className="field" placeholder="Atlas Logistics" />
              </Field>
            </>
          ) : null}

          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field"
              placeholder="you@company.com"
            />
          </Field>

          <Field label="Password" hint={mode === "register" ? "min 8 characters" : undefined}>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="field"
              placeholder="••••••••"
            />
          </Field>

          {mode === "login" ? (
            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-mute">
                <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded border-line bg-white/5" />
                Remember me
              </label>
              <Link href="/contact" className="text-mute transition hover:text-ink">
                Forgot password?
              </Link>
            </div>
          ) : null}

          {state?.error ? (
            <p className="rounded-xl border border-[#ff5f6d44] bg-[#ff5f6d14] px-4 py-3 text-sm" style={{ color: "#ffa3ab" }}>
              {state.error}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className="btn btn-primary mt-2 w-full justify-center">
            {pending ? "Verifying…" : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <div className="mt-7 border-t border-line pt-5 text-sm text-mute">
          {mode === "login" ? (
            <p>
              No account yet?{" "}
              <Link href="/register" className="text-ink underline decoration-white/20 underline-offset-4">
                Register
              </Link>
            </p>
          ) : (
            <p>
              Already a client?{" "}
              <Link href="/login" className="text-ink underline decoration-white/20 underline-offset-4">
                Sign in
              </Link>
            </p>
          )}
        </div>

      </motion.div>
    </div>
  );
}
