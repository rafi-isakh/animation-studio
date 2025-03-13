export const maxDuration = 300;
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { chapter_ids, trailer_style, trailer_type } = await request.json();
    // const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/generate_trailer_prompts_and_pictures`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": `Bearer ${session.accessToken}`,
    //         "Provider": session.provider,
    //     },
    //     body: JSON.stringify({ chapter_ids, trailer_style, trailer_type }),
    // });
    // if (!response.ok) {
    //     return NextResponse.json({ error: "Failed to generate trailer prompts and pictures" }, { status: 500 });
    // }
    const images = ["https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/f919969e-6c41-481e-a866-2359fa7f7bef.png",
                    "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/70cb40a1-3656-473f-b801-9335d83bcfed.png",
                    "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/a9de32bd-09d8-4bbd-a3f3-4f18b524b74d.png",
                    "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/c3b4651f-7b1c-4fdc-a901-9e14161e24b0.png"]
    const base64Images = await Promise.all(images.map(image => fetch(image).then(res => res.arrayBuffer()).then(buffer => Buffer.from(buffer).toString('base64'))));
    const data = { images: base64Images, narrations: ["narration1", "narration2", "narration3", "narration4"] }
    return NextResponse.json(data);
}