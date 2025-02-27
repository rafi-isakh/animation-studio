import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const post_id = searchParams.get("post_id");
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_toonyz_post_comments?post_id=${post_id}`);
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch toonyz post comments" }, { status: 500 });
    }
    const data = await response.json();
    return NextResponse.json(data);
}