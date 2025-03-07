import { ffmpegCombineToSlideshow } from "@/utils/ffmpeg";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { picture_urls } = await req.json();
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND}/api/ffmpeg_combine_pictures_to_slideshow`,
            {
                method: "POST",
                body: JSON.stringify({ picture_urls }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Provider': session.provider
                }
            }
        );
        const data = await response.json();
        return NextResponse.json({ video_filename: data.video_filename }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to make slideshow" }, { status: 500 });
    }
}