import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapter_id, price } = await req.json();

    if (!chapter_id) {
        return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/purchase_chapter`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Provider': session.provider
            },
            body: JSON.stringify({
                chapter_id: chapter_id,
                price: price
            })
        }
    );


    if (!response.ok) {
        const error = await response.text();
        console.error('Failed to purchase chapter', error);
        return NextResponse.json({ success: false, message: error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, message: data }, { status: 200 });
}
