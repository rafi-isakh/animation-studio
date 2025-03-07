export const maxDuration = 300; // This function can run for a maximum of 300 seconds

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_prompt, image_url } = await request.json();
    if (!image_url) {
        return NextResponse.json({ error: 'Video prompt and image url are required' }, { status: 400 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/generate_video`, {
        method: 'POST',
        body: JSON.stringify({ video_prompt, image_url }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    })
    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to generate video', message: response.statusText }, { status: response.status });
    }
    const data = await response.json()
    // const data = {
    //     video_url: "https://toonyzvideosbucket.s3.ap-northeast-2.amazonaws.com/video_1740636799390.mp4" // test
    // }
    return NextResponse.json(data)
}