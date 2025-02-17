import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { title, content, fileName, type, tags, link } = await request.json();
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let bodyToSend = { title, content, tags, image: "", video: "", link }

    if (type === "image") {
        bodyToSend.image = fileName;
    } else if (type === "video") {
        bodyToSend.video = fileName;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/create_toonyz_post`, {
        method: 'POST',
        body: JSON.stringify(bodyToSend),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider,
        }
    });
    if (!response.ok) {
        return NextResponse.json({ error: response.statusText }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}
