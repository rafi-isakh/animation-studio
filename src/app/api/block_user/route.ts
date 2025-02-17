import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth();
    const id = request.nextUrl.searchParams.get('id');
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/block_user?id=${id}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    });
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to block user: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    return NextResponse.json({ message: 'Blocked user' });
}