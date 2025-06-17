import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await auth();
  const formData = await req.formData();

  if (!session) {
    return NextResponse.json({
        message: "Unauthorized",
    }, {
        status: 401
    });
  }

  const id = formData.get('id')
  const title = formData.get('title')
  const content = formData.get('content')
  const webnovel_title = formData.get('webnovel_title')
  const webnovel_id = formData.get('webnovel_id')
  const last_edited = formData.get('last_edited')
  const language = formData.get('language')

  if (!id || !content || !webnovel_id || !last_edited || !language) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const data = {
    id: parseInt(id as string),
    title: title as string,
    content: content as string,
    webnovel_title: webnovel_title as string,
    webnovel_id: parseInt(webnovel_id as string),
    last_edited: last_edited as string,
    language: language as string
  };

  console.log("data", data);

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/edit_chapter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'Provider': session.provider
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    console.error("error", error);
    return NextResponse.json({
        message: "Edit chapter failed",
    }, {
        status: response.status
    });
  }

  return NextResponse.json({
        message: "Success",
    }, {
        status: 200
    });
}
