import { NextRequest, NextResponse } from "next/server";
import { checkSoraStatus } from "../providers/sora";
import { checkVeo3Status } from "../providers/veo3";

export const maxDuration = 120; // Allow up to 2 minutes for status check + S3 upload

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const providerId = searchParams.get("providerId") || "sora";
    const customApiKey = searchParams.get("customApiKey") || undefined;

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // Dispatch to appropriate provider
    switch (providerId) {
      case "sora": {
        try {
          const result = await checkSoraStatus(jobId, customApiKey);
          return NextResponse.json(result);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              return NextResponse.json(
                { error: "Job not found. It may have expired." },
                { status: 404 }
              );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          throw error;
        }
      }

      case "veo3": {
        try {
          const result = await checkVeo3Status(jobId, customApiKey);
          return NextResponse.json(result);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found") || error.message.includes("NOT_FOUND")) {
              return NextResponse.json(
                { error: "Job not found. It may have expired." },
                { status: 404 }
              );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          throw error;
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown provider: ${providerId}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error("Error checking video status:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}