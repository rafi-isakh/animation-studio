import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapters_metadata_by_webnovel_id?id=${id}&limit=${limit}&offset=${offset}`;

    const response = await fetch(backendUrl);
    const data = await response.json();

    return NextResponse.json(data);
}
