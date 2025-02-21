import { ffmpegCombineToSlideshow } from "@/utils/ffmpeg";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { pictures } = await req.json();
    try {
        const fileName = await ffmpegCombineToSlideshow(pictures, req);
        return NextResponse.json({ fileName }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to make slideshow" }, { status: 500 });
    }
}