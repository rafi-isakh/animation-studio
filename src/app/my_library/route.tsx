import { NextResponse } from "next/server";
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    const parsedUrl = new URL(request.url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    let url = new URL(`${baseUrl}/library`);
    if (!session || !session.user) {
        url = new URL(`${baseUrl}/signin`)
    }
    return NextResponse.redirect(url);
}