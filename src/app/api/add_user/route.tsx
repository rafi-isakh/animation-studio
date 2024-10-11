import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/utils/s3'
import { UserCreate } from '@/components/Types';

export async function POST(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const promoCode = req.nextUrl.searchParams.get('promo_code');
    const postedData = await req.json();

    console.log("promoCode:", promoCode)
    console.log("postedData:", postedData)
    console.log("session:", session)

    if (!session || !session.user) {
        return NextResponse.json({
            "message": "Unauthorized",
            "status": 401
        });
    }
    const data: UserCreate = {
        'email': session.user.email ?? "",
        'provider': session.provider,
        'nickname': postedData.nickname,
        'bio': postedData.bio,
    }

    console.log("data:", data)
    console.log(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_user?promo_code=${promoCode}`)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_user?promo_code=${promoCode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(data),
    });
    console.log("response from /api/add_user backend:", response)

    const r = await response.json();

    if (!response.ok) {
        return NextResponse.json({
            "message": "Add user failed",
            "status": response.status
        });
    }

    return NextResponse.json({
        "message": "Add user success",
        "status": 200,
        "id": r["id"]
    });
}
