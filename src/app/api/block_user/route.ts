import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/block_user?id=${id}`);
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to block user' }, { status: response.status, statusText: response.statusText });
    }
    return NextResponse.json({ message: 'Blocked user' });
}