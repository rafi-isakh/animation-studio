import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_premium_webnovel_ids`);
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch premium webnovel ids" }, { status: 500 });
    }
    const data = await response.json();
    return NextResponse.json({ ids: data });
}