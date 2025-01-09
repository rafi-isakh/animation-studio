import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'
import { UserCreate } from '@/components/Types';

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const session = await auth();
        const promoCode = req.nextUrl.searchParams.get('promo_code');
        const postedData = await req.json();

        if (!session || !session.user) {
            return NextResponse.json({
                message: "Unauthorized",
            }, {
                status: 401
            });
        }
        console.log("session", session)
        const data: UserCreate = {
            'email': session.user.email ?? "",
            'provider': session.provider,
            'nickname': postedData.nickname,
            'bio': postedData.bio,
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_user?promo_code=${promoCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
                'Provider': session.provider
            },
            body: JSON.stringify(data),
        });

        const data2 = await response.json();

        if (!response.ok) {
            return NextResponse.json({
                message: "Add user failed",
                error: data2.error
            },
                {
                    status: response.status
                });
        }

        return NextResponse.json({
            message: "Add user success",
            id: data2.id
        },
            {
                status: 200,
            });
    } catch (error) {
        console.error("Error in add_user route:", error)
        return NextResponse.json({
            message: "Internal server error",
            error: error
        },
            {
                status: 500,
            });
    }
}