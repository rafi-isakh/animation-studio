export const maxDuration = 300;
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { chapter_ids, trailer_style, trailer_type } = await request.json();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/generate_trailer_prompts_and_pictures`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            "Provider": session.provider,
        },
        body: JSON.stringify({ chapter_ids, trailer_style, trailer_type }),
    });
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to generate trailer prompts and pictures" }, { status: 500 });
    }
    const data = await response.json();
    return NextResponse.json(data);
}