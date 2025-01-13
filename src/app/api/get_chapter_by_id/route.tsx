import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const webnovelOrWebtoon = searchParams.get('webnovel_or_webtoon');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_by_id?id=${id}&webnovel_or_webtoon=${webnovelOrWebtoon}`);
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch chapter" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}