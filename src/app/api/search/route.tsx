import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('query');
    const remember = request.nextUrl.searchParams.get('remember');
    if (!query) {
        return NextResponse.json({ error: "query is required" }, { status: 400 })
    }
    try {
        const session = await auth()
        if (session && remember === 'true') {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/save_search_query?query=${query}`, {
                headers: {
                    "Authorization": `Bearer ${session.accessToken}`,
                    "Provider": session.provider
                }
            })
            if (!response.ok) {
                console.error("Error saving search query")
            }
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/search?query=${query}`)
        if (!response.ok) {
            return NextResponse.json({ error: "error fetching data" }, { status: 500 })
        }
        const data = await response.json()
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching data", error)
        return NextResponse.json({ error: "error fetching data" }, { status: 500 })
    }
}