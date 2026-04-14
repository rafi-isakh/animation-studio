import { NextRequest, NextResponse } from "next/server";
import { assertAllowedUrl } from "@/utils/urlSafety";

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

    // Validate URL is from expected domains (S3, CloudFront, or allowed hosts)
    const parsedUrl = await assertAllowedUrl(url, {
      allowedHostSuffixes: [
        ".s3.amazonaws.com",
        ".s3.ap-northeast-2.amazonaws.com",
        ".s3.ap-southeast-1.amazonaws.com",
        ".cloudfront.net",
      ],
      allowedHostnames: new Set([
        "s3.amazonaws.com",
        "s3.ap-northeast-2.amazonaws.com",
        "s3.ap-southeast-1.amazonaws.com",
      ]),
    });

    // Fetch the image
    const response = await fetch(parsedUrl.toString());

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
