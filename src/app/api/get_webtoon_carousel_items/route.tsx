import { NextResponse } from "next/server";

export async function GET() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webtoon_carousel_items`)
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch webtoon carousel items" }, { status: 500 })
    }
    const data = await response.json()
    return NextResponse.json(data)
}