import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest, res: NextResponse) {
    const { content, translation } = await req.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/send_content`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'original': content,
            'translation': translation
        })
    });

    if (!response.ok) {
        return NextResponse.json({
            "message": "Failed to send content",
            "status": response.status
        });
    }

    return NextResponse.json({
        "message": "Send content success",
        "status": 200,
    });
}

