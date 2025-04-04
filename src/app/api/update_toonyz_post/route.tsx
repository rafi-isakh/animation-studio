import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ToonyzPostUpdate } from '@/components/Types';


export async function POST(req: NextRequest, res: NextResponse) {
    const session = await auth();
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
    const formData = await req.formData();
    const toonyzPostUpdate: ToonyzPostUpdate = {
        id: parseInt(formData.get('postId') as string),
        title: formData.get('title') as string,
        tags: formData.get('tags') as string,
        content: formData.get('content') as string,
    };

    const toonyzPostUpdateData: ToonyzPostUpdate = {
        "id": toonyzPostUpdate.id,
        "title": toonyzPostUpdate.title,
        "tags": toonyzPostUpdate.tags,
        "content": toonyzPostUpdate.content,
    }

    let fetchstr = `${process.env.NEXT_PUBLIC_BACKEND}/api/update_toonyz_post`

    const response = await fetch(fetchstr, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        },
        body: JSON.stringify(toonyzPostUpdateData),
    });

    if (!response.ok) {
        console.error("Error updating toonyz post", response.status);
        return NextResponse.json(
            { error: "Failed to update toonyz post" },
            { status: response.status }
        );
    }

    const data = await response.json();

    return NextResponse.json(data);
}

