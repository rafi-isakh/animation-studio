import { NextRequest, NextResponse } from "next/server";
import { assertSafePathSegment } from "@/utils/urlSafety";

const WORLDLABS_BASE = "https://api.worldlabs.ai/marble/v1";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operationId = searchParams.get("operationId");
    const apiKey = searchParams.get("apiKey") || process.env.WORLDLABS_API_KEY;

    if (!operationId) {
      return NextResponse.json(
        { error: "operationId is required" },
        { status: 400 }
      );
    }
    if (!apiKey) {
      return NextResponse.json(
        { error: "No WorldLabs API key found. Provide apiKey or set WORLDLABS_API_KEY env var." },
        { status: 400 }
      );
    }

    const safeOperationId = assertSafePathSegment(operationId);
    const res = await fetch(
      `${WORLDLABS_BASE}/operations/${encodeURIComponent(safeOperationId)}`,
      {
      headers: { "WLT-Api-Key": apiKey },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`operations poll failed (${res.status}): ${err}`);
    }

    const op = await res.json();
    /*
      Operation shape:
      {
        operation_id: string,
        done: boolean,
        error: null | { code, message },
        metadata: null | { progress: { status, description }, world_id: string },
        response: null | { ... world data when done ... }
      }
    */

    if (!op.done) {
      return NextResponse.json({ status: "generating", operationId });
    }

    if (op.error) {
      return NextResponse.json({
        status: "failed",
        operationId,
        error: op.error.message ?? JSON.stringify(op.error),
      });
    }

    const r = op.response ?? {};
    const worldId: string = r.id ?? op.metadata?.world_id ?? "";

    return NextResponse.json({
      status: "completed",
      operationId,
      worldId,
      // WorldLabs viewer link (standard pattern)
      worldMarbleUrl: worldId ? `https://marble.worldlabs.ai/world/${worldId}` : undefined,
      thumbnailUrl: r.thumbnail_url,
      panoUrl: r.assets?.imagery?.pano_url,
      splatUrls: r.assets?.splats?.spz_urls,
      meshUrl: r.assets?.mesh?.collider_mesh_url,
    });
  } catch (err) {
    console.error("[WorldLabs status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
