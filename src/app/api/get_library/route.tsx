import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")

    if (!session || !session.user) {
        return NextResponse.json({
            "message": "Unauthorized",
            "status": 401
        });
    }

    if (!email) {
        return NextResponse.json({
            "message": "Email is required",
            "status": 400
        });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_library?email=${email}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    }
    );

    if (!response.ok) {
        return NextResponse.json({
            "message": "Failed to get library",
            "status": response.status
        });
    }

    return NextResponse.json({
        "message": "Get library success",
        "status": 200,
    });
}

