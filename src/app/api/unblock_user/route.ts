import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth();
    const {searchParams} = new URL(request.url);
    const id = searchParams.get('id');
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/unblock_user?id=${id}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    });
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to unblock user: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    return NextResponse.json({ message: 'User unblocked' });
}