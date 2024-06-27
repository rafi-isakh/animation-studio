import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await auth();
  const formData = await req.formData();

  if (!session) {
    return NextResponse.json({
        "message": "Unauthorized",
        "status": 401
    });
  }

  const title = formData.get('title')
  const content = formData.get('content')
  const coverArt = formData.get('coverArt') as File

 if (!title || !content || !coverArt) {
    return NextResponse.json({ error: 'Missing web novel data' }, { status: 400 });
  }


  console.log(`File name: ${coverArt.name}`);
  console.log(`Content-Length: ${coverArt.size}`);

  const destinationDirPath = path.join(process.cwd(), "public/upload");
  console.log(destinationDirPath);

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
    userId: session.user?.id,
    userName: session.user?.name,
    userEmail: session.user?.email,
    title: title,
    content: content,
    coverArt: coverArt.name
  };

  const response = await fetch('http://localhost:5000/api/add_webnovel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return NextResponse.json({
        "message": "Add webnovel failed",
        "status": response.status
    });
  }

  return NextResponse.json({
        "message": "Success",
        "status": 200
    });
}
