import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const WEBTOONS_BUCKET_NAME = "toonyzwebtoonsbucket";
const AWS_S3_ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY ?? "";
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY ?? "";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: AWS_S3_ACCESS_KEY,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  },
  region: REGION,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');


  if (!filename) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 });
  }

  const params = {
    Bucket: WEBTOONS_BUCKET_NAME,
    Key: filename,
  };

  console.log("Fetching file from S3:", WEBTOONS_BUCKET_NAME)
  console.log("Using key:", filename)

  try {
    const data = await s3Client.send(new GetObjectCommand(params));
    const stream = data.Body as Readable;

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg', // Adjust MIME type as needed
      },
    });
  } catch (err) {
    console.error("Error fetching file:", err);
    return NextResponse.json({ error: 'Error fetching file' }, { status: 500 });
  }
}