import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { rateLimit } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "page_view",
  "cta_click",
  "project_submit",
  "service_view",
  "portfolio_view",
  "login",
  "register",
  "conversion",
]);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`analytics:${ip}`, 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { name?: string; path?: string; meta?: Record<string, unknown> };
    const name = String(body.name ?? "");
    if (!ALLOWED.has(name)) return NextResponse.json({ ok: false }, { status: 400 });

    await ensureSeed();
    await db.insert(analyticsEvents).values({
      name,
      path: String(body.path ?? "/").slice(0, 200),
      meta: body.meta ?? {},
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
