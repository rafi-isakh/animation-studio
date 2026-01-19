import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";
import { processWithConcurrency } from "@/utils/concurrency";

export const maxDuration = 300; // 5 minutes max for large collections

const VIDEOS_BUCKET_NAME = process.env.VIDEOS_BUCKET_NAME;

interface ClipInfo {
  s3FileName: string;
  sceneIndex: number;
  clipIndex: number;
}

interface ZipRequest {
  clips: ClipInfo[];
  zipFileName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ZipRequest = await request.json();
    const { clips, zipFileName = "sora_videos.zip" } = body;

    // Validation
    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json(
        { error: "clips array is required" },
        { status: 400 }
      );
    }

    // Validate all clips have s3FileName and are sora videos
    const validClips = clips.filter(
      (clip) =>
        clip.s3FileName &&
        typeof clip.s3FileName === "string" &&
        clip.s3FileName.startsWith("sora_") &&
        clip.s3FileName.endsWith(".mp4")
    );

    if (validClips.length === 0) {
      return NextResponse.json(
        { error: "No valid sora video files provided" },
        { status: 400 }
      );
    }

    // Create JSZip instance
    const zip = new JSZip();

    // Fetch videos from S3 with controlled concurrency (3 at a time)
    // Balances speed vs memory usage
    await processWithConcurrency(
      validClips,
      async (clip) => {
        const command = new GetObjectCommand({
          Bucket: VIDEOS_BUCKET_NAME,
          Key: clip.s3FileName,
        });

        const response = await s3Client.send(command);

        if (response.Body) {
          const arrayBuffer = await response.Body.transformToByteArray();
          const fileName = `scene_${clip.sceneIndex + 1}_clip_${clip.clipIndex + 1}.mp4`;
          zip.file(fileName, arrayBuffer, { compression: "STORE" });
        }
      },
      {
        concurrency: 3,
        onError: (error, clip) => {
          console.error(`Failed to fetch ${clip.s3FileName}:`, error);
        },
      }
    );

    // Generate ZIP as ArrayBuffer
    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "STORE", // No compression for videos (already compressed)
    });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
        "Content-Length": zipBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating ZIP:", error);
    return NextResponse.json(
      { error: "Failed to create ZIP file" },
      { status: 500 }
    );
  }
}
