import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const chapter_id = searchParams.get("chapter_id")
    const email = searchParams.get("user_email")
    const is_webnovel = searchParams.get("is_webnovel")
    const is_webtoon = searchParams.get("is_webtoon")

    let is_webnovel_or_webtoon_param = ""
    if (is_webnovel) {
        is_webnovel_or_webtoon_param = "is_webnovel=true"
    } else if (is_webtoon) {
        is_webnovel_or_webtoon_param = "is_webtoon=true"
    }

    if (!session || !session.user) {
        return NextResponse.json({
            message: "Unauthorized",
        }, {
            status: 401
        });
    }

    if (!chapter_id || !email) {
        return NextResponse.json({
            message: "Chapter id and email are required",
        }, {
            status: 400
        });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/increase_views?chapter_id=${chapter_id}&user_email=${email}&${is_webnovel_or_webtoon_param}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    }
    );

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

