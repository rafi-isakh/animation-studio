import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("query");
    const response = await fetch(`http://localhost:5000/api/search?query=${query}`)
    const data = response.json();
    return NextResponse.json(data);
}