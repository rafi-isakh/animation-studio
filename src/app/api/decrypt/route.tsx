import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { encrypted } = await request.json();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/decrypt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted })
    });
    const data = await response.json();
    return NextResponse.json(data);
}