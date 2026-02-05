import { NextRequest, NextResponse } from "next/server";

// GET - Proxy fetch for S3 images to avoid CORS issues
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  // Validate that it's an S3 URL or allowed domain
  const allowedDomains = [
    "s3.amazonaws.com",
    "s3.ap-northeast-2.amazonaws.com",
    ".s3.amazonaws.com",
    ".s3.ap-northeast-2.amazonaws.com",
    "cloudfront.net",
  ];

  try {
    const parsedUrl = new URL(url);
    const isAllowed = allowedDomains.some(
      (domain) => parsedUrl.hostname.endsWith(domain) || parsedUrl.hostname === domain.replace(".", "")
    );

    if (!isAllowed) {
      return NextResponse.json({ error: "URL domain not allowed" }, { status: 403 });
    }

    // Fetch the image from S3
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/webp";
    const buffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Proxy fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}