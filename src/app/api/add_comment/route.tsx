import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await auth();
  const data = await req.json();

  if (!session) {
    return NextResponse.json({
        message: "Unauthorized",
    }, {
        status: 401
    });
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_comment`, {
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
        message: response.statusText,
    }, {
        status: response.status
    });
  }

  if (data.webnovel_or_post) { // webnovel_or_post is true when adding a comment to a post
    revalidateTag("toonyz_posts")
  }

  return NextResponse.json({
        message: "Success",
    }, {
        status: 200
    });
}
