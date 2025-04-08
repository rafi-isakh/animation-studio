import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const startTime = Date.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_by_id?id=${id}`);
    const elapsedTime = Date.now() - startTime;

    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch chapter" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}