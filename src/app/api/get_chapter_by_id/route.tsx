import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_by_id?id=${id}`);
    const data = await response.json();
    return NextResponse.json(data);
}