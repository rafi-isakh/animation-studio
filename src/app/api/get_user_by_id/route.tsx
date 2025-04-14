import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_by_id?id=${id}`);
    if (!response.ok) {
        const error = await response.text();
        console.error(error);
        return NextResponse.json({ error: error }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}