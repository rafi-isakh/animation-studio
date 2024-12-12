import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'

export async function GET(req: NextRequest, res: NextResponse) {
    const { searchParams } = new URL(req.url);
    const chapter_id = searchParams.get("chapter_id")
    const is_webtoon = searchParams.get("is_webtoon")
    const is_webnovel = searchParams.get("is_webnovel")

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/increase_views_not_logged_in?chapter_id=${chapter_id}&is_webtoon=${is_webtoon}&is_webnovel=${is_webnovel}`);

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

