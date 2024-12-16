import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webtoons_by_email?email=${email}`);
    const data = await response.json();
    return NextResponse.json(data);
}