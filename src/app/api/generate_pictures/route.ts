export const maxDuration = 300; // This function can run for a maximum of 300 seconds

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, context, n} = await request.json();
    if (!text || !context) {
        return NextResponse.json({ error: 'Text and context are required' }, { status: 400 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/generate_pictures`, {
        method: 'POST',
        body: JSON.stringify({ text, context, n }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    })
    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to generate pictures', message: response.statusText }, { status: response.status });
    }
    const data = await response.json()
    // const images = ["https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739847713252.png",
    //                 "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739848305012.png",
    //                 "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739850897741.png",
    //                 "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739858132577.png"]
    // const base64Images = await Promise.all(images.map(image => fetch(image).then(res => res.arrayBuffer()).then(buffer => Buffer.from(buffer).toString('base64'))));
    // const data = { images: base64Images }
    return NextResponse.json(data)
}