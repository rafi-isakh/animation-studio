import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth"

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');
    try {
        const session = await auth()
        if (session) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_recent_queries?email=${email}`, {
                headers: {
                    "Authorization": `Bearer ${session.accessToken}`,
                    "Provider": session.provider
                }
            })
            const data = await response.json()
            if (!response.ok) {
                return NextResponse.json({ error: "error fetching recent queries" }, { status: 500 })
            }
            return NextResponse.json(data)
        }
    } catch (error) {
        console.error("Error fetching recent queries")
        return NextResponse.json({ error: "error fetching recent queries" }, { status: 500 })
    }
    return NextResponse.json([])
}