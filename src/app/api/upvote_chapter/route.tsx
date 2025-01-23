import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("chapter_id")
    const email = searchParams.get("user_email")
    const undo = searchParams.get("undo")

    if (!session || !session.user) {
        return NextResponse.json({
            message: "Unauthorized",
        }, {
            status: 401
        });
    }

    if (!id || !email) {
        return NextResponse.json({
            message: "Id and email are required",
        }, {
            status: 400
        });
    }

    let url;
    if (undo) {
        url = `${process.env.NEXT_PUBLIC_BACKEND}/api/upvote_chapter?chapter_id=${id}&user_email=${email}&undo=${undo}`
    } else {
        url = `${process.env.NEXT_PUBLIC_BACKEND}/api/upvote_chapter?chapter_id=${id}&user_email=${email}`
    }
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    }
    );

    if (!response.ok) {
        return NextResponse.json({
            message: "Failed to upvote chapter",
        }, {
            status: response.status
        });
    }

    const data = await response.json();
    return NextResponse.json({
        message: "Upvote chapter success",
        upvotes: data
    }, {
        status: 200,
    });
}

