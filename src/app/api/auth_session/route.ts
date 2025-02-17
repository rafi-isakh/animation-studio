import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (session && session.user) {
        return NextResponse.json({
            loggedIn: true,
            email: session.user.email
        });
    } else {
        return NextResponse.json({
            loggedIn: false,
            email: ""
        });
    }
}