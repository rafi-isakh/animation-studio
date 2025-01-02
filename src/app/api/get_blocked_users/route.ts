import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_blocked_users`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    });
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to get blocked users: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    const data = await response.json();
    return NextResponse.json({ blockedUsers: data });
}