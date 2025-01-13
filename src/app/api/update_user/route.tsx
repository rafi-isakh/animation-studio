import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/utils/s3'
import { auth } from '@/auth';
import { UserCreate } from '@/components/Types';

export async function POST(req: NextRequest, res: NextResponse) {
    const session = await auth();
    const promoCode = req.nextUrl.searchParams.get('promo_code');
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bio = formData.get('bio') as string;
    const nickname = formData.get('nickname') as string;

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
            return NextResponse.json(
                { error: "Failed to upload file to S3" },
                { status: 500 }
            );
        }
    }

    const userData: UserCreate = {
        "email": email as string,
        "bio": bio as string,
        "nickname": nickname as string,
        "picture": fileName as string,
        "provider": session.provider
    }

    let fetchstr = `${process.env.NEXT_PUBLIC_BACKEND}/api/update_user`
    if (promoCode) {
        fetchstr = `${fetchstr}?promo_code=${promoCode}`
    }
    const response = await fetch(fetchstr, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        console.error("Error updating user", response.status);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: response.status }
        );
    }

    return NextResponse.json(
        { message: "User updated successfully" },
        { status: 200 }
    );
}

