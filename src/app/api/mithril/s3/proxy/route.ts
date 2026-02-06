import { NextRequest, NextResponse } from "next/server";

const VIDEOS_CLOUDFRONT = process.env.NEXT_PUBLIC_VIDEOS_CLOUDFRONT;

// GET - Proxy fetch for S3/CloudFront resources to avoid CORS issues
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
    // Allow CloudFront domain for video downloads
    ...(VIDEOS_CLOUDFRONT ? [VIDEOS_CLOUDFRONT] : []),
  ];

  try {
    const parsedUrl = new URL(url);
    const isAllowed = allowedDomains.some(
      (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(domain)
    );

    if (!isAllowed) {
      return NextResponse.json({ error: "URL domain not allowed" }, { status: 403 });
    }

    // Fetch the resource from S3/CloudFront
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch resource: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    // Return the resource with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Proxy fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}