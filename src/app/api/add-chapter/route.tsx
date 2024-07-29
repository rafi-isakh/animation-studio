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
  const webnovel_id = formData.get('webnovel_id')

 if (!title || !content ) {
    return NextResponse.json({ error: 'Missing web novel data' }, { status: 400 });
  }

  const data = {
    title: title,
    content: content,
    webnovel_id: webnovel_id
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_chapter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
      'Provider': session.provider
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    return NextResponse.json({
        "message": "Add chapter failed",
        "status": response.status
    });
  }

  return NextResponse.json({
        "message": "Success",
        "status": 200
    });
}
