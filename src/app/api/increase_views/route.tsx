import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const chapter_id = searchParams.get("chapter_id")
    const email = searchParams.get("user_email")

    if (!chapter_id) {
        return NextResponse.json({
            message: "Chapter id is required",
        }, {
            status: 400
        });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/increase_views?chapter_id=${chapter_id}`);

    if (!response.ok) {
        return NextResponse.json({
            message: "Failed to increase views",
        }, {
            status: response.status
        });
    }

    return NextResponse.json({
        message: "Increase views success",
    }, {
        status: 200
    });
}

