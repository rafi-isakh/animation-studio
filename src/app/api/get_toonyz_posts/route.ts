import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_toonyz_posts`)
    const data = await response.json();
    return NextResponse.json(data);
}