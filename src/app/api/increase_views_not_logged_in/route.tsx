import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, res: NextResponse) {
    const { searchParams } = new URL(req.url);
    const chapter_id = searchParams.get("chapter_id")
    const is_webtoon = searchParams.get("is_webtoon")
    const is_webnovel = searchParams.get("is_webnovel")

    let appendString = ""
    if (is_webtoon) {
        appendString = "&is_webtoon=true"
    } else if (is_webnovel) {
        appendString = "&is_webnovel=true"
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/increase_views_not_logged_in?chapter_id=${chapter_id}${appendString}`);

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

