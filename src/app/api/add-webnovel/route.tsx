import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await auth();
  const formData = await req.formData();

  if (!session || !session.user) {
    return NextResponse.json({
      "message": "Unauthorized",
      "status": 401
    });
  }

  const title = formData.get('title')
  const description = formData.get('description')
  const coverArt = formData.get('coverArt') as File
  const genre = formData.get('genre')
  const language = formData.get('language')

  if (!title || !description || !coverArt || !genre) {
    return NextResponse.json({ error: 'Missing web novel data' }, { status: 400 });
  }


  const destinationDirPath = path.join(process.cwd(), "public/upload");

  const fileName = coverArt.name;
  const fileType = coverArt.type;
  const fileContent = Buffer.from(await coverArt.arrayBuffer());

  const awsParams = {
    Bucket: process.env.AWS_BUCKET_NAME ?? "",
    Key: fileName,
    Body: fileContent,
    ContentType: fileType,
    ACL: 'public-read'
  }

  try {
    await s3.upload(awsParams).promise();
  } catch (error) {
    console.error('Error uploading file to s3:', error);
  }


  const data = {
    user_email: session.user.email,
    title: title,
    description: description,
    cover_art: coverArt.name,
    genre: genre,
    language: language
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_webnovel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const r = await response.json();

  if (!response.ok) {
    return NextResponse.json({
      "message": "Add webnovel failed",
      "status": response.status
    });
  }

  return NextResponse.json({
    "message": "Success!!",
    "status": 200,
    "id": r["id"]
  });
}
