import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";

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

  const fileArrayBuffer = await coverArt.arrayBuffer();

  if (!existsSync(destinationDirPath)) {
    fs.mkdir(destinationDirPath, { recursive: true });
  }
  const coverArtPath = path.join(destinationDirPath, coverArt.name)

  await fs.writeFile(
    coverArtPath,
    Buffer.from(fileArrayBuffer)
  );

  const data = {
    userEmail: session.user.email,
    title: title,
    description: description,
    coverArt: coverArt.name,
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
