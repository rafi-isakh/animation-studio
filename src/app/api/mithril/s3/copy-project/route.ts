import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import {
  CopyObjectCommand,
  ListObjectsV2Command,
  type _Object,
} from "@aws-sdk/client-s3";
import {
  CopyProjectFilesRequest,
  CopyProjectFilesResponse,
  getProjectPrefix,
} from "@/components/Mithril/services/s3/types";

export const dynamic = 'force-dynamic';

const VIDEOS_BUCKET_NAME = "toonyzvideosbucket";
const PICTURES_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

async function listObjectsByPrefix(bucket: string, prefix: string): Promise<_Object[]> {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (response.Contents?.length) {
      objects.push(...response.Contents);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}

async function copyObjects(
  bucket: string,
  sourcePrefix: string,
  destinationPrefix: string
): Promise<number> {
  const objects = await listObjectsByPrefix(bucket, sourcePrefix);

  for (const object of objects) {
    if (!object.Key) {
      continue;
    }

    const destinationKey = object.Key.replace(sourcePrefix, destinationPrefix);
    const encodedSourceKey = encodeURIComponent(object.Key).replace(/%2F/g, '/');

    await s3Client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: destinationKey,
        CopySource: `${bucket}/${encodedSourceKey}`,
        MetadataDirective: 'COPY',
      })
    );
  }

  return objects.length;
}

/**
 * POST /api/mithril/s3/copy-project
 * Copy all project files from source project prefix to destination prefix.
 */
export async function POST(request: NextRequest): Promise<NextResponse<CopyProjectFilesResponse>> {
  try {
    if (!PICTURES_BUCKET_NAME) {
      return NextResponse.json(
        { success: false, copiedCount: 0, error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const body: CopyProjectFilesRequest = await request.json();
    const { sourceProjectId, destinationProjectId } = body;

    if (!sourceProjectId || !destinationProjectId) {
      return NextResponse.json(
        {
          success: false,
          copiedCount: 0,
          error: "Missing required fields: sourceProjectId, destinationProjectId",
        },
        { status: 400 }
      );
    }

    if (sourceProjectId === destinationProjectId) {
      return NextResponse.json(
        { success: false, copiedCount: 0, error: "Source and destination project IDs must be different" },
        { status: 400 }
      );
    }

    const sourcePrefix = getProjectPrefix(sourceProjectId);
    const destinationPrefix = getProjectPrefix(destinationProjectId);

    const [picturesCount, videosCount] = await Promise.all([
      copyObjects(PICTURES_BUCKET_NAME, sourcePrefix, destinationPrefix),
      copyObjects(VIDEOS_BUCKET_NAME, sourcePrefix, destinationPrefix),
    ]);

    return NextResponse.json({
      success: true,
      copiedCount: picturesCount + videosCount,
    });
  } catch (error) {
    console.error("Error copying project files in S3:", error);
    return NextResponse.json(
      { success: false, copiedCount: 0, error: "Failed to copy project files" },
      { status: 500 }
    );
  }
}
