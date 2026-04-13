import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/utils/s3";
import { assertAllowedUrl } from "@/utils/urlSafety";

const VIDEOS_CLOUDFRONT = process.env.NEXT_PUBLIC_VIDEOS_CLOUDFRONT;

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// GET - Proxy fetch for S3/CloudFront resources to avoid CORS issues
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    const allowedHostnames = new Set([
      "s3.amazonaws.com",
      "s3.ap-northeast-2.amazonaws.com",
      ...(VIDEOS_CLOUDFRONT ? [VIDEOS_CLOUDFRONT] : []),
    ]);

    const parsedUrl = assertAllowedUrl(url, {
      allowedHostSuffixes: [
        ".s3.amazonaws.com",
        ".s3.ap-northeast-2.amazonaws.com",
        ".cloudfront.net",
      ],
      allowedHostnames,
    });

    // For direct S3 URLs (private bucket), use the SDK; for CloudFront, plain fetch is fine
    const isDirectS3 = parsedUrl.hostname.endsWith(".amazonaws.com") &&
      parsedUrl.hostname.includes(".s3.");

    let contentType: string;
    let buffer: ArrayBuffer;

    if (isDirectS3) {
      // URL format: https://<bucket>.s3.<region>.amazonaws.com/<key>
      // Extract bucket from hostname and key from pathname
      const bucket = parsedUrl.hostname.split(".")[0];
      const s3Key = parsedUrl.pathname.slice(1);
      console.log(`[s3-proxy] Fetching private S3 object: bucket=${bucket} key=${s3Key}`);
      const cmd = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
      const s3Response = await s3Client.send(cmd);
      const bytes = await s3Response.Body!.transformToByteArray();
      contentType = s3Response.ContentType || "application/octet-stream";
      buffer = bytes.buffer as ArrayBuffer;
    } else {
      const response = await fetch(parsedUrl.toString());
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch resource: ${response.status}` },
          { status: response.status }
        );
      }
      contentType = response.headers.get("content-type") || "application/octet-stream";
      buffer = await response.arrayBuffer();
    }

    // Return the resource with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.byteLength.toString(),
        // Use shorter cache for text files, longer for media
        "Cache-Control": contentType.startsWith("text/")
          ? "public, max-age=3600"
          : "public, max-age=31536000, immutable",
        // Ensure CORS headers are set
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[s3-proxy] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
