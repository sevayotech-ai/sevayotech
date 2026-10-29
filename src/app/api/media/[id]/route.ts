import { NextResponse } from "next/server";
import { mediaById } from "@/lib/branding";

export const dynamic = "force-dynamic";

/** Serves DB-stored media (brand assets, uploads) with immutable caching. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
  }

  try {
    const asset = await mediaById(id);
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = Buffer.from(asset.data, "base64");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": asset.mimeType,
        "content-length": String(buffer.byteLength),
        "cache-control": "public, max-age=31536000, immutable",
        "content-disposition": `inline; filename="${encodeURIComponent(asset.name)}"`,
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Media unavailable" }, { status: 503 });
  }
}
