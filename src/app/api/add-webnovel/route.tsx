import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({
        "message": "Unauthorized",
        "status": 401
    });
  }

  const { title, content, coverArt } = await req.json();

 if (!title || !content || !coverArt) {
    return NextResponse.json({ error: 'Missing web novel data' }, { status: 400 });
  }

  const data = {
    userId: session.user?.id,
    userName: session.user?.name,
    userEmail: session.user?.email,
    title: title,
    content: content,
    coverArt: coverArt
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
        "message": "Unauthorized",
        "status": response.status
    });
  }

  return NextResponse.json({
        "message": "Success",
        "status": 200
    });
}
