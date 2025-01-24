import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { stars } = await request.json();
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const email = session.user.email
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/use_stars?email=${email}&stars=${stars}`,
        {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
                Provider: session.provider
            }
        }
    )
    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to use stars' }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json({ stars: data.stars }, { status: 200 });
}