import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Allow up to 5 minutes for video download

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SORA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SORA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    // Fetch video content from OpenAI with authentication
    const response = await fetch(
      `https://api.openai.com/v1/videos/${jobId}/content`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || `Failed to download video: ${response.status}`;
      console.error("Sora Download API Error:", errorData);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Stream the video back to the client
    const videoBuffer = await response.arrayBuffer();

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="sora_video_${jobId}.mp4"`,
        "Content-Length": videoBuffer.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Error downloading Sora video:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
