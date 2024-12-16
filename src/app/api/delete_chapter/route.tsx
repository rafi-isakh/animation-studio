import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")

    if (!session || !session.user) {
        return NextResponse.json({
            message: "Unauthorized",
        }, {
            status: 401
        });
    }

    if (!id) {
        return NextResponse.json({
            message: "Id is required",
        }, {
            status: 400
        });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_chapter?id=${id}`, {
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    }
    );

    if (!response.ok) {
        return NextResponse.json({
            message: "Delete chapter failed",
        }, {
            status: response.status
        });
    }

    return NextResponse.json({
        message: "Delete chapter success",
    }, {
        status: 200
    });
}

// 