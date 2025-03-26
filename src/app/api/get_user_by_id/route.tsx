import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_by_id?id=${id}`);
    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
    const data = await response.json();
    return NextResponse.json(data);
}