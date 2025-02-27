import { NextResponse } from "next/server";
import { downloadAndUploadVideo } from "@/utils/s3";
import { auth } from "@/auth";

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { videoUrl } = await request.json();
    try {
        const fileName = await downloadAndUploadVideo(videoUrl);
        return NextResponse.json({ fileName: fileName });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to download and upload video" }, { status: 500 });
    }
}