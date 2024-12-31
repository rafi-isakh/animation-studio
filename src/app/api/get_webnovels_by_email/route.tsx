import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_by_email?email=${email}`);
    if (!response.ok) {
        return NextResponse.json({ message: 'Failed to get webnovels by email: ' + response.statusText }, { status: response.status, statusText: response.statusText });
    }
    const data = await response.json();
    return NextResponse.json(data);
}