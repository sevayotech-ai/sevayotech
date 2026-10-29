import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = "unavailable";
  try {
    await db.execute(sql`select 1`);
    database = "ok";
  } catch {
    database = "unavailable";
  }

  return NextResponse.json({
    status: "ok",
    service: "sevayo",
    database,
    time: new Date().toISOString(),
  });
}
