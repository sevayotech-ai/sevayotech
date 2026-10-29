"use client";

import { useActionState } from "react";
import { Field, GlassPanel } from "@/components/ui/kit";
import { updateAdminProfileAction } from "@/app/actions/admin";
import { LogoutButton } from "@/components/site/SessionProvider";
import { BrandMarkFlat } from "@/components/three/LiteBackdrop";

export function AdminProfile({
  user,
  brand,
}: {
  user: { name: string; email: string; role: string };
  brand: { accent: string; version: number; mode: string; eventName: string | null };
}) {
  const [state, action, pending] = useActionState(updateAdminProfileAction, null);

  return (
    <>
      <div className="mb-8">
        <p className="eyebrow">Account</p>
        <h1 className="headline mt-2 text-3xl">Your profile</h1>
        <p className="lede mt-3">Update your own details and password. Signing out is always confirmed first.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <GlassPanel className="p-7">
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input name="name" defaultValue={user.name} required className="field" />
            </Field>
            <Field label="Email" hint="read only">
              <input defaultValue={user.email} disabled className="field opacity-60" />
            </Field>
            <Field label="Company">
              <input name="company" className="field" />
            </Field>
            <Field label="Job title">
              <input name="jobTitle" className="field" />
            </Field>
            <Field label="Phone">
              <input name="phone" className="field" />
            </Field>
            <Field label="New password" hint="leave blank to keep current">
              <input name="password" type="password" minLength={8} className="field" placeholder="••••••••" />
            </Field>
            <div className="sm:col-span-2">
              {state?.ok ? <p className="mb-3 text-sm" style={{ color: "#7ff0c4" }}>Profile updated.</p> : null}
              {state?.error ? <p className="mb-3 text-sm" style={{ color: "#ffa3ab" }}>{state.error}</p> : null}
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </GlassPanel>

        <div className="grid gap-4">
          <GlassPanel className="p-7 text-center">
            <BrandMarkFlat size={84} />
            <p className="mt-4 text-sm font-medium">{user.name}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">{user.role}</p>
            <p className="mono mt-3 text-[11px] text-mute">
              branding v{brand.version} · {brand.mode}
              {brand.eventName ? ` · ${brand.eventName}` : ""}
            </p>
          </GlassPanel>

          <GlassPanel className="p-7">
            <p className="eyebrow">Session</p>
            <p className="mt-3 text-sm leading-relaxed text-mute">
              Signing out ends this session on this device only. Your projects, messages and documents are untouched.
            </p>
            <div className="mt-5">
              <LogoutButton className="btn btn-ghost w-full justify-center !py-2.5 !text-[13px]" />
            </div>
          </GlassPanel>
        </div>
      </div>
    </>
  );
}
