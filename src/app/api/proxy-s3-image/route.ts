import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy S3 images to avoid CORS issues when fetching from browser
 * Usage: /api/proxy-s3-image?url=<encoded-s3-url>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing 'url' parameter" },
        { status: 400 }
      );
    }

    // Validate that it's an S3 URL (security check)
    if (!imageUrl.includes(".s3.") && !imageUrl.includes(".amazonaws.com")) {
      return NextResponse.json(
        { error: "Invalid S3 URL" },
        { status: 400 }
      );
    }

    // Fetch the image from S3
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/webp";

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error proxying S3 image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
