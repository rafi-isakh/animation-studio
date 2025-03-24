import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const author_id = searchParams.get('author_id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_metadata_by_author_id?author_id=${author_id}`);
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to get webnovels by author id: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    const data = await response.json();
    return NextResponse.json(data);
}