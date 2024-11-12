import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/utils/s3'
import { auth } from '@/auth';
import { UserCreate } from '@/components/Types';

export async function POST(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const promoCode = req.nextUrl.searchParams.get('promo_code');
    if (!session) {
        return NextResponse.json({
            "message": "Unauthorized",
            "status": 401
        });
    }
    const { file, bio, nickname } = await req.json();

    const email = session.user?.email;

    let fileName = "";

    if (file) {
        const fileType = file.type;
        const fileContent = Buffer.from(await file.arrayBuffer());

        const fileNameResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_random_filename`);
        fileName = await fileNameResponse.json();
        try {
            const s3Response = await uploadFile(fileContent, fileName, fileType);
        } catch (error) {
            console.error('Error uploading file to s3:', error);
            return NextResponse.json({
                message: "Failed to upload to s3",
                status: 500
            });
        }
    }

    const userData: UserCreate = {
        "email": email as string,
        "bio": bio as string,
        "nickname": nickname as string,
        "picture": fileName as string,
        "provider": session.provider
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/update_user?promo_code=${promoCode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        console.error("Error updating user", response.status)
        return NextResponse.json({
            message: "Failed to update user",
            status: 500
        });
    }

    return NextResponse.json({
        message: "Success!!",
        status: 200,
    });
}

