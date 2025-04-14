import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")

    if (!session || !session.user) {
        return NextResponse.json({
            message: "Unauthorized",
        }, {
            status: 401
        });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_library`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    }
    );

    if (!response.ok) {
        return NextResponse.json({
            message: "Failed to get library",
        }, {
            status: response.status
        });
    }

    const data = await response.json();
    return NextResponse.json({
        library: data
    });
}

