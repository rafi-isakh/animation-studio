import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_toonyz_posts`,
        {
            next: {
                tags: ['toonyz_posts'],
                revalidate: 3600
            }
        }
    )
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
    const data = await response.json();
    return NextResponse.json(data);
}