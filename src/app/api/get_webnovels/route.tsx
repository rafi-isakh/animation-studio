import { NextResponse } from "next/server";

export async function GET() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels`,
        {
            cache: 'no-store'
        }
    ) 
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch webnovels" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
}