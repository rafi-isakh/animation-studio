import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL =
  process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      console.error("[render-3d] No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = `${ORCHESTRATOR_URL}/api/v1/render-3d/render`;
    const backendPayload = {
      model_url: body.modelUrl,
      azimuth: body.azimuth ?? 0,
      elevation: body.elevation ?? 30,
      distance_multiplier: body.distanceMultiplier ?? 2.5,
      fov: body.fov ?? 45,
      camera_mode: body.cameraMode || "exterior",
      tilt: body.tilt ?? 0,
      interior_offset_x: body.interiorOffsetX ?? 0,
      interior_offset_y: body.interiorOffsetY ?? 0,
      interior_offset_z: body.interiorOffsetZ ?? 0,
      resolution: body.resolution || [1920, 1080],
      output_mode: body.outputMode || "direct",
      style_prompt: body.stylePrompt,
      api_key: body.apiKey,
    };

    console.log(`[render-3d] Forwarding to ${backendUrl}`);
    console.log(
      `[render-3d] Payload:`,
      JSON.stringify({
        ...backendPayload,
        api_key: backendPayload.api_key ? "***" : undefined,
      })
    );

    let response: Response;
    try {
      response = await fetch(backendUrl, {
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
      console.error("[render-3d] Failed to connect to backend:", fetchError);
      return NextResponse.json(
        {
          error: `Cannot connect to backend at ${ORCHESTRATOR_URL}: ${fetchError instanceof Error ? fetchError.message : fetchError}`,
        },
        { status: 502 }
      );
    }

    const responseText = await response.text();
    console.log(
      `[render-3d] Backend response: status=${response.status}, body=${responseText.substring(0, 500)}`
    );

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "[render-3d] Backend returned non-JSON:",
        responseText.substring(0, 500)
      );
      return NextResponse.json(
        {
          error: `Backend returned invalid JSON: ${responseText.substring(0, 500)}`,
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(
        `[render-3d] Backend error ${response.status}:`,
        JSON.stringify(data)
      );
      return NextResponse.json(
        { error: data.detail || JSON.stringify(data) || "3D rendering failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      image: data.image,
      cameraParams: data.camera_params,
    });
  } catch (error) {
    console.error("[render-3d] Unexpected error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
