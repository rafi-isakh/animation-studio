import { NextRequest, NextResponse } from "next/server";

/**
 * Image Proxy API
 *
 * Fetches an image from a URL (typically S3) and returns it as base64.
 * This bypasses CORS restrictions when the browser needs to read image data.
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL is from expected domains (S3 or allowed hosts)
    const parsedUrl = new URL(url);
    const allowedHostPatterns = [
      "s3.amazonaws.com",
      "s3.ap-northeast-2.amazonaws.com",
      "s3.ap-southeast-1.amazonaws.com",
      ".s3.ap-northeast-2.amazonaws.com",
      ".s3.ap-southeast-1.amazonaws.com",
      ".s3.amazonaws.com",
    ];

    const isAllowed = allowedHostPatterns.some(
      (pattern) => parsedUrl.hostname === pattern || parsedUrl.hostname.endsWith(pattern)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "URL host not allowed" },
        { status: 403 }
      );
    }

    // Fetch the image
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Get content type for proper handling
    const contentType = response.headers.get("content-type") || "image/png";

    return NextResponse.json({
      base64,
      contentType,
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to proxy image" },
      { status: 500 }
    );
  }
}