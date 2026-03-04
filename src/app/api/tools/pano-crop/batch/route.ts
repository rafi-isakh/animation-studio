import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const BACKEND_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const backendPayload = {
      pano_url: body.panoUrl || "",
      pano_data: body.panoData || null,
      views: (body.views || []).map((v: { azimuth?: number; elevation?: number; fov?: number }) => ({
        azimuth: v.azimuth ?? 0,
        elevation: v.elevation ?? 0,
        fov: v.fov ?? 90,
      })),
      resolution: body.resolution || [1920, 1080],
    };

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/v1/panorama/batch-crop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
          "X-User-Id": session.userId,
          "X-User-Email": session.email || "",
        },
        body: JSON.stringify(backendPayload),
      });
    } catch (fetchError) {
      return NextResponse.json(
        { error: `Cannot connect to backend: ${fetchError instanceof Error ? fetchError.message : fetchError}` },
        { status: 502 }
      );
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: `Backend returned invalid JSON: ${responseText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Panorama crop failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      images: data.images,
      cameraParams: data.camera_params,
    });
  } catch (error) {
    console.error("[pano-crop] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
