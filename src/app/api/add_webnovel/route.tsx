import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'

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

  const fileType = coverArt.type;
  const fileContent = Buffer.from(await coverArt.arrayBuffer());

  const fileNameResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_random_filename`);
  const fileName = await fileNameResponse.json();

  try {

    const s3Response = await uploadFile(fileContent, fileName, fileType);
  } catch (error) {
    console.error('Error uploading file to s3:', error);
    return NextResponse.json({
      "message": "Upload to s3 failed",
      "status": 500
    });
  }


  const data = {
    user_email: session.user.email,
    title: title,
    description: description,
    cover_art: fileName,
    genre: genre,
    language: language
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_webnovel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'Provider': session.provider
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
