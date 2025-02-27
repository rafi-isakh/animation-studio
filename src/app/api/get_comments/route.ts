import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const chapter_id = searchParams.get("chapter_id");
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_comments?chapter_id=${chapter_id}`);
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch webnovel chapter comments" }, { status: 500 });
    }
    const data = await response.json();
    return NextResponse.json(data);
}