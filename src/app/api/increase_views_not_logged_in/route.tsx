import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'

export async function GET(req: NextRequest, res: NextResponse) {
    console.log("increase views")
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const chapter_id = searchParams.get("chapter_id")

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/increase_views_not_logged_in?chapter_id=${chapter_id}`);

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

