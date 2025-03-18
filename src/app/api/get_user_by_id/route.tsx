import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_by_id?user_id=${user_id}`);
    const data = await response.json();
    return NextResponse.json(data);
}