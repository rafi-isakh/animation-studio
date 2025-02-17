import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const n = parseInt(searchParams.get('n') || '1');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/generate_pictures?text=${text}&n=${n}`)
    const data = await response.json()
    return NextResponse.json(data)
}