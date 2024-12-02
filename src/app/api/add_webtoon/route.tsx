import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSignedUrlForWebtoonImage, uploadFile } from '@/utils/s3'

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await auth();
  const formData = await req.formData();

  if (!session || !session.user) {
    return NextResponse.json({
      message: "Unauthorized",
    }, {
      status: 401
    });
  }

  const title = formData.get('title')
  const description = formData.get('description')
  const genre = formData.get('genre')
  const language = formData.get('language')
  const rootDirectory = formData.get('rootDirectory')
  const author = formData.get('author')
  const email = formData.get('email')
  const coverArt = "cover_art.jpg"

  if (!title || !description || !rootDirectory || !genre) {
    return NextResponse.json({ error: 'Missing webtoon data' }, { status: 400 });
  }

  const send_data = {
    user_email: email,
    title: title,
    description: description,
    genre: genre,
    language: language,
    root_directory: rootDirectory,
    cover_art: coverArt,
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_webtoon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'Provider': session.provider
    },
    body: JSON.stringify(send_data),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({
      "message": "Add webtoon failed",
      "status": response.status
    });
  }

  const chapters = []
  for (let i = 1; i < 6; i++) {
    const chapter = {
      episode_number: i,
      directory: i.toString().padStart(3, '0'),
      webtoon_id: data["id"]
    }
    chapters.push(chapter)
  }

  for (const chapter of chapters) {
    console.log("adding chapter", chapter.episode_number)
    const response2 = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_chapter_to_webtoon`, {
      method: 'POST',
      body: JSON.stringify(chapter),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
        'Provider': session.provider
      },
    })
    const data2 = await response2.json()
    console.log(data2)
  }

  return NextResponse.json(
    {
      message: "Add webtoon success"
    },
    {
      status: 200,
    }
  );
}
