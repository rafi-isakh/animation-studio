import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_by_id?id=${id}`)
    if (!response.ok) {
        throw new Error("Failed to fetch webnovel")
    }
    const data = await response.json();
    return NextResponse.json(data);
}