import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const url = `${process.env.NEXT_PUBLIC_BACKEND}/api/get_upvoted_chapters?email=${email}`;
    const response = await fetch(url);
    if (!response.ok) {
        return NextResponse.json({
            message: "Failed to get upvoted chapters",
        },
        { status: response.status }
    );
    }
    else {
        const data = await response.json();
        return NextResponse.json(data);
    }
}
