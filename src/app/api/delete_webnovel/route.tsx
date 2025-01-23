import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest, res: NextResponse) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")

  if (!session || !session.user) {
    return NextResponse.json({
      message: "Unauthorized",
    }, {
      status: 401
    });
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_webnovel?id=${id}`, {
    headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Provider': session.provider
      }
    }
  );

  if (!response.ok) {
    return NextResponse.json({
      message: "Delete webnovel failed",
    }, {
      status: response.status
    });
  }

  return NextResponse.json({
    message: "Delete webnovel success",
  }, {
    status: 200
  });
}

