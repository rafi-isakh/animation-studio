import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("webnovel_id")

    if (!session || !session.user) {
        return NextResponse.json({
            "message": "Unauthorized",
            "status": 401
        });
    }

    const email = session.user.email;

    if (!id || !email) {
        return NextResponse.json({
            "message": "Id and email are required",
            "status": 400
        });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_to_library?email=${email}&webnovel_id=${id}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    }
    );

    if (!response.ok) {
        return NextResponse.json({
            "message": "Failed to add to library",
            "status": response.status
        });
    }

    return NextResponse.json({
        "message": "Add to library success",
        "status": 200,
    });
}

