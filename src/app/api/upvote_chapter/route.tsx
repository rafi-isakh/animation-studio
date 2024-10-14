import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")
    const email = searchParams.get("user_email")
    const undo = searchParams.get("undo")

    if (!session || !session.user) {
        return NextResponse.json({
            "message": "Unauthorized",
            "status": 401
        });
    }

    if (!id || !email) {
        return NextResponse.json({
            "message": "Id and email are required",
            "status": 400
        });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/upvote_chapter?chapter_id=${id}&user_email=${email}&undo=${undo}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    }
    );

    if (!response.ok) {
        return NextResponse.json({
            "message": "Failed to upvote chapter",
            "status": response.status
        });
    }

    return NextResponse.json({
        "message": "Upvote chapter success",
        "status": 200,
    });
}

