import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_metadata_by_user_id?user_id=${user_id}`);
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to get webnovels by email hash: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    const data = await response.json();
    return NextResponse.json(data);
}