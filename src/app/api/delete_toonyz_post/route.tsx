import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = searchParams.get('id')
    if (!id) {
        return NextResponse.json({ error: "No id provided" }, { status: 400 })
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_toonyz_post?id=${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
    });
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to delete toonyz post" }, { status: 500 })
    }
    return NextResponse.json({ 
        message: "Toonyz post deleted",
        redirect: "/feed" 
    });
}