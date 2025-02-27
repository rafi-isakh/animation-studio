export const maxDuration = 300; // This function can run for a maximum of 300 seconds

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, context, n} = await request.json();
    if (!text || !context) {
        return NextResponse.json({ error: 'Text and context are required' }, { status: 400 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/generate_pictures`, {
        method: 'POST',
        body: JSON.stringify({ text, context, n }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
            'Provider': session.provider
        }
    })
    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to generate pictures', message: response.statusText }, { status: response.status });
    }
    const data = await response.json()
    return NextResponse.json(data)
}