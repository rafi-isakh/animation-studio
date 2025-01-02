import { NextResponse } from "next/server";

export async function GET() {
    const start = performance.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_carousel_items`)
    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch carousel items" }, { status: response.status });
    }
    const data = await response.json()
    const end = performance.now();
    console.log(`get_carousel_items took ${end - start} milliseconds`)
    return NextResponse.json(data);
}